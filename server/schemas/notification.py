from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum

class NotificationType(str, Enum):
    ORDER = "ORDER"
    PAYMENT = "PAYMENT"
    DELIVERY = "DELIVERY"
    DELIVERY_OFFER = "DELIVERY_OFFER"
    OFFER = "OFFER"
    FEEDBACK = "FEEDBACK"
    SYSTEM = "SYSTEM"
    SECURITY = "SECURITY"

# Base schema
class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType
    reference_id: Optional[int] = None

# For creating notifications
class NotificationCreate(NotificationBase):
    user_id: int

# For bulk notifications
class BulkNotificationCreate(BaseModel):
    user_ids: list[int]
    title: str
    message: str
    type: NotificationType
    reference_id: Optional[int] = None

# For updating notification (mark as read)
class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

# Response schema
class NotificationOut(NotificationBase):
    model_config = ConfigDict(from_attributes=True)
    
    notification_id: int
    user_id: int
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

# For listing notifications with pagination
class NotificationList(BaseModel):
    notifications: list[NotificationOut]
    total_count: int
    unread_count: int

# For unread count
class UnreadCountResponse(BaseModel):
    unread_count: int