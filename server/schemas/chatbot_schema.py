# chatbot_schemas.py
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal


# ==================== USER RELATED ====================
class UserInfo(BaseModel):
    user_id: int
    username: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    profile_img_url: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[datetime] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class RoleInfo(BaseModel):
    role_id: int
    role_name: str
    description: Optional[str] = None
    is_active: bool


# ==================== ADDRESS RELATED ====================
class AddressInfo(BaseModel):
    address_id: int
    user_id: int
    address_type: str
    line1: str
    line2: Optional[str] = None
    area_name: str
    city_name: str
    state_name: str
    pincode: Optional[str] = None
    is_default: bool
    created_at: datetime


# ==================== PRODUCT CATALOG ====================
class CategoryInfo(BaseModel):
    category_id: int
    category_name: str
    description: Optional[str] = None


class ProductInfo(BaseModel):
    product_id: int
    product_name: str
    description: Optional[str] = None
    brand_name: Optional[str] = None
    category_name: Optional[str] = None
    created_at: datetime


class ProductVariantInfo(BaseModel):
    variant_id: int
    variant_name: Optional[str] = None
    product_id: int
    product_name: str
    product_description: Optional[str] = None
    price: Decimal
    stock_quantity: int
    discount_type: str
    discount_value: Decimal
    status: str
    attributes: Dict[str, str] = Field(default_factory=dict)
    images: List[str] = Field(default_factory=list)
    brand_name: Optional[str] = None
    category_name: Optional[str] = None


# ==================== ORDERS & CHECKOUT ====================
class CartItemInfo(BaseModel):
    user_id: int
    variant_id: int
    product_name: str
    price: Decimal
    quantity: int
    added_at: datetime


class OrderItemInfo(BaseModel):
    order_id: int
    variant_id: int
    product_name: str
    quantity: int
    price: Decimal
    discount_per_unit: Decimal
    total: Decimal


class OrderInfo(BaseModel):
    order_id: int
    user_id: int
    subtotal: Decimal
    discount_amount: Decimal
    delivery_fee: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    coupon_code: Optional[str] = None
    payment_status: str
    order_status: str
    placed_at: datetime
    items: List[OrderItemInfo] = Field(default_factory=list)


# ==================== REVIEWS ====================
class ReviewInfo(BaseModel):
    review_id: int
    user_id: int
    variant_id: int
    product_name: str
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None
    created_at: datetime


# ==================== DELIVERY ====================
class DeliveryPersonInfo(BaseModel):
    delivery_person_id: int
    user_id: int
    license_number: Optional[str] = None
    status: str
    rating: Decimal
    is_online: bool


class DeliveryInfo(BaseModel):
    delivery_id: int
    order_id: int
    status: str
    assigned_at: datetime
    delivered_at: Optional[datetime] = None


# ==================== PAYMENTS ====================
class PaymentInfo(BaseModel):
    payment_id: int
    user_id: int
    order_id: int
    payment_method: str
    payment_status: str
    amount_paid: Decimal
    payment_date: datetime


# ==================== MAIN RESPONSE ====================
class ChatbotDataResponse(BaseModel):
    success: bool = True
    message: str = "Chatbot data retrieved successfully"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Current user info
    current_user: Optional[UserInfo] = None
    current_user_roles: List[str] = Field(default_factory=list)
    
    # User data
    users: List[UserInfo] = Field(default_factory=list)
    
    # Product data
    categories: List[CategoryInfo] = Field(default_factory=list)
    products: List[ProductInfo] = Field(default_factory=list)
    variants: List[ProductVariantInfo] = Field(default_factory=list)
    
    # Order data
    cart_items: List[CartItemInfo] = Field(default_factory=list)
    orders: List[OrderInfo] = Field(default_factory=list)
    payments: List[PaymentInfo] = Field(default_factory=list)
    
    # Review data
    reviews: List[ReviewInfo] = Field(default_factory=list)
    
    # Delivery data (if current user is delivery person)
    delivery_person_info: Optional[DeliveryPersonInfo] = None
    deliveries: List[DeliveryInfo] = Field(default_factory=list)
    
    # Address data
    addresses: List[AddressInfo] = Field(default_factory=list)