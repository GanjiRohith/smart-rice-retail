import os
import json

from dotenv import load_dotenv

from openai import OpenAI

from agents.frontend_operator.prompt import (
    FRONTEND_OPERATOR_PROMPT
)

load_dotenv()


class FrontendOperatorAgent:

    def __init__(self):

        self.client = OpenAI(

            api_key=os.getenv(
                "OPENAI_API_KEY"
            )
        )

    # =========================
    # RUN OPERATOR
    # =========================

    def run(
        self,
        command,
        dom,
        history=[]
    ):

        response = self.client.chat.completions.create(

            model=os.getenv(
                "OPERATOR_MODEL"
            ),


            messages=[

                {
                    "role": "system",

                    "content":
                        FRONTEND_OPERATOR_PROMPT
                },

                {
                    "role": "user",

                    "content": f"""

USER GOAL:
{command}

CURRENT DOM:
{json.dumps(dom)[:7000]}

PREVIOUS ACTION HISTORY:
{json.dumps(history)[-3000:]}

IMPORTANT:
- Avoid repeated actions
- Avoid loops
- If product already in cart, continue checkout
- If already on checkout, proceed payment
- If order complete, return:
{{"action":"done"}}

Return ONLY JSON.

"""
                }
            ]
        )

        content = (

            response
            .choices[0]
            .message
            .content
        )

        print(
            "\n========== AI ACTION =========="
        )

        print(content)

        print(
            "================================\n"
        )

        try:

            return json.loads(content)

        except Exception as e:

            print(
                "JSON ERROR:",
                str(e)
            )

            return {
                "action": "done"
            }