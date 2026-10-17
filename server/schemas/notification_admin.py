from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum
from schemas.notification import NotificationType

# Request schemas
class NotificationSearchQuery(BaseModel):
    keyword: Optional[str] = None
    user_id: Optional[int] = None
    type: Optional[NotificationType] = None
    is_read: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class BulkNotificationSend(BaseModel):
    user_ids: List[int]
    title: str
    message: str
    type: NotificationType
    reference_id: Optional[int] = None

class NotificationBroadcast(BaseModel):
    title: str
    message: str
    type: NotificationType = NotificationType.SYSTEM
    reference_id: Optional[int] = None

class NotificationUpdateAdmin(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[NotificationType] = None
    reference_id: Optional[int] = None

class DeleteOldNotifications(BaseModel):
    days: int = 30
    confirm: bool = False

# Response schemas
class NotificationStatsResponse(BaseModel):
    total_notifications: int
    total_unread: int
    total_users_with_notifications: int
    average_notifications_per_user: float

class NotificationTypeStats(BaseModel):
    type: str
    count: int
    percentage: float

class NotificationTypeStatsResponse(BaseModel):
    stats: List[NotificationTypeStats]
    total: int

class NotificationWithUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    notification_id: int
    user_id: int
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    reference_id: Optional[int] = None

class NotificationListAdmin(BaseModel):
    notifications: List[NotificationWithUser]
    total_count: int
    page: int
    limit: int
    filters: dict