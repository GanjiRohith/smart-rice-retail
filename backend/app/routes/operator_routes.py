from fastapi import APIRouter

from pydantic import BaseModel

from agents.frontend_operator.agent import (
    FrontendOperatorAgent
)

router = APIRouter()

_agent = None

def get_agent():
    global _agent
    if _agent is None:
        _agent = FrontendOperatorAgent()
    return _agent


# =========================
# REQUEST MODEL
# =========================

class OperatorRequest(BaseModel):

    command: str

    dom: dict

    history: list = []


# =========================
# OPERATOR ENDPOINT
# =========================

@router.post("/operator")

def operate(
    request: OperatorRequest
):

    result = get_agent().run(

        command=request.command,

        dom=request.dom,

        history=request.history
    )

    return result