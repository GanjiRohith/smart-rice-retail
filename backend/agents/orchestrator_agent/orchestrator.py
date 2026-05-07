"""
orchestrator_agent/orchestrator.py
Thin wrapper that builds the graph per request and runs it.
"""

from agents.shared.memory              import load_history
from agents.orchestrator_agent.graph   import build_graph


class OrchestratorAgent:

    def run(
        self,
        query:       str,
        role:        str,
        user_id:     int,
        db,
        payload=None,
        last_action=None,   # kept for backwards compat
    ) -> dict:

        # 1. Load history from DB
        history = load_history(db, user_id, limit=6)

        # 2. Build initial state
        initial_state = {
            "query":           query,
            "role":            role,
            "user_id":         user_id,
            "payload":         payload,
            "agent":           "",
            "needs_clarify":   False,
            "history":         history,
            "summary":         "",
            "data":            None,
            "detected_intent": None,
        }

        # 3. Build + run the graph
        graph        = build_graph(db)
        final_state  = graph.invoke(initial_state)

        # 4. Return unified response shape
        return {
            "summary":         final_state.get("summary", ""),
            "agent":           final_state.get("agent", ""),
            "data":            final_state.get("data"),
            "detected_intent": final_state.get("detected_intent"),
        }