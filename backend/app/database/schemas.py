from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

# AUTH
class UserCreate(BaseModel):
    name: str
    email: str
    password: str = Field(..., min_length=6)
    role: str = Field("customer")
    phone: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None
    class Config:
        from_attributes = True

class UserTokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    user_id: int

    class Config:
        from_attributes = True

# PRODUCTS
class ProductCreate(BaseModel):
    rice_type: str
    brand: Optional[str] = None
    rice_age_months: int = 0
    price_per_kg: float
    package_size: float = 1.0
    stock_quantity: int = 0
    category: str = "Rice"
    description: Optional[str] = None
    image_url: Optional[str] = None
    supplier_id: Optional[int] = None

class ProductUpdate(BaseModel):
    rice_type: Optional[str] = None
    brand: Optional[str] = None
    rice_age_months: Optional[int] = None
    price_per_kg: Optional[float] = None
    package_size: Optional[float] = None
    stock_quantity: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    product_id: int
    rice_type: str
    brand: Optional[str]
    rice_age_months: int
    price_per_kg: float
    package_size: float
    stock_quantity: int
    category: str
    description: Optional[str]
    image_url: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True

# ORDERS
class CartItem(BaseModel):
    product_id: int
    quantity: float

class OrderCreate(BaseModel):
    items: List[CartItem]
    delivery_address: str
    payment_method: str = "cash"

class OrderStatusUpdate(BaseModel):
    order_status: str

class OrderItemResponse(BaseModel):
    order_item_id: int
    product_id: int
    quantity: float
    unit_price: float
    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    order_id: int
    customer_id: int
    total_amount: float
    payment_status: str
    order_status: str
    order_date: datetime
    delivery_address: Optional[str]
    items: List[OrderItemResponse] = []
    class Config:
        from_attributes = True

# SUPPLIERS
class SupplierCreate(BaseModel):
    supplier_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    region: Optional[str] = None
    transport_cost_per_km: float = 0.0
    rating: float = 5.0

class SupplierResponse(BaseModel):
    supplier_id: int
    supplier_name: str
    contact_person: Optional[str]
    phone: Optional[str]
    region: Optional[str]
    transport_cost_per_km: float
    rating: float
    class Config:
        from_attributes = True

# INVENTORY
class InventoryUpdate(BaseModel):
    stock_available: int
    reorder_level: Optional[int] = None
    warehouse_location: Optional[str] = None

# NOTIFICATIONS
class NotificationResponse(BaseModel):
    notification_id: int
    message: str
    type: Optional[str]
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

# AI
class ChatRequest(BaseModel):
    message: str
    session_context: Optional[str] = None