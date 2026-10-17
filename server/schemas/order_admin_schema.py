from pydantic import BaseModel
from typing import Optional
from datetime import date


# ============================================================
# ORDER CORE
# ============================================================

class AdminOrderUpdateSchema(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None
    delivery_fee: Optional[float] = None
    tax_amount: Optional[float] = None


# ============================================================
# ORDER ITEMS
# ============================================================

class UpdateOrderItemQtySchema(BaseModel):
    quantity: int


# ============================================================
# ORDER HISTORY
# ============================================================

class AddOrderHistorySchema(BaseModel):
    status: str


# ============================================================
# RETURNS
# ============================================================

class RejectReturnSchema(BaseModel):
    reason: str


# ============================================================
# REFUNDS
# ============================================================

class UpdateRefundStatusSchema(BaseModel):
    status: str


# ============================================================
# DELIVERY
# ============================================================

class AssignDeliverySchema(BaseModel):
    delivery_user_id: int


class UpdateDeliveryPersonSchema(BaseModel):
    delivery_user_id: int


# ============================================================
# ISSUES
# ============================================================

class ResolveIssueSchema(BaseModel):
    resolution_note: Optional[str] = None


# ============================================================
# STATS & FILTERS
# ============================================================

class OrdersByDateSchema(BaseModel):
    start_date: date
    end_date: date
