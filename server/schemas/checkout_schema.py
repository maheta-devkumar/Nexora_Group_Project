from pydantic import BaseModel
from typing import Optional, List

class CheckoutAddress(BaseModel):
    address_id: int

class CheckoutItem(BaseModel):
    variant_id: int
    quantity: int
    price: float
    total: float

class CheckoutSummary(BaseModel):
    subtotal: float
    discount_amount: float
    delivery_fee: float
    tax_amount: float
    total_amount: float
    coupon_code: Optional[str] = None
    items: List[CheckoutItem]
    address_id: int

class ConfirmCheckoutRequest(BaseModel):
    address_id: int
    coupon_code: Optional[str] = None
    shipping_method: Optional[str] = "Standard"
    payment_method: str  # "COD" or "RAZORPAY"
