import os
import json

from dotenv import load_dotenv

from openai import OpenAI

from agents.customer_operator_agent.prompt import (
    OPERATOR_PROMPT
)

load_dotenv()


class OperatorPlanner:

    def __init__(self):

        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )

    def plan(
        self,
        goal,
        page_text,
        history,
        elements
    ):

        response = self.client.chat.completions.create(

            model=os.getenv("OPERATOR_MODEL"),

            messages=[

                {
                    "role": "system",
                    "content": OPERATOR_PROMPT
                },

                {
                    "role": "user",
                    "content": f"""

USER GOAL:
{goal}

CURRENT PAGE TEXT:
{page_text[:1200]}

INTERACTIVE ELEMENTS:
{json.dumps(elements[:40], indent=2)}

PREVIOUS STEPS:
{history}

Decide ONLY the NEXT best action.

Return ONLY valid JSON.

"""
                }
            ],

        )

        content = response.choices[0].message.content

        print("\n========== LLM PLAN ==========")
        print(content)
        print("================================\n")

        try:

            return json.loads(content)

        except Exception as e:

            print("JSON PARSE ERROR:", e)

            return {
                "action": "wait",
                "reason": "Could not parse model response"
            }