"""
forecast_agent/agent.py
LangChain tool-calling agent for demand forecasting.
"""

from langchain_core.tools    import tool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts  import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents        import create_tool_calling_agent, AgentExecutor
from sqlalchemy import text

from agents.shared.llm import get_llm


SYSTEM_PROMPT = """You are an AI demand forecasting assistant for a rice retail store.

You have tools to fetch:
- Historical sales data by product
- Existing demand forecasts
- Current inventory vs predicted demand
- Seasonal and trend data

Rules:
- Always call tools before answering.
- Give clear demand predictions with reasoning.
- Flag products that need restocking based on forecasts.
- Use units (kg) for quantities and ₹ for prices.
"""


def make_forecast_tools(db):

    @tool
    def get_sales_history(rice_type: str = "") -> list:
        """Get historical sales data. Optionally filter by rice_type."""
        if rice_type:
            rows = db.execute(text("""
                SELECT TOP 30 date, rice_type, quantity_sold, price_per_kg, season, festival_flag
                FROM sales
                WHERE LOWER(rice_type) LIKE :name
                ORDER BY date DESC
            """), {"name": f"%{rice_type.lower()}%"}).fetchall()
        else:
            rows = db.execute(text("""
                SELECT TOP 30 date, rice_type, quantity_sold, price_per_kg, season, festival_flag
                FROM sales ORDER BY date DESC
            """)).fetchall()
        return [
            {"date": str(r[0]), "rice_type": r[1], "quantity_sold": float(r[2] or 0),
             "price_per_kg": float(r[3] or 0), "season": r[4], "festival": bool(r[5])}
            for r in rows
        ]

    @tool
    def get_demand_forecasts(_: str = "") -> list:
        """Get existing demand forecasts from the database."""
        rows = db.execute(text("""
            SELECT TOP 20
                df.forecast_id, p.rice_type, df.forecast_date,
                df.predicted_quantity, df.confidence_score
            FROM demand_forecasts df
            JOIN products p ON df.product_id = p.product_id
            ORDER BY df.forecast_date ASC
        """)).fetchall()
        return [
            {"forecast_id": r[0], "rice_type": r[1], "forecast_date": str(r[2]),
             "predicted_quantity": float(r[3] or 0), "confidence_score": float(r[4] or 0)}
            for r in rows
        ]

    @tool
    def get_stock_vs_forecast(_: str = "") -> list:
        """Compare current stock levels against predicted demand."""
        rows = db.execute(text("""
            SELECT
                p.rice_type,
                p.stock_quantity as current_stock,
                COALESCE(SUM(df.predicted_quantity), 0) as total_predicted
            FROM products p
            LEFT JOIN demand_forecasts df ON p.product_id = df.product_id
            GROUP BY p.rice_type, p.stock_quantity
        """)).fetchall()
        result = []
        for r in rows:
            stock     = r[1]
            predicted = float(r[2])
            gap       = stock - predicted
            result.append({
                "rice_type":        r[0],
                "current_stock":    stock,
                "predicted_demand": predicted,
                "gap":              round(gap, 2),
                "needs_restock":    gap < 0
            })
        return result

    @tool
    def get_top_selling_by_season(_: str = "") -> list:
        """Get top selling products grouped by season."""
        rows = db.execute(text("""
            SELECT season, rice_type, SUM(quantity_sold) as total
            FROM sales
            GROUP BY season, rice_type
            ORDER BY season, total DESC
        """)).fetchall()
        return [
            {"season": r[0], "rice_type": r[1], "total_sold": float(r[2] or 0)}
            for r in rows
        ]

    return [get_sales_history, get_demand_forecasts, get_stock_vs_forecast, get_top_selling_by_season]


def run_forecast_agent(state: dict, db) -> dict:
    tools   = make_forecast_tools(db)
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
        "agent":   "forecast",
        "data":    None,
    }