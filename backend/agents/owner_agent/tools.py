"""
owner_agent/tools.py
LangChain @tool decorated owner management functions.
"""

from langchain_core.tools import tool
from sqlalchemy import text
from app.database import models


def make_owner_tools(db):

    @tool
    def get_total_sales(_: str = "") -> float:
        """Get total revenue from paid orders."""
        return float(db.execute(text(
            "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status='paid'"
        )).scalar() or 0)

    @tool
    def get_total_orders(_: str = "") -> int:
        """Get total number of orders placed."""
        return db.execute(text("SELECT COUNT(*) FROM orders")).scalar()

    @tool
    def get_all_products(_: str = "") -> list:
        """Get all products with pricing and stock info."""
        products = db.query(models.Product).all()
        return [
            {"product_id": p.product_id, "rice_type": p.rice_type,
             "brand": p.brand, "price_per_kg": p.price_per_kg,
             "stock_quantity": p.stock_quantity}
            for p in products
        ]

    @tool
    def get_low_stock(_: str = "") -> list:
        """Get products with stock below 50 units."""
        rows = db.execute(text(
            "SELECT rice_type, stock_quantity FROM products WHERE stock_quantity < 50"
        )).fetchall()
        return [{"rice_type": r[0], "stock_quantity": r[1]} for r in rows]

    @tool
    def get_recent_orders(_: str = "") -> list:
        """Get the 10 most recent orders."""
        rows = db.execute(text("""
            SELECT TOP 10 order_id, total_amount, order_status, order_date
            FROM orders ORDER BY order_date DESC
        """)).fetchall()
        return [
            {"order_id": r[0], "total_amount": float(r[1]),
             "order_status": r[2], "order_date": str(r[3])}
            for r in rows
        ]

    @tool
    def create_product(rice_type: str, brand: str, price_per_kg: float, stock_quantity: int) -> str:
        """Create a new product. Args: rice_type, brand, price_per_kg, stock_quantity."""
        product = models.Product(
            rice_type=rice_type, brand=brand,
            price_per_kg=price_per_kg, stock_quantity=stock_quantity
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return f"✅ Product '{rice_type}' by {brand} created with ID {product.product_id}."

    @tool
    def update_product_stock(product_id: int, stock_quantity: int) -> str:
        """Update stock quantity for a product by product_id."""
        product = db.query(models.Product).filter(
            models.Product.product_id == product_id
        ).first()
        if not product:
            return f"❌ Product ID {product_id} not found."
        old = product.stock_quantity
        product.stock_quantity = stock_quantity
        db.commit()
        return f"✅ Product {product_id} stock: {old} → {stock_quantity}"

    @tool
    def update_product_price(product_id: int, price_per_kg: float) -> str:
        """Update price per kg for a product by product_id."""
        product = db.query(models.Product).filter(
            models.Product.product_id == product_id
        ).first()
        if not product:
            return f"❌ Product ID {product_id} not found."
        old = product.price_per_kg
        product.price_per_kg = price_per_kg
        db.commit()
        return f"✅ Product {product_id} price: ₹{old} → ₹{price_per_kg}"

    @tool
    def delete_product(product_id: int) -> str:
        """Delete a product by product_id."""
        product = db.query(models.Product).filter(
            models.Product.product_id == product_id
        ).first()
        if not product:
            return f"❌ Product ID {product_id} not found."
        name = product.rice_type
        db.delete(product)
        db.commit()
        return f"✅ Product '{name}' (ID {product_id}) deleted."

    return [
        get_total_sales,
        get_total_orders,
        get_all_products,
        get_low_stock,
        get_recent_orders,
        create_product,
        update_product_stock,
        update_product_price,
        delete_product,
    ]