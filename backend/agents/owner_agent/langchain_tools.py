from langchain.tools import tool


@tool
def sales_tool():

    """
    Get sales analytics.
    """

    return "sales tool"


@tool
def inventory_tool():

    """
    Get inventory analytics.
    """

    return "inventory tool"


@tool
def product_tool():

    """
    Manage products.
    """

    return "product tool"


TOOLS = [
    sales_tool,
    inventory_tool,
    product_tool
]