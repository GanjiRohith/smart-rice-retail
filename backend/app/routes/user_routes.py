from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import models
from app.database.schemas import OrderCreate, OrderResponse, NotificationResponse
from app.database.db import get_db
from app.utils.deps import get_current_user
from datetime import datetime, date as date_type

router = APIRouter()


def _get_season(month: int) -> str:
    if month in [12, 1, 2]: return "winter"
    if month in [3, 4, 5]: return "summer"
    if month in [6, 7, 8, 9]: return "monsoon"
    return "post-monsoon"


@router.get("/profile")
def get_profile(user: models.User = Depends(get_current_user)):
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "role": user.role
    }

@router.put("/profile")
def update_profile(data: dict, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    for k in ["name", "phone", "address", "language"]:
        if k in data:
            setattr(user, k, data[k])
    db.commit()
    return {"message": "Profile updated"}

@router.post("/orders", response_model=OrderResponse)
def place_order(data: OrderCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    total = 0.0
    items_data = []
    for item in data.items:
        product = db.query(models.Product).filter(models.Product.product_id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.rice_type}")
        line_total = product.price_per_kg * item.quantity
        total += line_total
        items_data.append((product, item.quantity, product.price_per_kg))

    order = models.Order(
        customer_id=user.user_id,
        total_amount=total,
        payment_status="pending",
        order_status="placed",
        delivery_address=data.delivery_address
    )
    db.add(order)
    db.flush()

    for product, qty, price in items_data:
        oi = models.OrderItem(order_id=order.order_id, product_id=product.product_id, quantity=qty, unit_price=price)
        db.add(oi)
        product.stock_quantity -= int(qty)
        if product.inventory:
            product.inventory.stock_available -= int(qty)

    # COD payment handling
    if data.payment_method in ["cash_on_delivery", "cod", "cash"]:
        payment_status_initial = "cod_pending"
        txn_id = f"COD-{order.order_id}"
    else:
        payment_status_initial = "pending"
        txn_id = None

    payment = models.Payment(
        order_id=order.order_id,
        amount=total,
        payment_method=data.payment_method,
        payment_status=payment_status_initial,
        transaction_id=txn_id
    )
    db.add(payment)

    # notify owner
    owner = db.query(models.User).filter(models.User.role == "owner").first()
    if owner:
        notif = models.Notification(
            user_id=owner.user_id,
            message=f"New order #{order.order_id} placed by {user.name} for Rs.{total:.2f}",
            type="new_order"
        )
        db.add(notif)

    db.commit()
    db.refresh(order)

    # Insert Sale records for analytics/ML training
    for product, qty, price in items_data:
        sale = models.Sale(
            date=date_type.today(),
            region="Hyderabad",
            rice_type=product.rice_type,
            rice_age_months=product.rice_age_months,
            price_per_kg=price,
            quantity_sold=qty,
            season=_get_season(date_type.today().month),
            weekday=date_type.today().weekday(),
            stock_available=product.stock_quantity,
            supplier_name=product.supplier.supplier_name if product.supplier else "Unknown",
            online_orders=1,
            offline_orders=0,
        )
        db.add(sale)
    db.commit()

    return order

@router.get("/orders", response_model=List[OrderResponse])
def get_my_orders(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Order).options(joinedload(models.Order.items)).filter(
        models.Order.customer_id == user.user_id
    ).order_by(models.Order.order_date.desc()).all()

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    order = db.query(models.Order).options(joinedload(models.Order.items)).filter(
        models.Order.order_id == order_id,
        models.Order.customer_id == user.user_id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/orders/{order_id}/pay")
def confirm_payment(order_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id, models.Order.customer_id == user.user_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.payment_status = "paid"
    if order.payment:
        order.payment.payment_status = "paid"
        order.payment.transaction_id = f"TXN{order_id}{int(datetime.utcnow().timestamp())}"
    db.commit()
    return {"message": "Payment confirmed", "transaction_id": order.payment.transaction_id if order.payment else None}

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user.user_id
    ).order_by(models.Notification.created_at.desc()).limit(20).all()

@router.put("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    n = db.query(models.Notification).filter(models.Notification.notification_id == notif_id, models.Notification.user_id == user.user_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "Marked as read"}