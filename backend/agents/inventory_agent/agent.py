"""
inventory_agent/agent.py
LangChain tool-calling agent for inventory reads and writes.
The LLM decides which tool to call based on the user query.
"""

from langchain_core.messages   import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts    import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents          import create_tool_calling_agent, AgentExecutor

from agents.shared.llm         import get_llm
from agents.inventory_agent.tools import make_inventory_tools


SYSTEM_PROMPT = """You are an AI inventory assistant for a rice retail store.

You have tools to:
- Read inventory, low stock, out-of-stock, inventory value
- Search for products by name
- Add, reduce, or set stock quantities

Rules:
- Always call the appropriate tool before responding.
- When a stock change is made, confirm with before/after numbers.
- Never ask the user to repeat themselves.
- Be concise and professional.
- Use ₹ for prices and "units" for quantities.
"""


def run_inventory_agent(state: dict, db) -> dict:
    """
    LangGraph node function.
    Receives AgentState, returns updated AgentState with summary + data.
    """
    tools   = make_inventory_tools(db)
    llm     = get_llm()
    history = state.get("history", [])

    # Build prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    # Create tool-calling agent
    agent          = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=False)

    # Convert history to LangChain messages
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
        "agent":   "inventory",
        "data":    None,   # tool outputs are embedded in the response text
    }