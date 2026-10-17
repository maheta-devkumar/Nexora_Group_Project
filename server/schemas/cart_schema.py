# schemas/cart_schema.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# --- Core Cart Schemas ---
class CartItemDetail(BaseModel):
    variant_id: int
    product_name: Optional[str] = None
    variant_name: Optional[str] = None
    price: float
    final_price: float
    quantity: int
    item_total: float
    stock_quantity: int
    status: str

class CartSummaryResponse(BaseModel):
    items: List[CartItemDetail]
    subtotal: float
    total_items: int

class CartResponse(BaseModel):
    user_id: Optional[int] = None
    variant_id: Optional[int] = None
    price: Optional[Decimal] = None
    quantity: Optional[int] = None
    added_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {Decimal: float}

# --- Wrapper Schemas ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class CartSummaryWrapper(SuccessWrapper):
    data: CartSummaryResponse

class CartItemWrapper(SuccessWrapper):
    data: CartResponse

class CartMessageWrapper(SuccessWrapper):
    data: Dict[str, Any]