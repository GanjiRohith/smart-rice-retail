"""
routes/ai_routes.py
FastAPI routes — interface unchanged, now powered by LangGraph.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database.db      import get_db
from app.database         import models
from app.utils.deps       import get_current_user
from agents.shared.memory import clear_history

from agents.orchestrator_agent.orchestrator import OrchestratorAgent

router       = APIRouter()
orchestrator = OrchestratorAgent()


class ChatRequest(BaseModel):
    message:     str
    payload:     Optional[list] = None
    last_action: Optional[dict] = None


@router.post("/chat")
def chat(
    request: ChatRequest,
    db:      Session     = Depends(get_db),
    user:    models.User = Depends(get_current_user),
):
    result = orchestrator.run(
        query=request.message,
        role=user.role,
        user_id=user.user_id,
        db=db,
        payload=request.payload,
        last_action=request.last_action,
    )

    return {
        "success":         True,
        "response":        result.get("summary", ""),
        "agent":           result.get("agent"),
        "detected_intent": result.get("detected_intent"),
        "data":            result.get("data"),
    }


@router.delete("/memory")
def delete_memory(
    db:   Session     = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    clear_history(db, user.user_id)
    return {"success": True, "message": "Conversation history cleared."}


@router.post("/forecast")
def forecast(
    request: ChatRequest,
    db:      Session     = Depends(get_db),
    user:    models.User = Depends(get_current_user),
):
    from agents.forecast_agent.agent import run_forecast_agent
    state = {
        "query": request.message, "role": user.role,
        "user_id": user.user_id, "payload": request.payload,
        "history": [], "agent": "forecast",
        "needs_clarify": False, "summary": "", "data": None, "detected_intent": None,
    }
    result = run_forecast_agent(state, db)
    return {"success": True, "forecast": result}


@router.get("/analytics")
def analytics(
    db:   Session     = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    from agents.analytics_agent.agent import run_analytics_agent
    state = {
        "query": "Generate business analytics summary", "role": user.role,
        "user_id": user.user_id, "payload": None,
        "history": [], "agent": "analytics",
        "needs_clarify": False, "summary": "", "data": None, "detected_intent": None,
    }
    result = run_analytics_agent(state, db)
    return {"success": True, "analytics": result}


@router.get("/inventory")
def inventory(
    db:   Session     = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    from agents.inventory_agent.agent import run_inventory_agent
    state = {
        "query": "Generate inventory summary", "role": user.role,
        "user_id": user.user_id, "payload": None,
        "history": [], "agent": "inventory",
        "needs_clarify": False, "summary": "", "data": None, "detected_intent": None,
    }
    result = run_inventory_agent(state, db)
    return {"success": True, "inventory": result}


@router.get("/anomalies")
def anomalies(
    db:   Session     = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    from agents.anomaly_agent.agent import run_anomaly_agent
    state = {
        "query": "Detect all anomalies", "role": user.role,
        "user_id": user.user_id, "payload": None,
        "history": [], "agent": "anomaly",
        "needs_clarify": False, "summary": "", "data": None, "detected_intent": None,
    }
    result = run_anomaly_agent(state, db)
    return {"success": True, "anomalies": result}


@router.get("/payments")
def payments(
    db:   Session     = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    from agents.payment_agent.agent import run_payment_agent
    state = {
        "query": "Generate payment summary", "role": user.role,
        "user_id": user.user_id, "payload": None,
        "history": [], "agent": "payment",
        "needs_clarify": False, "summary": "", "data": None, "detected_intent": None,
    }
    result = run_payment_agent(state, db)
    return {"success": True, "payments": result}