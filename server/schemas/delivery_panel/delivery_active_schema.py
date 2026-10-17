# delivery_panel/active_deliveries/delivery_active_schema.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from decimal import Decimal


# Enums
class DeliveryStatus(str, Enum):
    ASSIGNED = "ASSIGNED"
    PICKED_UP = "PICKED_UP"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"


class PaymentType(str, Enum):
    COD = "COD"
    PREPAID = "PREPAID"
    WALLET = "WALLET"
    ONLINE = "ONLINE"


class PriorityLevel(str, Enum):
    URGENT = "URGENT"
    HIGH = "HIGH"
    NORMAL = "NORMAL"


# Customer Information
class CustomerInfo(BaseModel):
    customer_id: int
    name: str
    phone: str
    avatar_url: Optional[str] = None


# Delivery Address
class DeliveryAddress(BaseModel):
    address_id: int
    line1: str
    line2: Optional[str] = None
    area_name: str
    city_name: str
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# Order Information
class OrderInfo(BaseModel):
    order_id: int
    order_number: str
    subtotal: float
    discount_amount: float
    delivery_fee: float
    total_amount: float
    payment_type: PaymentType
    cod_amount: Optional[float] = None
    items_count: int


# Single Active Delivery
class ActiveDelivery(BaseModel):
    delivery_id: int
    delivery_person_id: int
    order: OrderInfo
    customer: CustomerInfo
    delivery_address: DeliveryAddress
    status: DeliveryStatus
    status_label: str
    assigned_at: datetime
    picked_up_at: Optional[datetime] = None
    expected_delivery_time: Optional[datetime] = None
    distance_km: Optional[float] = None
    pod_image_url: Optional[str] = None
    signature_url: Optional[str] = None
    delivery_notes: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


# Response for Active Deliveries List
class ActiveDeliveriesListResponse(BaseModel):
    success: bool
    message: str
    active_deliveries: List[ActiveDelivery]
    count: int
    pending_pickup: int
    in_transit: int
    picked_up: int


# Single Delivery Response
class DeliveryResponse(BaseModel):
    success: bool
    message: str
    delivery: Optional[ActiveDelivery] = None


# Status Update Request
class StatusUpdateRequest(BaseModel):
    status: DeliveryStatus
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# Live Location Update Request
class LocationUpdateRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    timestamp: Optional[datetime] = None


# Location Update Response
class LocationUpdateResponse(BaseModel):
    success: bool
    message: str
    updated_at: datetime
    latitude: float
    longitude: float


# Customer Call Response
class CustomerCallResponse(BaseModel):
    success: bool
    message: str
    customer_name: str
    customer_phone: str
    delivery_id: int
    order_id: int
    call_timestamp: datetime


# Navigation Data Response
class NavigationDataResponse(BaseModel):
    success: bool
    message: str
    delivery_address: Optional[DeliveryAddress] = None
    formatted_address: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_url: str
    openstreetmap_url: str
    distance_km: Optional[float] = None
    estimated_time_minutes: Optional[int] = None


# Filter Request (for future filtering)
class DeliveryFilterRequest(BaseModel):
    status: Optional[DeliveryStatus] = None
    payment_type: Optional[PaymentType] = None
    priority: Optional[PriorityLevel] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    sort_by: Optional[str] = "assigned_at"
    sort_order: Optional[str] = "asc"


# Status Transition Validation
class StatusTransitionResponse(BaseModel):
    valid: bool
    current_status: DeliveryStatus
    target_status: DeliveryStatus
    allowed: bool
    message: str
    required_actions: List[str] = []


# Bulk Status Update Request
class BulkStatusUpdateRequest(BaseModel):
    delivery_ids: List[int]
    status: DeliveryStatus
    notes: Optional[str] = None


# Delivery Progress Update
class ProgressUpdateRequest(BaseModel):
    progress_percentage: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None


# Simple Success Response
class SuccessResponse(BaseModel):
    success: bool
    message: str
    timestamp: datetime


# Delivery Statistics
class DeliveryStatistics(BaseModel):
    total_active: int
    pending_pickup: int
    picked_up: int
    in_transit: int
    today_completed: int
    today_earnings: float
    avg_delivery_time_minutes: Optional[float] = None
    today_earnings: float
    avg_delivery_time_minutes: Optional[float] = None
    on_time_rate: Optional[float] = None


# OTP Request
class DeliveryOTPRequestResponse(BaseModel):
    success: bool
    message: str
    delivery_id: int
    otp_sent_to: str  # Email or partial phone
    expiry_seconds: int

# OTP Confirmation
class DeliveryOTPConfirmRequest(BaseModel):
    otp: str

class DeliveryOTPConfirmResponse(BaseModel):
    success: bool
    message: str
    delivery: Optional[ActiveDelivery] = None
