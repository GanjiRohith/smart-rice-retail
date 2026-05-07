import os
import time

from dotenv import load_dotenv

from agents.customer_operator_agent.browser_tools import (
    BrowserController
)

from agents.customer_operator_agent.planner import (
    OperatorPlanner
)

from agents.customer_operator_agent.memory import (
    OperatorMemory
)

load_dotenv()


class CustomerOperatorAgent:

    def __init__(self):

        self.browser = BrowserController()

        self.planner = OperatorPlanner()

        self.memory = OperatorMemory()

    # =========================
    # EXECUTE ACTION
    # =========================

    def execute_action(
        self,
        action_data
    ):

        action = action_data.get("action")

        print(f"\n[ACTION] {action_data}\n")

        try:

            # =========================
            # OPEN
            # =========================

            if action == "open":

                return self.browser.open(
                    action_data.get("url")
                )

            # =========================
            # CLICK
            # =========================

            elif action == "click":

                selector = action_data.get(
                    "selector"
                )

                return self.browser.click(
                    selector
                )

            # =========================
            # TYPE
            # =========================

            elif action == "type":

                selector = action_data.get(
                    "selector"
                )

                text = action_data.get(
                    "text"
                )

                return self.browser.type(
                    selector,
                    text
                )

            # =========================
            # WAIT
            # =========================

            elif action == "wait":

                time.sleep(0.5)

                return "Waited"

            # =========================
            # DONE
            # =========================

            elif action == "done":

                self.memory.mark_complete()

                return "Task completed"

            return "Unknown action"

        except Exception as e:

            return f"Action failed: {str(e)}"

    # =========================
    # MAIN LOOP
    # =========================

    def run(
        self,
        goal
    ):

        self.memory.set_goal(goal)

        frontend_url = os.getenv(
            "FRONTEND_URL"
        )

        self.browser.open(frontend_url)

        time.sleep(1)

        max_steps = 8

        for step in range(max_steps):

            print(f"\n========== STEP {step+1} ==========\n")

            page_text = self.browser.get_page_text()

            elements = self.browser.get_interactive_elements()[:15]

            history = self.memory.get_history()

            # =========================
            # FAST LOGIN SHORTCUT
            # =========================

            if (
                "Sign In" in page_text
                and "Signing in..." not in page_text
            ):

                print("\n[FAST PATH] LOGIN\n")

                self.browser.type(
                    "you@example.com",
                    "user1@test.com"
                )

                self.browser.type(
                    "••••••••",
                    "user123"
                )

                self.browser.click(
                    "Sign In"
                )

                time.sleep(2)

                continue

                        # =========================
            # FAST ADD TO CART
            # =========================

            if (
                "Add to Cart" in page_text
                and "Cart" not in history
            ):

                print("\n[FAST PATH] ADD TO CART\n")

                self.browser.page.get_by_role(
                    "button",
                    name="Add to Cart"
                ).first.click()

                self.memory.add_step(
                    "Cart item added"
                )

                time.sleep(1)

                continue
            # =========================
            # FAST CHECKOUT
            # =========================

            if (
                "Checkout" in page_text
                and "Checkout completed" not in history
            ):

                print("\n[FAST PATH] CHECKOUT\n")

                self.browser.click("Checkout")

                self.memory.add_step(
                    "Checkout completed"
                )

                time.sleep(1)

                continue
            
            # =========================
            # TASK COMPLETE
            # =========================

            if (
                "Order placed" in page_text
                or "Checkout completed" in history
            ):

                print("\n[TASK COMPLETED]\n")

                self.memory.mark_complete()

                break

            print("\n=== INTERACTIVE ELEMENTS ===\n")

            for e in elements:

                print(e)

            print("\n============================\n")

            plan = self.planner.plan(
                goal=goal,
                page_text=page_text,
                history=history,
                elements=elements
            )

            result = self.execute_action(
                plan
            )

            self.memory.add_step(
                f"""

STEP {step+1}

PLAN:
{plan}

RESULT:
{result}

"""
            )

            print(f"\n[RESULT] {result}\n")

            if self.memory.completed:

                break

        return {
            "goal": goal,
            "history": self.memory.steps
        }