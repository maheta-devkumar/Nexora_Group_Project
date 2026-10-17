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



class PaymentType(str, Enum):
    COD = "cod"
    PREPAID = "prepaid"


class PriorityLevel(str, Enum):
    URGENT = "URGENT"
    HIGH = "HIGH"
    NORMAL = "NORMAL"


class IssueType(str, Enum):
    DELIVERY = "delivery"
    PAYMENT = "payment"
    CUSTOMER = "customer"
    ADDRESS = "address"
    OTHER = "other"


# Dashboard Statistics
class DashboardStats(BaseModel):
    today_deliveries: int
    completed: int
    earnings: float
    rating: float
    yesterday_comparison: float
    average_per_delivery: float
    total_reviews: int
    in_progress: int


# Active Delivery Orders
class CustomerInfo(BaseModel):
    name: str
    phone: str
    avatar: Optional[str] = None


class DeliveryOrder(BaseModel):
    id: str
    order_id: int
    priority: Optional[PriorityLevel] = None
    status: DeliveryStatus
    status_text: str
    customer: CustomerInfo
    pickup_location: str
    delivery_location: str
    distance: str
    expected_time: str
    items: int
    payment_type: PaymentType
    amount: Optional[float] = None
    progress: int = 0
    eta: Optional[str] = None
    actions: List[str]


class ActiveDeliveriesResponse(BaseModel):
    active_orders: List[DeliveryOrder]


# Delivery Status Update
class StatusUpdateRequest(BaseModel):
    status: DeliveryStatus
    notes: Optional[str] = None


class QRVerifyRequest(BaseModel):
    qr_data: str
    order_id: Optional[int] = None


# Earnings Overview
class EarningsPeriod(BaseModel):
    period: str
    amount: float
    deliveries: Optional[int] = None
    description: Optional[str] = None


class EarningsOverviewResponse(BaseModel):
    periods: List[EarningsPeriod]
    pending_settlement: float


# Today's Schedule
class Shift(BaseModel):
    id: int
    type: str  # 'shift' or 'break'
    title: str
    time: str
    location: Optional[str] = None
    status: str  # 'ongoing', 'completed', 'upcoming'
    completed_tasks: Optional[int] = None
    total_tasks: Optional[int] = None
    scheduled_deliveries: Optional[int] = None


class NextDelivery(BaseModel):
    id: str
    customer: str
    time: str
    address: str
    distance: str


class TodayScheduleResponse(BaseModel):
    date: str
    upcoming_shifts: List[Shift]
    next_delivery: NextDelivery


# Quick Actions
class IssueReportRequest(BaseModel):
    order_id: int
    issue_type: IssueType
    description: str
    priority: Optional[str] = "MEDIUM"


class PODUploadRequest(BaseModel):
    order_id: int
    image_url: str
    signature_url: Optional[str] = None
    notes: Optional[str] = None


# Navigation
class NavigationResponse(BaseModel):
    google_maps_url: str
    openstreetmap_url: str
    latitude: float
    longitude: float


# Performance Metrics
class PerformanceMetrics(BaseModel):
    total_deliveries: int
    on_time_deliveries: int
    on_time_rate: float
    average_rating: float
    total_earnings: float
    average_delivery_time: float  # in minutes


# General Response
class DeliveryDashboardResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None