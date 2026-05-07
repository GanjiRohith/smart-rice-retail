from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, Date as SADate
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.database import models
from app.database.schemas import (
    OrderStatusUpdate, InventoryUpdate, SupplierCreate, SupplierResponse, NotificationResponse
)
from app.database.db import get_db
from app.utils.deps import get_owner_user

router = APIRouter()

# ─── DASHBOARD ─────────────────────────────────────
@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    today = date.today()

    total_products = db.query(models.Product).filter(models.Product.is_active == True).count()
    total_orders = db.query(models.Order).count()
    today_orders = db.query(models.Order).filter(func.cast(models.Order.order_date, SADate) == today).count()
    today_revenue = db.query(func.sum(models.Payment.amount)).join(models.Order).filter(
        func.cast(models.Order.order_date, SADate) == today,
        models.Payment.payment_status.in_(["paid", "cod_pending"])
    ).scalar() or 0.0
    total_revenue = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.payment_status.in_(["paid", "cod_pending"])
    ).scalar() or 0.0
    low_stock = db.query(models.Inventory).filter(
        models.Inventory.stock_available <= models.Inventory.reorder_level
    ).count()
    pending_orders = db.query(models.Order).filter(
        models.Order.order_status.in_(["placed", "confirmed"])
    ).count()

    # weekly sales chart
    weekly = []
    for i in range(7):
        d = today - timedelta(days=6 - i)
        rev = db.query(func.sum(models.Payment.amount)).join(models.Order).filter(
            func.cast(models.Order.order_date, SADate) == d,
            models.Payment.payment_status.in_(["paid", "cod_pending"])
        ).scalar() or 0.0
        weekly.append({"date": str(d), "revenue": float(rev)})

    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "today_orders": today_orders,
        "today_revenue": float(today_revenue),
        "total_revenue": float(total_revenue),
        "low_stock_alerts": low_stock,
        "pending_orders": pending_orders,
        "weekly_sales": weekly
    }

# ─── ORDERS ─────────────────────────────────────
@router.get("/orders")
def get_all_orders(status: Optional[str] = None, db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    q = db.query(models.Order).options(
        joinedload(models.Order.customer),
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    ).order_by(desc(models.Order.order_date))
    if status:
        q = q.filter(models.Order.order_status == status)
    orders = q.all()
    result = []
    for o in orders:
        result.append({
            "order_id": o.order_id,
            "customer_name": o.customer.name if o.customer else "Unknown",
            "customer_email": o.customer.email if o.customer else "",
            "total_amount": o.total_amount,
            "payment_status": o.payment_status,
            "order_status": o.order_status,
            "order_date": str(o.order_date),
            "delivery_address": o.delivery_address,
            "items": [
                {
                    "product_name": item.product.rice_type if item.product else "Unknown",
                    "quantity": item.quantity,
                    "unit_price": item.unit_price
                } for item in o.items
            ]
        })
    return result

@router.put("/orders/{order_id}/status")
def update_order_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.order_status = data.order_status
    if data.order_status == "delivered":
        order.delivery_date = datetime.utcnow()
        order.payment_status = "paid"
        if order.payment:
            if order.payment.payment_status in ["cod_pending", "pending"]:
                order.payment.payment_status = "paid"
                order.payment.transaction_id = order.payment.transaction_id or f"COD-DEL-{order_id}"
    # Notify customer
    notif = models.Notification(
        user_id=order.customer_id,
        message=f"Your order #{order_id} is now {data.order_status}",
        type="order_update"
    )
    db.add(notif)
    db.commit()
    return {"message": f"Order {order_id} updated to {data.order_status}"}

# ─── INVENTORY ─────────────────────────────────────
@router.get("/inventory")
def get_inventory(db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    inv = db.query(models.Inventory).options(joinedload(models.Inventory.product)).all()
    return [
        {
            "inventory_id": i.inventory_id,
            "product_id": i.product_id,
            "rice_type": i.product.rice_type if i.product else "",
            "brand": i.product.brand if i.product else "",
            "stock_available": i.stock_available,
            "reorder_level": i.reorder_level,
            "warehouse_location": i.warehouse_location,
            "low_stock": i.stock_available <= i.reorder_level,
            "updated_at": str(i.updated_at) if i.updated_at else None
        } for i in inv
    ]

@router.put("/inventory/{inventory_id}")
def update_inventory(inventory_id: int, data: InventoryUpdate, db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    inv = db.query(models.Inventory).filter(models.Inventory.inventory_id == inventory_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Not found")
    inv.stock_available = data.stock_available
    if data.reorder_level is not None:
        inv.reorder_level = data.reorder_level
    if data.warehouse_location is not None:
        inv.warehouse_location = data.warehouse_location
    inv.updated_at = datetime.utcnow()
    if inv.product:
        inv.product.stock_quantity = data.stock_available
    db.commit()
    return {"message": "Inventory updated"}

# ─── SUPPLIERS ─────────────────────────────────────
@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    return db.query(models.Supplier).all()

@router.post("/suppliers", response_model=SupplierResponse)
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    s = models.Supplier(**data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.put("/suppliers/{supplier_id}")
def update_supplier(supplier_id: int, data: SupplierCreate, db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    s = db.query(models.Supplier).filter(models.Supplier.supplier_id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump().items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s

@router.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    s = db.query(models.Supplier).filter(models.Supplier.supplier_id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(s)
    db.commit()
    return {"message": "Supplier deleted"}

# ─── SALES ANALYTICS ─────────────────────────────────────
@router.get("/analytics/sales")
def get_sales_analytics(db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    by_rice = db.query(
        models.OrderItem.product_id,
        func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).label("revenue"),
        func.sum(models.OrderItem.quantity).label("qty")
    ).group_by(models.OrderItem.product_id).all()
    results = []
    for row in by_rice:
        p = db.query(models.Product).filter(models.Product.product_id == row.product_id).first()
        results.append({
            "rice_type": p.rice_type if p else "Unknown",
            "revenue": float(row.revenue or 0),
            "quantity_kg": float(row.qty or 0)
        })
    return {"by_rice_type": results}

@router.get("/analytics/revenue")
def get_revenue(db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    total = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.payment_status.in_(["paid", "cod_pending"])
    ).scalar() or 0
    order_count = db.query(models.Order).filter(
        models.Order.payment_status.in_(["paid", "cod_pending"])
    ).count()
    avg = float(total) / order_count if order_count > 0 else 0
    return {"total_revenue": float(total), "order_count": order_count, "avg_order_value": float(avg)}

# ─── USERS (owner manages customers) ─────────────────────────────────────
@router.get("/users")
def get_all_users(db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    users = db.query(models.User).filter(models.User.role == "customer").all()
    return [{"user_id": u.user_id, "name": u.name, "email": u.email, "phone": u.phone, "created_at": str(u.created_at)} for u in users]

# ─── NOTIFICATIONS ─────────────────────────────────────
@router.get("/notifications", response_model=List[NotificationResponse])
def get_owner_notifications(db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == owner.user_id
    ).order_by(desc(models.Notification.created_at)).limit(50).all()

@router.put("/notifications/{notif_id}/read")
def mark_owner_notification_read(notif_id: int, db: Session = Depends(get_db), owner=Depends(get_owner_user)):
    n = db.query(models.Notification).filter(models.Notification.notification_id == notif_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "Marked as read"}