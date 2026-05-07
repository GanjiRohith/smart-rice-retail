"""
analytics_agent/tools.py
LangChain @tool decorated analytics queries.
"""

from langchain_core.tools import tool
from sqlalchemy import text


def make_analytics_tools(db):

    @tool
    def get_total_sales(_: str = "") -> float:
        """Get total revenue from paid orders in rupees."""
        return float(db.execute(text(
            "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status='paid'"
        )).scalar() or 0)

    @tool
    def get_total_orders(_: str = "") -> int:
        """Get total number of orders."""
        return db.execute(text("SELECT COUNT(*) FROM orders")).scalar()

    @tool
    def get_average_order_value(_: str = "") -> float:
        """Get average order value in rupees."""
        return round(float(db.execute(text(
            "SELECT COALESCE(AVG(total_amount), 0) FROM orders"
        )).scalar() or 0), 2)

    @tool
    def get_top_products(_: str = "") -> list:
        """Get top selling products by quantity sold."""
        rows = db.execute(text("""
            SELECT p.rice_type, SUM(oi.quantity) as total_qty
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.rice_type
            ORDER BY total_qty DESC
        """)).fetchall()
        return [{"rice_type": r[0], "quantity_sold": int(r[1])} for r in rows]

    @tool
    def get_daily_sales(_: str = "") -> list:
        """Get daily sales totals ordered by most recent first."""
        rows = db.execute(text("""
            SELECT CAST(order_date AS DATE), SUM(total_amount)
            FROM orders
            GROUP BY CAST(order_date AS DATE)
            ORDER BY CAST(order_date AS DATE) DESC
        """)).fetchall()
        return [{"date": str(r[0]), "sales": float(r[1])} for r in rows]

    @tool
    def get_low_stock_products(_: str = "") -> list:
        """Get products with stock below 50 units."""
        rows = db.execute(text(
            "SELECT rice_type, stock_quantity FROM products WHERE stock_quantity < 50"
        )).fetchall()
        return [{"rice_type": r[0], "stock_quantity": r[1]} for r in rows]

    @tool
    def get_total_customers(_: str = "") -> int:
        """Get total number of customers."""
        return db.execute(text(
            "SELECT COUNT(*) FROM users WHERE role='customer'"
        )).scalar()

    return [
        get_total_sales,
        get_total_orders,
        get_average_order_value,
        get_top_products,
        get_daily_sales,
        get_low_stock_products,
        get_total_customers,
    ]