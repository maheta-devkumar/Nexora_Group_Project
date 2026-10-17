from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# --- Utility Schemas ---
class DeliveryPersonDetail(BaseModel):
    delivery_person_id: int
    user_name: str
    license_number: Optional[str] = None
    status: str
    rating: float
    total_deliveries: int
    total_earnings: float

class DeliveryDetail(BaseModel):
    delivery_id: int
    order_id: int
    delivery_person_name: Optional[str] = None
    status: str
    assigned_at: datetime
    delivered_at: Optional[datetime] = None
    order_status: str
    customer_name: str
    customer_address: str

class DeliverySummaryResponseData(BaseModel):
    deliveries: List[DeliveryDetail]
    total_deliveries: int

class DeliveryPersonSummaryResponseData(BaseModel):
    delivery_persons: List[DeliveryPersonDetail]
    total_delivery_persons: int

# --- Core Delivery Schemas ---
class DeliveryPersonBase(BaseModel):
    user_id: int
    license_number: Optional[str] = None

class DeliveryPersonCreate(DeliveryPersonBase):
    pass

class DeliveryPersonUpdate(BaseModel):
    license_number: Optional[str] = None
    status: Optional[str] = None

class DeliveryPersonResponse(DeliveryPersonBase):
    delivery_person_id: int
    status: str
    rating: Decimal
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DeliveryBase(BaseModel):
    order_id: int
    delivery_person_id: Optional[int] = None

class DeliveryCreate(DeliveryBase):
    pass

class DeliveryUpdate(BaseModel):
    delivery_person_id: Optional[int] = None
    status: Optional[str] = None

class DeliveryResponse(DeliveryBase):
    delivery_id: int
    status: str
    assigned_at: datetime
    delivered_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Delivery Status Update ---
class DeliveryStatusUpdate(BaseModel):
    status: str

# --- Delivery Earnings Schemas ---
class DeliveryEarningsResponse(BaseModel):
    earning_id: int
    delivery_person_id: int
    delivery_id: int
    amount: float
    earned_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DeliveryEarningsSummary(BaseModel):
    total_earnings: float
    completed_deliveries: int
    pending_earnings: float
    current_month_earnings: float

# --- Return and Refund Schemas ---
class ReturnItem(BaseModel):
    variant_id: int = Field(..., gt=0, description="Variant ID must be greater than 0")
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0")
    reason: str

class ReturnRequestCreate(BaseModel):
    order_id: int
    items: List[ReturnItem]
    reason: str
    description: Optional[str] = None

class ReturnRequestUpdate(BaseModel):
    status: Optional[str] = None

class ReturnItemResponse(BaseModel):
    return_id: int
    variant_id: int
    quantity: int
    product_name: str
    variant_name: str
    unit_price: float

class ReturnRequestResponse(BaseModel):
    return_id: int
    order_id: int
    reason: str
    description: Optional[str] = None
    status: str
    requested_at: datetime
    total_refund_amount: float

class RefundResponse(BaseModel):
    refund_id: int
    return_id: int
    payment_id: Optional[int] = None  # ADD THIS
    amount: float
    status: str
    payment_method: Optional[str] = None  # ADD THIS
    transaction_id: Optional[str] = None
    processed_by: Optional[str] = None  # ADD THIS
    processed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class ReturnWithItemsResponse(BaseModel):
    return_request: ReturnRequestResponse
    items: List[ReturnItemResponse]
    refund: Optional[RefundResponse] = None

# --- MISSING REFUND SCHEMAS - ADD THESE ---
class RefundListResponse(BaseModel):
    refunds: List[RefundResponse]
    total_refunds: int

class PaymentRefundStatus(BaseModel):
    payment_id: int
    total_paid: float
    total_refunded: float
    available_for_refund: float
    refund_history: List[dict]

class RefundRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Refund amount must be greater than 0")
    reason: str

# --- Wrapper Schemas ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class DeliverySummaryWrapper(SuccessWrapper):
    data: DeliverySummaryResponseData

class DeliveryPersonSummaryWrapper(SuccessWrapper):
    data: DeliveryPersonSummaryResponseData

class DeliveryWrapper(SuccessWrapper):
    data: DeliveryDetail

class DeliveryListWrapper(SuccessWrapper):
    data: List[DeliveryDetail]

class DeliveryPersonWrapper(SuccessWrapper):
    data: DeliveryPersonResponse

class DeliveryPersonListWrapper(SuccessWrapper):
    data: List[DeliveryPersonDetail]

class DeliveryEarningsWrapper(SuccessWrapper):
    data: DeliveryEarningsSummary

class ReturnRequestWrapper(SuccessWrapper):
    data: ReturnRequestResponse

class ReturnWithItemsWrapper(SuccessWrapper):
    data: ReturnWithItemsResponse

class ReturnListWrapper(SuccessWrapper):
    data: List[ReturnRequestResponse]

class RefundWrapper(SuccessWrapper):
    data: RefundResponse

# --- ADD THESE MISSING WRAPPER SCHEMAS ---
class RefundListWrapper(SuccessWrapper):
    data: List[RefundResponse]

class RefundListResponseWrapper(SuccessWrapper):
    data: RefundListResponse

class PaymentRefundStatusWrapper(SuccessWrapper):
    data: PaymentRefundStatus

class RefundRequestWrapper(SuccessWrapper):
    data: RefundRequest

class MessageWrapper(SuccessWrapper):
    data: dict = {}

# --- Additional Schemas ---
class DeliveryPersonApplication(BaseModel):
    license_number: str

class DeliveryPersonDetailResponse(BaseModel):
    delivery_person_id: int
    user_id: int
    user_name: str
    email: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    status: str
    rating: float
    total_deliveries: int
    total_earnings: float
    joined_at: datetime

class DeliveryPersonDetailWrapper(SuccessWrapper):
    data: DeliveryPersonDetailResponse

# Add this schema for list views
class DeliveryPersonListResponse(BaseModel):
    delivery_person_id: int
    user_name: str
    license_number: Optional[str] = None
    status: str
    rating: float
    total_deliveries: int
    total_earnings: float

# Update the wrapper
class DeliveryPersonListWrapper(SuccessWrapper):
    data: List[DeliveryPersonListResponse]  # Use the new schema

# Keep the detailed response for single item views
class DeliveryPersonResponse(DeliveryPersonBase):
    delivery_person_id: int
    status: str
    rating: Decimal
    joined_at: datetime
    model_config = ConfigDict(from_attributes=True)