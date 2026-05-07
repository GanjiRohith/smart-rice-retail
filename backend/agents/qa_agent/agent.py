"""
qa_agent/agent.py
LangChain tool-calling agent for customer queries.
Uses Pinecone RAG + DB tools for order/payment status.
"""

import re
from langchain_core.tools    import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts  import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents        import create_tool_calling_agent, AgentExecutor
from sqlalchemy import text

from agents.shared.llm          import get_llm
from agents.qa_agent.retriever  import retrieve_documents


SYSTEM_PROMPT = """You are a helpful customer support assistant for a rice retail store.

You have tools to:
- Check order status by order ID
- Check payment status by order ID
- Search the knowledge base for product and policy questions

Rules:
- Always use tools to fetch real data before answering.
- Be friendly, clear, and concise.
- If you can't find an answer, politely say so.
- Never make up order or payment information.
"""


def make_qa_tools(db):

    @tool
    def get_order_status(order_id: int) -> str:
        """Get the current status of an order by order ID."""
        result = db.execute(
            text("SELECT order_status FROM orders WHERE order_id = :id"),
            {"id": order_id}
        ).fetchone()
        if not result:
            return f"Order #{order_id} not found."
        return f"Order #{order_id} status: {result[0]}"

    @tool
    def get_payment_status(order_id: int) -> str:
        """Get the payment status of an order by order ID."""
        result = db.execute(
            text("SELECT payment_status FROM orders WHERE order_id = :id"),
            {"id": order_id}
        ).fetchone()
        if not result:
            return f"Order #{order_id} not found."
        return f"Payment status for order #{order_id}: {result[0]}"

    @tool
    def search_knowledge_base(query: str) -> str:
        """Search the product knowledge base for information about rice products, policies, or FAQs."""
        documents = retrieve_documents(query)
        if not documents:
            return "No relevant information found in the knowledge base."
        return "\n\n".join(documents)

    @tool
    def get_available_products(_: str = "") -> list:
        """Get all currently available products with stock and pricing."""
        rows = db.execute(text("""
            SELECT rice_type, brand, price_per_kg, stock_quantity
            FROM products WHERE stock_quantity > 0 AND is_active = 1
        """)).fetchall()
        return [
            {"rice_type": r[0], "brand": r[1],
             "price_per_kg": float(r[2]), "stock_quantity": r[3]}
            for r in rows
        ]

    return [get_order_status, get_payment_status, search_knowledge_base, get_available_products]


def run_qa_agent(state: dict, db) -> dict:
    tools   = make_qa_tools(db)
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
        "agent":   "qa",
        "data":    None,
    }