"""
orchestrator_agent/graph.py
Full LangGraph graph wiring all agents together.

Graph flow:
  START → router_node → (inventory | analytics | qa | owner |
                          forecast | anomaly | payment | clarify_node)
                       → save_memory_node → END
"""

from langgraph.graph  import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage

from agents.shared.state  import AgentState
from agents.shared.memory import load_history, save_turn
from agents.shared.llm    import get_llm

from agents.inventory_agent.agent import run_inventory_agent
from agents.analytics_agent.agent import run_analytics_agent
from agents.owner_agent.agent     import run_owner_agent
from agents.qa_agent.agent        import run_qa_agent
from agents.anomaly_agent.agent   import run_anomaly_agent
from agents.payment_agent.agent   import run_payment_agent
from agents.forecast_agent.agent  import run_forecast_agent


# ─────────────────────────────────────────────────────────────
# NODE: router
# Uses the LLM to decide which agent to call.
# If it can't decide → sets needs_clarify = True
# ─────────────────────────────────────────────────────────────

ROUTER_PROMPT = """You are a routing assistant for a rice retail management system.

Based on the user's message, choose the best agent:

- inventory   → stock levels, add/reduce/set stock, product quantities
- analytics   → sales reports, revenue trends, business summaries, top products
- forecast    → demand predictions, future stock needs, seasonal trends
- anomaly     → fraud detection, suspicious transactions, risk alerts
- payment     → payment summaries, transactions, revenue, failed payments
- owner       → create/delete products, update prices, recent orders, general owner tasks
- qa          → customer questions, order status, product availability (ALWAYS for role=customer)
- clarify     → query is too vague or ambiguous to route confidently

Reply with ONLY one of these exact words: inventory, analytics, forecast, anomaly, payment, owner, qa, clarify
"""


def router_node(state: AgentState) -> AgentState:
    # Customers always go to QA
    if state["role"] == "customer":
        return {**state, "agent": "qa", "needs_clarify": False}

    llm      = get_llm()
    messages = [
        SystemMessage(content=ROUTER_PROMPT),
        HumanMessage(content=state["query"]),
    ]

    response = llm.invoke(messages)
    choice   = response.content.strip().lower()

    valid = {"inventory", "analytics", "forecast", "anomaly", "payment", "owner", "qa", "clarify"}
    if choice not in valid:
        choice = "clarify"

    return {
        **state,
        "agent":         choice,
        "needs_clarify": choice == "clarify",
    }


# ─────────────────────────────────────────────────────────────
# NODE: clarify
# Asks user to clarify when routing isn't confident
# ─────────────────────────────────────────────────────────────

def clarify_node(state: AgentState) -> AgentState:
    return {
        **state,
        "summary": (
            "I'm not sure what you're asking about. Could you clarify? "
            "You can ask about:\n"
            "• 📦 Inventory & stock levels\n"
            "• 📊 Sales analytics & reports\n"
            "• 🔮 Demand forecasts\n"
            "• 🚨 Anomalies & fraud\n"
            "• 💳 Payments & revenue\n"
            "• 🛒 Products & orders"
        ),
        "agent": "clarify",
    }


# ─────────────────────────────────────────────────────────────
# NODE: agent wrappers
# Each node receives state + db via closure (see build_graph)
# ─────────────────────────────────────────────────────────────

def make_agent_nodes(db):
    """Returns all agent node functions bound to the request-scoped db."""

    def inventory_node(state: AgentState) -> AgentState:
        return run_inventory_agent(state, db)

    def analytics_node(state: AgentState) -> AgentState:
        return run_analytics_agent(state, db)

    def owner_node(state: AgentState) -> AgentState:
        return run_owner_agent(state, db)

    def qa_node(state: AgentState) -> AgentState:
        return run_qa_agent(state, db)

    def anomaly_node(state: AgentState) -> AgentState:
        return run_anomaly_agent(state, db)

    def payment_node(state: AgentState) -> AgentState:
        return run_payment_agent(state, db)

    def forecast_node(state: AgentState) -> AgentState:
        return run_forecast_agent(state, db)

    return {
        "inventory": inventory_node,
        "analytics": analytics_node,
        "owner":     owner_node,
        "qa":        qa_node,
        "anomaly":   anomaly_node,
        "payment":   payment_node,
        "forecast":  forecast_node,
    }


# ─────────────────────────────────────────────────────────────
# NODE: save memory
# Persists the turn to agent_sessions after every response
# ─────────────────────────────────────────────────────────────

def make_memory_node(db):
    def save_memory_node(state: AgentState) -> AgentState:
        save_turn(
            db=db,
            user_id=state["user_id"],
            agent_name=state.get("agent", "unknown"),
            query=state["query"],
            response=state.get("summary", ""),
        )
        return state
    return save_memory_node


# ─────────────────────────────────────────────────────────────
# CONDITIONAL EDGE: router → agent
# ─────────────────────────────────────────────────────────────

def route_to_agent(state: AgentState) -> str:
    """Returns the next node name based on the router's decision."""
    return state.get("agent", "clarify")


# ─────────────────────────────────────────────────────────────
# BUILD GRAPH
# Called once per request with the scoped db session
# ─────────────────────────────────────────────────────────────

def build_graph(db):
    """
    Builds and compiles the LangGraph for one request.
    db is the SQLAlchemy session for this request.
    """
    agent_nodes = make_agent_nodes(db)
    memory_node = make_memory_node(db)

    graph = StateGraph(AgentState)

    # ── add nodes ──────────────────────────────────────────
    graph.add_node("router",    router_node)
    graph.add_node("clarify",   clarify_node)
    graph.add_node("inventory", agent_nodes["inventory"])
    graph.add_node("analytics", agent_nodes["analytics"])
    graph.add_node("owner",     agent_nodes["owner"])
    graph.add_node("qa",        agent_nodes["qa"])
    graph.add_node("anomaly",   agent_nodes["anomaly"])
    graph.add_node("payment",   agent_nodes["payment"])
    graph.add_node("forecast",  agent_nodes["forecast"])
    graph.add_node("save_memory", memory_node)

    # ── entry point ────────────────────────────────────────
    graph.set_entry_point("router")

    # ── conditional edges from router ──────────────────────
    graph.add_conditional_edges(
        "router",
        route_to_agent,
        {
            "inventory": "inventory",
            "analytics": "analytics",
            "owner":     "owner",
            "qa":        "qa",
            "anomaly":   "anomaly",
            "payment":   "payment",
            "forecast":  "forecast",
            "clarify":   "clarify",
        }
    )

    # ── all agents → save_memory → END ─────────────────────
    for node in ["inventory", "analytics", "owner", "qa",
                 "anomaly", "payment", "forecast", "clarify"]:
        graph.add_edge(node, "save_memory")

    graph.add_edge("save_memory", END)

    return graph.compile()