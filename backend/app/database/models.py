from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, Enum, Date
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class RoleEnum(str, enum.Enum):
    customer = "customer"
    owner = "owner"

class OrderStatusEnum(str, enum.Enum):
    placed = "placed"
    confirmed = "confirmed"
    packed = "packed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"

class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="customer", nullable=False)
    phone = Column(String(20), nullable=True)
    language = Column(String(20), default="en")
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    orders = relationship("Order", back_populates="customer")
    notifications = relationship("Notification", back_populates="user")
    agent_sessions = relationship("AgentSession", back_populates="user")

class Supplier(Base):
    __tablename__ = "suppliers"
    supplier_id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String(200), nullable=False)
    contact_person = Column(String(200))
    phone = Column(String(20))
    region = Column(String(100))
    transport_cost_per_km = Column(Float, default=0.0)
    rating = Column(Float, default=5.0)
    products = relationship("Product", back_populates="supplier")

class Product(Base):
    __tablename__ = "products"
    product_id = Column(Integer, primary_key=True, index=True)
    rice_type = Column(String(100), nullable=False)
    brand = Column(String(100))
    rice_age_months = Column(Integer, default=0)
    price_per_kg = Column(Float, nullable=False)
    package_size = Column(Float, default=1.0)
    stock_quantity = Column(Integer, default=0)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=True)
    category = Column(String(100), default="Rice")
    description = Column(Text)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    supplier = relationship("Supplier", back_populates="products")
    inventory = relationship("Inventory", back_populates="product", uselist=False)
    order_items = relationship("OrderItem", back_populates="product")

class Inventory(Base):
    __tablename__ = "inventory"
    inventory_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), unique=True)
    stock_available = Column(Integer, default=0)
    reorder_level = Column(Integer, default=50)
    warehouse_location = Column(String(200))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    product = relationship("Product", back_populates="inventory")

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.user_id"))
    total_amount = Column(Float, nullable=False)
    payment_status = Column(String(50), default="pending")
    order_status = Column(String(50), default="placed")
    order_date = Column(DateTime, default=datetime.utcnow)
    delivery_date = Column(DateTime, nullable=True)
    delivery_address = Column(Text)
    customer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", back_populates="order", uselist=False)

class OrderItem(Base):
    __tablename__ = "order_items"
    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class Payment(Base):
    __tablename__ = "payments"
    payment_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), unique=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50))
    payment_status = Column(String(50), default="pending")
    transaction_id = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    order = relationship("Order", back_populates="payment")

class Sale(Base):
    __tablename__ = "sales"
    sales_id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    region = Column(String(100))
    rice_type = Column(String(100))
    rice_age_months = Column(Integer)
    price_per_kg = Column(Float)
    quantity_sold = Column(Float)
    festival_flag = Column(Boolean, default=False)
    season = Column(String(50))
    temperature = Column(Float)
    rainfall = Column(Float)
    weekday = Column(Integer)
    stock_available = Column(Integer)
    supplier_name = Column(String(200))
    transport_cost = Column(Float)
    marketing_spend = Column(Float)
    discount = Column(Float, default=0.0)
    competitor_price = Column(Float)
    online_orders = Column(Integer, default=0)
    offline_orders = Column(Integer, default=0)
    holiday_flag = Column(Boolean, default=False)
    sudden_spike_flag = Column(Boolean, default=False)

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"
    forecast_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"))
    forecast_date = Column(Date, nullable=False)
    predicted_quantity = Column(Float)
    confidence_score = Column(Float)
    model_version = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"
    anomaly_id = Column(Integer, primary_key=True, index=True)
    sales_id = Column(Integer, ForeignKey("sales.sales_id"), nullable=True)
    anomaly_score = Column(Float)
    anomaly_type = Column(String(100))
    description = Column(Text)
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)

class Notification(Base):
    __tablename__ = "notifications"
    notification_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    message = Column(Text, nullable=False)
    type = Column(String(50))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="notifications")

class AgentSession(Base):
    __tablename__ = "agent_sessions"
    session_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    agent_name = Column(String(100))
    query = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="agent_sessions")