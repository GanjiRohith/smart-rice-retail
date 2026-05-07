"""
shared/state.py
LangGraph shared state passed through every node in the graph.
"""

from typing import TypedDict, List, Dict, Any, Optional


class AgentState(TypedDict):
    # ── input ──────────────────────────────────────
    query:          str
    role:           str                  # "owner" | "customer"
    user_id:        int
    payload:        Optional[Any]        # extra data (e.g. forecast payload)

    # ── routing ────────────────────────────────────
    agent:          str                  # which agent was chosen
    needs_clarify:  bool                 # True → ask user to clarify

    # ── memory ─────────────────────────────────────
    history:        List[Dict[str, str]] # past turns [{role, content}, ...]

    # ── output ─────────────────────────────────────
    summary:        str                  # final text response to user
    data:           Optional[Dict]       # structured data (charts, tables etc.)
    detected_intent: Optional[Dict]      # inventory write intent if any