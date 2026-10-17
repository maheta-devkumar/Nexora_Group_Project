# schemas/wishlist_schema.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Core Wishlist Schemas ---
class WishlistItemDetail(BaseModel):
    variant_id: int
    product_name: str
    variant_name: Optional[str] = None
    price: float
    added_at: datetime

class WishlistResponse(BaseModel):
    user_id: int
    variant_id: int
    added_at: datetime

    class Config:
        from_attributes = True

# --- Wrapper Schemas ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class WishlistItemWrapper(SuccessWrapper):
    data: WishlistResponse

class WishlistListWrapper(SuccessWrapper):
    data: List[WishlistItemDetail]

class MessageWrapper(SuccessWrapper):
    data: Dict[str, Any]