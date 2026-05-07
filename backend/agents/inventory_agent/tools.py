"""
inventory_agent/tools.py
LangChain @tool decorated functions for inventory reads and writes.
Each tool receives `db` via a closure created in InventoryAgent.get_tools(db).
"""

import re
from typing import Optional
from langchain_core.tools import tool
from sqlalchemy import text


def make_inventory_tools(db):
    """
    Returns a list of LangChain tools bound to the current DB session.
    Call this inside the agent node, passing the request-scoped db.
    """

    @tool
    def get_all_products(_: str = "") -> list:
        """Get all products with their stock levels and prices."""
        rows = db.execute(text(
            "SELECT product_id, rice_type, brand, price_per_kg, stock_quantity FROM products"
        )).fetchall()
        return [
            {"product_id": r[0], "rice_type": r[1], "brand": r[2],
             "price_per_kg": float(r[3]), "stock_quantity": r[4]}
            for r in rows
        ]

    @tool
    def get_low_stock(_: str = "") -> list:
        """Get products with stock below 50 units."""
        rows = db.execute(text(
            "SELECT product_id, rice_type, stock_quantity FROM products WHERE stock_quantity < 50"
        )).fetchall()
        return [{"product_id": r[0], "rice_type": r[1], "stock_quantity": r[2]} for r in rows]

    @tool
    def get_out_of_stock(_: str = "") -> list:
        """Get products with zero stock."""
        rows = db.execute(text(
            "SELECT product_id, rice_type FROM products WHERE stock_quantity <= 0"
        )).fetchall()
        return [{"product_id": r[0], "rice_type": r[1]} for r in rows]

    @tool
    def get_inventory_value(_: str = "") -> float:
        """Get total inventory value in rupees."""
        value = db.execute(text(
            "SELECT SUM(price_per_kg * stock_quantity) FROM products"
        )).scalar()
        return round(float(value or 0), 2)

    @tool
    def search_product(name: str) -> list:
        """Search for a product by rice type or brand name."""
        rows = db.execute(
            text("""
                SELECT product_id, rice_type, brand, price_per_kg, stock_quantity
                FROM products
                WHERE LOWER(rice_type) LIKE :name OR LOWER(brand) LIKE :name
            """),
            {"name": f"%{name.lower()}%"}
        ).fetchall()
        return [
            {"product_id": r[0], "rice_type": r[1], "brand": r[2],
             "price_per_kg": float(r[3]), "stock_quantity": r[4]}
            for r in rows
        ]

    @tool
    def add_stock(product_name: str, quantity: int) -> str:
        """Add stock quantity to a product. Args: product_name (str), quantity (int)."""
        rows = db.execute(
            text("SELECT product_id, rice_type, brand, stock_quantity FROM products WHERE LOWER(rice_type) LIKE :n OR LOWER(brand) LIKE :n"),
            {"n": f"%{product_name.lower()}%"}
        ).fetchall()
        if not rows:
            return f"❌ Product '{product_name}' not found."
        r = rows[0]
        db.execute(
            text("UPDATE products SET stock_quantity = stock_quantity + :q WHERE product_id = :id"),
            {"q": quantity, "id": r[0]}
        )
        db.commit()
        return f"✅ {r[1]} ({r[2]}): {r[3]} → {r[3] + quantity} units (+{quantity})"

    @tool
    def reduce_stock(product_name: str, quantity: int) -> str:
        """Reduce stock quantity from a product. Args: product_name (str), quantity (int)."""
        rows = db.execute(
            text("SELECT product_id, rice_type, brand, stock_quantity FROM products WHERE LOWER(rice_type) LIKE :n OR LOWER(brand) LIKE :n"),
            {"n": f"%{product_name.lower()}%"}
        ).fetchall()
        if not rows:
            return f"❌ Product '{product_name}' not found."
        r = rows[0]
        if quantity > r[3]:
            return f"❌ Cannot reduce {quantity} — only {r[3]} in stock for {r[1]}."
        db.execute(
            text("UPDATE products SET stock_quantity = stock_quantity - :q WHERE product_id = :id"),
            {"q": quantity, "id": r[0]}
        )
        db.commit()
        return f"✅ {r[1]} ({r[2]}): {r[3]} → {r[3] - quantity} units (-{quantity})"

    @tool
    def set_stock(product_name: str, quantity: int) -> str:
        """Set stock quantity of a product to an absolute value. Args: product_name (str), quantity (int)."""
        rows = db.execute(
            text("SELECT product_id, rice_type, brand, stock_quantity FROM products WHERE LOWER(rice_type) LIKE :n OR LOWER(brand) LIKE :n"),
            {"n": f"%{product_name.lower()}%"}
        ).fetchall()
        if not rows:
            return f"❌ Product '{product_name}' not found."
        r = rows[0]
        db.execute(
            text("UPDATE products SET stock_quantity = :q WHERE product_id = :id"),
            {"q": quantity, "id": r[0]}
        )
        db.commit()
        return f"✅ {r[1]} ({r[2]}): set to {quantity} units (was {r[3]})"

    return [
        get_all_products,
        get_low_stock,
        get_out_of_stock,
        get_inventory_value,
        search_product,
        add_stock,
        reduce_stock,
        set_stock,
    ]