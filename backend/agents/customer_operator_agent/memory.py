class OperatorMemory:

    def __init__(self):

        self.steps = []

        self.goal = ""

        self.completed = False

    # =========================
    # SET GOAL
    # =========================

    def set_goal(
        self,
        goal
    ):

        self.goal = goal

    # =========================
    # ADD STEP
    # =========================

    def add_step(
        self,
        step
    ):

        self.steps.append(step)

    # =========================
    # GET HISTORY
    # =========================

    def get_history(self):

        return "\n".join(self.steps)

    # =========================
    # MARK COMPLETE
    # =========================

    def mark_complete(self):

        self.completed = True