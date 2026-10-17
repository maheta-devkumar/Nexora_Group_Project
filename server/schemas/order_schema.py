from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# --- Order Item Schemas ---
class OrderItemDetail(BaseModel):
    variant_id: int
    product_name: str
    variant_name: Optional[str] = None
    price: float
    quantity: int
    total: float

class OrderHistoryDetail(BaseModel):
    history_id: int
    status: str
    updated_at: datetime
    updated_by_name: Optional[str] = None

class OrderDetail(BaseModel):
    order_id: int
    order_status: str
    payment_status: str
    total_amount: float
    subtotal: float
    discount_amount: float
    delivery_fee: float
    tax_amount: float
    placed_at: datetime
    items: List[OrderItemDetail]
    histories: List[OrderHistoryDetail]
    address: Optional[dict] = None

class OrderSummaryResponseData(BaseModel):
    orders: List[OrderDetail]
    total_orders: int

# --- Core Order Schemas ---
class OrderBase(BaseModel):
    address_id: int
    subtotal: Decimal
    discount_amount: Decimal = 0
    delivery_fee: Decimal = 0
    tax_amount: Decimal = 0
    total_amount: Decimal
    coupon_code: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[dict]

class OrderUpdate(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None

class OrderResponse(OrderBase):
    order_id: int
    user_id: int
    payment_status: str
    order_status: str
    placed_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Order Return Schemas ---
class ReturnProductItem(BaseModel):
    variant_id: int
    quantity: int

class OrderReturnBase(BaseModel):
    order_id: int
    reason: str

class OrderReturnCreate(OrderReturnBase):
    items: List[ReturnProductItem]

class OrderReturnResponse(OrderReturnBase):
    return_id: int
    status: str
    requested_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Wrapper Schemas ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class OrderSummaryWrapper(SuccessWrapper):
    data: OrderSummaryResponseData

class OrderWrapper(SuccessWrapper):
    data: OrderDetail

class OrderListWrapper(SuccessWrapper):
    data: List[OrderDetail]

class OrderReturnWrapper(SuccessWrapper):
    data: OrderReturnResponse

class OrderReturnListWrapper(SuccessWrapper):
    data: List[OrderReturnResponse]

class MessageWrapper(SuccessWrapper):
    data: dict