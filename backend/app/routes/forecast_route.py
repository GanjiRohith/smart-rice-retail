from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.utils.deps import get_current_user
from app.database import models

from agents.forecast_agent.agent import run_forecast_agent

router = APIRouter()


class ForecastRequest(BaseModel):
    message: Optional[str] = None


@router.post("/forecast")
def forecast(
    request: ForecastRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):

    state = {
        "query":   request.message or "Give demand forecast summary",
        "history": []
    }

    result = run_forecast_agent(state, db)

    return {
        "success":  True,
        "forecast": result
    }