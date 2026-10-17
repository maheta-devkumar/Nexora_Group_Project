from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any  # ← ADD Dict and Any here
from datetime import datetime
from decimal import Decimal

# --- Utility Schemas ---
class PaymentDetail(BaseModel):
    payment_id: int
    payment_method: str
    payment_status: str
    amount_paid: float
    transaction_reference: Optional[str] = None
    payment_date: datetime
    order_id: int

class PaymentSummaryResponseData(BaseModel):
    payments: List[PaymentDetail]
    total_payments: int

# --- Core Payment Schemas ---
class PaymentBase(BaseModel):
    order_id: int
    payment_method: str
    amount_paid: Decimal
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    payment_status: Optional[str] = None
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None

class PaymentResponse(PaymentBase):
    payment_id: int
    user_id: int
    payment_status: str
    payment_date: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Payment Initiation Schemas ---
class PaymentInitiateRequest(BaseModel):
    order_id: int
    payment_method: str

class PaymentInitiateResponse(BaseModel):
    payment_id: int
    order_id: int
    amount: float
    currency: str = "INR"
    razorpay_order_id: Optional[str] = None
    key: Optional[str] = None

class PaymentVerifyRequest(BaseModel):
    payment_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# --- Wrapper Schemas ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class PaymentSummaryWrapper(SuccessWrapper):
    data: PaymentSummaryResponseData

class PaymentWrapper(SuccessWrapper):
    data: PaymentResponse

class PaymentListWrapper(SuccessWrapper):
    data: List[PaymentDetail]

class PaymentInitiateWrapper(SuccessWrapper):
    data: PaymentInitiateResponse

class MessageWrapper(SuccessWrapper):
    data: dict


class PaymentRefundStatus(BaseModel):
    payment_id: int
    total_paid: float
    total_refunded: float
    available_for_refund: float
    refund_history: List[dict]

class PaymentRefundStatusWrapper(SuccessWrapper):
    data: PaymentRefundStatus

class RefundRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Refund amount must be greater than 0")
    reason: str

# ✅ FIXED: Added imports for Dict and Any
class PaymentConfirmRequest(BaseModel):
    payment_id: str
    gateway_data: Dict[str, Any]

class PaymentStatusResponse(BaseModel):
    payment_id: str
    status: str
    amount_paid: Optional[float] = None
    transaction_reference: Optional[str] = None

# ✅ ADD THIS AT THE END OF THE FILE:
# Rebuild all models to resolve forward references
PaymentDetail.model_rebuild()
PaymentSummaryResponseData.model_rebuild()
PaymentBase.model_rebuild()
PaymentCreate.model_rebuild()
PaymentUpdate.model_rebuild()
PaymentResponse.model_rebuild()
PaymentInitiateRequest.model_rebuild()
PaymentInitiateResponse.model_rebuild()
PaymentVerifyRequest.model_rebuild()
SuccessWrapper.model_rebuild()
PaymentSummaryWrapper.model_rebuild()
PaymentWrapper.model_rebuild()
PaymentListWrapper.model_rebuild()
PaymentInitiateWrapper.model_rebuild()
MessageWrapper.model_rebuild()
PaymentRefundStatus.model_rebuild()
PaymentRefundStatusWrapper.model_rebuild()
RefundRequest.model_rebuild()
PaymentConfirmRequest.model_rebuild()  # ← THIS ONE WAS FAILING
PaymentStatusResponse.model_rebuild()