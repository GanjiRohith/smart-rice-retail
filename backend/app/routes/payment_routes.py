from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import models
from app.database.db import get_db
from app.utils.deps import get_current_user
import os

router = APIRouter()

class PaymentIntentRequest(BaseModel):
    order_id: int
    amount: float  # in INR

class PaymentConfirmRequest(BaseModel):
    order_id: int
    payment_intent_id: str

@router.post("/initiate")
def initiate_payment(data: PaymentIntentRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Create a Stripe payment intent for online payment."""
    order = db.query(models.Order).filter(
        models.Order.order_id == data.order_id,
        models.Order.customer_id == user.user_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    stripe_key = os.getenv("STRIPE_SECRET_KEY")
    if not stripe_key or stripe_key.startswith("sk_test_your"):
        # Simulate response for dev
        return {
            "client_secret": f"pi_simulated_{data.order_id}_secret_test",
            "payment_intent_id": f"pi_simulated_{data.order_id}",
            "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_placeholder"),
            "amount": int(data.amount * 100),
            "currency": "inr",
            "simulated": True
        }

    try:
        import stripe
        stripe.api_key = stripe_key
        intent = stripe.PaymentIntent.create(
            amount=int(data.amount * 100),  # paise
            currency="inr",
            metadata={"order_id": str(data.order_id), "user_id": str(user.user_id)}
        )
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY"),
            "amount": intent.amount,
            "currency": intent.currency,
            "simulated": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment initiation failed: {str(e)}")

@router.post("/confirm")
def confirm_payment(data: PaymentConfirmRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Confirm payment after Stripe success."""
    order = db.query(models.Order).filter(
        models.Order.order_id == data.order_id,
        models.Order.customer_id == user.user_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.payment_status = "paid"
    order.order_status = "confirmed"
    if order.payment:
        order.payment.payment_status = "paid"
        order.payment.transaction_id = data.payment_intent_id

    # Notify owner
    owner = db.query(models.User).filter(models.User.role == "owner").first()
    if owner:
        notif = models.Notification(
            user_id=owner.user_id,
            message=f"Payment confirmed for order #{data.order_id}. TXN: {data.payment_intent_id}",
            type="payment_confirmed"
        )
        db.add(notif)
    db.commit()
    return {"message": "Payment confirmed", "transaction_id": data.payment_intent_id}

@router.get("/status/{order_id}")
def payment_status(order_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    payment = db.query(models.Payment).join(models.Order).filter(
        models.Order.order_id == order_id,
        models.Order.customer_id == user.user_id
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {
        "order_id": order_id,
        "amount": payment.amount,
        "method": payment.payment_method,
        "status": payment.payment_status,
        "transaction_id": payment.transaction_id
    }
