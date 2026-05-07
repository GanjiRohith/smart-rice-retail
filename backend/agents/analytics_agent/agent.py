"""
analytics_agent/agent.py
LangChain tool-calling agent for business analytics.
"""

from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts  import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents        import create_tool_calling_agent, AgentExecutor

from agents.shared.llm            import get_llm
from agents.analytics_agent.tools import make_analytics_tools


SYSTEM_PROMPT = """You are an AI retail analytics assistant for a rice store.

You have tools to fetch:
- Total sales, orders, average order value
- Top selling products
- Daily sales trends
- Low stock products
- Total customers

Rules:
- Always call the relevant tools before answering.
- Give concise, actionable business insights.
- Use ₹ for rupee amounts.
- Highlight trends, risks, and opportunities.
"""


def run_analytics_agent(state: dict, db) -> dict:
    tools   = make_analytics_tools(db)
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
        "agent":   "analytics",
        "data":    None,
    }