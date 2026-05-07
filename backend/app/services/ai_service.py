import os
import json
from sqlalchemy.orm import Session
from sqlalchemy import func, Date as SADate
from app.database import models
from datetime import date, timedelta

def call_azure_openai(system_prompt: str, user_message: str) -> str:
    """Call Azure OpenAI GPT-4. Falls back to rule-based if keys not set."""
    try:
        import httpx
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        key = os.getenv("AZURE_OPENAI_KEY")
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4")
        if not endpoint or not key:
            return None
        url = f"{endpoint}openai/deployments/{deployment}/chat/completions?api-version=2024-02-01"
        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 500,
            "temperature": 0.7
        }
        resp = httpx.post(url, json=payload, headers={"api-key": key}, timeout=30)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Azure OpenAI error: {e}")
        return None

def get_db_context(db: Session, role: str) -> str:
    """Build a context string from live DB data for the AI."""
    ctx = []
    products = db.query(models.Product).filter(models.Product.is_active == True).all()
    ctx.append(f"Available rice products: {[f'{p.rice_type} (Rs.{p.price_per_kg}/kg, stock: {p.stock_quantity}kg)' for p in products]}")
    if role == "owner":
        today = date.today()
        today_rev = db.query(func.sum(models.Payment.amount)).join(models.Order).filter(
            func.cast(models.Order.order_date, SADate) == today,
            models.Payment.payment_status == "paid"
        ).scalar() or 0
        ctx.append(f"Today's revenue: Rs.{today_rev:.2f}")
        low_stock = db.query(models.Inventory).filter(
            models.Inventory.stock_available <= models.Inventory.reorder_level
        ).all()
        if low_stock:
            ctx.append(f"Low stock alerts: {[f'{l.product.rice_type} ({l.stock_available}kg left)' for l in low_stock if l.product]}")
    return "\n".join(ctx)

def process_chat_query(message: str, role: str, db: Session = None) -> dict:
    message_lower = message.lower()

    # Rule-based fallback for common queries
    if db:
        if any(w in message_lower for w in ["product", "rice", "available", "stock", "price"]):
            products = db.query(models.Product).filter(models.Product.is_active == True).all()
            if products:
                product_list = ", ".join([f"{p.rice_type} at Rs.{p.price_per_kg}/kg" for p in products[:5]])
                rule_response = f"We currently have: {product_list}. All fresh stock available for purchase."
            else:
                rule_response = "Please check back soon — we are updating our product catalog."

            if os.getenv("AZURE_OPENAI_KEY"):
                context = get_db_context(db, role)
                system = f"""You are a helpful assistant for a rice retail store called Rice Retail.
You help {role}s with their queries. Be concise and professional.
Current store data:
{context}"""
                ai_resp = call_azure_openai(system, message)
                if ai_resp:
                    return {"response": ai_resp, "source": "ai"}
            return {"response": rule_response, "source": "rule"}

        if any(w in message_lower for w in ["order", "track", "status", "delivery"]):
            return {"response": "You can track your order in the 'My Orders' section. Orders are typically delivered within 2-3 business days.", "source": "rule"}

        if role == "owner" and any(w in message_lower for w in ["sales", "revenue", "profit"]):
            rev = db.query(func.sum(models.Payment.amount)).filter(models.Payment.payment_status == "paid").scalar() or 0
            return {"response": f"Your total revenue so far is Rs.{rev:.2f}. Check the Analytics section for detailed charts.", "source": "rule"}

    # Azure OpenAI with context
    if db and os.getenv("AZURE_OPENAI_KEY"):
        context = get_db_context(db, role)
        system = f"""You are a helpful assistant for Rice Retail, a premium rice retail store.
You help {role}s. Be concise and professional. Current data:
{context}"""
        ai_resp = call_azure_openai(system, message)
        if ai_resp:
            return {"response": ai_resp, "source": "ai"}

    return {
        "response": f"Thank you for your question about '{message}'. Please explore our products page or contact our support team for more help.",
        "source": "fallback"
    }

def generate_forecast(db: Session = None) -> dict:
    if db:
        products = db.query(models.Product).filter(models.Product.is_active == True).limit(5).all()
        forecasts = []
        for p in products:
            import random
            forecasts.append({
                "rice_type": p.rice_type,
                "brand": p.brand,
                "current_stock": p.stock_quantity,
                "predicted_demand_7d": round(p.stock_quantity * 0.3 + random.uniform(10, 50), 1),
                "trend": "up" if p.stock_quantity > 100 else "stable",
                "recommendation": "Restock soon" if p.stock_quantity < 50 else "Stock adequate"
            })
        return {"status": "success", "forecasts": forecasts, "note": "Connect Azure ML endpoint for real predictions"}
    return {"status": "success", "forecasts": [], "note": "No DB connection"}

def detect_anomalies(db: Session = None) -> dict:
    alerts = []
    if db:
        low_stock = db.query(models.Inventory).filter(
            models.Inventory.stock_available <= models.Inventory.reorder_level
        ).all()
        for inv in low_stock:
            alerts.append({
                "type": "low_stock",
                "product": inv.product.rice_type if inv.product else "Unknown",
                "current": inv.stock_available,
                "threshold": inv.reorder_level,
                "severity": "critical" if inv.stock_available == 0 else "warning"
            })
    return {"status": "success", "alerts": alerts}
