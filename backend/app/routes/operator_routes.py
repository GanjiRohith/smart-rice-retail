from fastapi import APIRouter

from pydantic import BaseModel

from agents.frontend_operator.agent import (
    FrontendOperatorAgent
)

router = APIRouter()

agent = FrontendOperatorAgent()


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

    result = agent.run(

        command=request.command,

        dom=request.dom,

        history=request.history
    )

    return result