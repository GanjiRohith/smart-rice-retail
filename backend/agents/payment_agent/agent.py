"""
payment_agent/agent.py
LangChain tool-calling agent for payment and revenue queries.
"""

from langchain_core.tools    import tool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts  import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents        import create_tool_calling_agent, AgentExecutor
from sqlalchemy import text

from agents.shared.llm import get_llm


SYSTEM_PROMPT = """You are an AI payment and revenue assistant for a rice retail store.

You have tools to fetch:
- Total revenue, payment summaries
- Recent transactions
- Failed/pending payments
- Payment method breakdown

Rules:
- Always call tools before answering.
- Use ₹ for rupee amounts.
- Highlight any payment issues clearly.
- Be concise and professional.
"""


def make_payment_tools(db):

    @tool
    def get_revenue_summary(_: str = "") -> dict:
        """Get total revenue broken down by payment status."""
        rows = db.execute(text("""
            SELECT payment_status, COUNT(*), COALESCE(SUM(total_amount), 0)
            FROM orders
            GROUP BY payment_status
        """)).fetchall()
        return {r[0]: {"count": r[1], "total": float(r[2])} for r in rows}

    @tool
    def get_recent_transactions(_: str = "") -> list:
        """Get the 10 most recent payment transactions."""
        rows = db.execute(text("""
            SELECT TOP 10
                p.payment_id, p.amount, p.payment_method,
                p.payment_status, p.created_at, o.order_id
            FROM payments p
            JOIN orders o ON p.order_id = o.order_id
            ORDER BY p.created_at DESC
        """)).fetchall()
        return [
            {"payment_id": r[0], "amount": float(r[1]), "method": r[2],
             "status": r[3], "created_at": str(r[4]), "order_id": r[5]}
            for r in rows
        ]

    @tool
    def get_failed_payments(_: str = "") -> list:
        """Get all failed payment transactions."""
        rows = db.execute(text("""
            SELECT p.payment_id, p.amount, p.payment_method, p.created_at, o.order_id
            FROM payments p
            JOIN orders o ON p.order_id = o.order_id
            WHERE p.payment_status = 'failed'
            ORDER BY p.created_at DESC
        """)).fetchall()
        return [
            {"payment_id": r[0], "amount": float(r[1]), "method": r[2],
             "created_at": str(r[3]), "order_id": r[4]}
            for r in rows
        ]

    @tool
    def get_payment_method_breakdown(_: str = "") -> list:
        """Get revenue breakdown by payment method."""
        rows = db.execute(text("""
            SELECT payment_method, COUNT(*), SUM(amount)
            FROM payments
            WHERE payment_status = 'paid'
            GROUP BY payment_method
        """)).fetchall()
        return [
            {"method": r[0], "count": r[1], "total": float(r[2] or 0)}
            for r in rows
        ]

    @tool
    def get_pending_payments(_: str = "") -> list:
        """Get all pending payment orders."""
        rows = db.execute(text("""
            SELECT TOP 10 order_id, total_amount, order_date
            FROM orders WHERE payment_status = 'pending'
            ORDER BY order_date DESC
        """)).fetchall()
        return [
            {"order_id": r[0], "total_amount": float(r[1]), "order_date": str(r[2])}
            for r in rows
        ]

    return [
        get_revenue_summary,
        get_recent_transactions,
        get_failed_payments,
        get_payment_method_breakdown,
        get_pending_payments,
    ]


def run_payment_agent(state: dict, db) -> dict:
    tools   = make_payment_tools(db)
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
        "agent":   "payment",
        "data":    None,
    }