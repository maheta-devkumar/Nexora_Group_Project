from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# EXISTING SCHEMAS (Preserved exactly as they were)
class AssignDeliverySchema(BaseModel):
    order_id: int
    delivery_person_id: int


class UpdateDeliveryStatusSchema(BaseModel):
    status: str


class ReassignDeliverySchema(BaseModel):
    delivery_id: int
    new_delivery_person_id: int


class SearchDeliverySchema(BaseModel):
    order_id: Optional[int] = None
    delivery_person_id: Optional[int] = None
    status: Optional[str] = None


class DeliveryResponse(BaseModel):
    delivery_id: int
    order_id: int
    delivery_person_id: Optional[int]
    status: str
    assigned_at: datetime
    delivered_at: Optional[datetime]


class DeliveryStatsResponse(BaseModel):
    active: int
    completed: int
    pending: int
    cancelled: int


class DeliveryEarningsResponse(BaseModel):
    delivery_person_id: int
    total_earnings: float
    total_deliveries: int


class DeliveryPerformanceResponse(BaseModel):
    delivery_person_id: int
    completed_deliveries: int
    rating: float


class AssignedOrdersSummaryResponse(BaseModel):
    delivery_person_id: int
    active_orders: int


class DeliveryTimelineResponse(BaseModel):
    status: str
    timestamp: datetime


class DeliveryIssueResponse(BaseModel):
    issue_id: int
    delivery_id: int
    description: str
    created_at: datetime

# NEW SCHEMAS for ADMIN ONLY
class OrderWebhookSchema(BaseModel):
    order_id: int
    customer_id: int
    order_amount: float
    delivery_address: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    expected_delivery_time: Optional[datetime] = None
    created_at: datetime

class NotificationSchema(BaseModel):
    delivery_person_id: int
    delivery_id: Optional[int] = None
    order_id: int
    title: str
    message: str

class DeliveryPoolItem(BaseModel):
    delivery_id: int
    order_id: int
    status: str
    created_at: datetime
    delivery_person_id: Optional[int]
    waiting_time_minutes: float

class AvailableDeliveryPerson(BaseModel):
    delivery_person_id: int
    user_id: int
    rating: float
    is_online: bool
    status: str