from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AvailableDeliveryResponse(BaseModel):
    delivery_id: int
    order_id: int  # INTEGER
    status: str
    customer_name: str
    delivery_address: str
    available_since: datetime
    waiting_time_minutes: float


# class AcceptDeliverySchema(BaseModel):
#     delivery_person_id: int


# class CancelDeliverySchema(BaseModel):
#     delivery_person_id: int


class DeliveryActionResponse(BaseModel):
    success: bool
    message: str
    delivery_id: int
    delivery_person_id: Optional[int] = None