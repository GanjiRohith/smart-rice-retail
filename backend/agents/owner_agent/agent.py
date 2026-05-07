"""
owner_agent/agent.py
LangChain tool-calling agent for owner management queries.
"""

from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts  import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents        import create_tool_calling_agent, AgentExecutor

from agents.shared.llm         import get_llm
from agents.owner_agent.tools  import make_owner_tools


SYSTEM_PROMPT = """You are an AI business assistant for a rice retail store owner.

You have tools to:
- View sales, orders, products, low stock
- Create, update price/stock, and delete products
- View recent orders

Rules:
- Always call the relevant tool before answering.
- For product operations, confirm what was done clearly.
- Give concise, actionable business insights.
- Use ₹ for prices.
"""


def run_owner_agent(state: dict, db) -> dict:
    tools   = make_owner_tools(db)
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
        "agent":   "owner",
        "data":    None,
    }