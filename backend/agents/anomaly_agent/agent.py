"""
anomaly_agent/agent.py
LangChain tool-calling agent for anomaly detection.
Uses IsolationForest for ML-based detection + DB tools.
"""

import pandas as pd
from sklearn.ensemble        import IsolationForest
from langchain_core.tools    import tool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts  import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents        import create_tool_calling_agent, AgentExecutor
from sqlalchemy import text

from agents.shared.llm import get_llm


SYSTEM_PROMPT = """You are an AI anomaly detection assistant for a rice retail store.

You have tools to detect:
- Unusual sales amounts (ML-based outlier detection)
- Failed payments
- Critical inventory risks (stock near zero)

Rules:
- Always call tools to get real data before answering.
- Clearly explain what each anomaly means and its potential impact.
- Prioritize critical risks.
- Be concise and actionable.
"""


def make_anomaly_tools(db):

    @tool
    def detect_sales_anomalies(_: str = "") -> list:
        """Detect statistically unusual order amounts using ML anomaly detection."""
        rows = db.execute(text(
            "SELECT order_id, total_amount, payment_status, order_date FROM orders"
        )).fetchall()

        if len(rows) < 10:
            return [{"info": "Not enough data for anomaly detection (need 10+ orders)."}]

        df = pd.DataFrame(rows, columns=["order_id", "total_amount", "payment_status", "order_date"])
        model = IsolationForest(contamination=0.05, random_state=42)
        df["anomaly"] = model.fit_predict(df[["total_amount"]])

        anomalies = df[df["anomaly"] == -1]
        return [
            {"order_id": int(r["order_id"]), "total_amount": float(r["total_amount"]),
             "payment_status": r["payment_status"], "order_date": str(r["order_date"])}
            for _, r in anomalies.iterrows()
        ]

    @tool
    def get_failed_payments(_: str = "") -> list:
        """Get all orders with failed payment status."""
        rows = db.execute(text(
            "SELECT order_id, total_amount, order_date FROM orders WHERE payment_status='failed'"
        )).fetchall()
        return [
            {"order_id": r[0], "total_amount": float(r[1]), "order_date": str(r[2])}
            for r in rows
        ]

    @tool
    def get_critical_stock_risks(_: str = "") -> list:
        """Get products with critically low stock (below 20 units)."""
        rows = db.execute(text(
            "SELECT product_id, rice_type, stock_quantity FROM products WHERE stock_quantity < 20"
        )).fetchall()
        return [
            {"product_id": r[0], "rice_type": r[1], "stock_quantity": r[2]}
            for r in rows
        ]

    @tool
    def get_anomaly_logs(_: str = "") -> list:
        """Get previously logged anomalies from the anomaly_logs table."""
        rows = db.execute(text("""
            SELECT TOP 20 anomaly_id, anomaly_type, description, detected_at, resolved
            FROM anomaly_logs
            ORDER BY detected_at DESC
        """)).fetchall()
        return [
            {"anomaly_id": r[0], "anomaly_type": r[1], "description": r[2],
             "detected_at": str(r[3]), "resolved": r[4]}
            for r in rows
        ]

    return [detect_sales_anomalies, get_failed_payments, get_critical_stock_risks, get_anomaly_logs]


def run_anomaly_agent(state: dict, db) -> dict:
    tools   = make_anomaly_tools(db)
    llm     = get_llm()
    history = state.get("history", [])

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    agent          = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=False)

    chat_history = []
    for msg in history:
        if msg["role"] == "user":
            chat_history.append(HumanMessage(content=msg["content"]))
        else:
            chat_history.append(AIMessage(content=msg["content"]))

    result = agent_executor.invoke({
        "input":        state["query"],
        "chat_history": chat_history,
    })

    return {
        **state,
        "summary": result["output"],
        "agent":   "anomaly",
        "data":    None,
    }