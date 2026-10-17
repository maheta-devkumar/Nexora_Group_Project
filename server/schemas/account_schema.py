from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserProfile(BaseModel):
    first_name: str
    last_name: str
    email: str
    membership_tier: str
    status: str
    join_date: datetime
    phone: Optional[str] = None
    profile_img_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class AccountOverview(BaseModel):
    user_id: int
    name: str
    email: str
    membership_tier: str
    joined_date: datetime
    loyalty_points: int
    account_status: str
    profile_img_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class QuickStats(BaseModel):
    total_orders: int
    pending_orders: int
    wishlist_items: int
    wallet_balance: float
    unread_notifications: int
    saved_addresses: int
    reviews_given: int
    coupons_available: int
    total_spent: float  # Add this field for frontend
    loyalty_points: int  # Add this field for frontend
    
    model_config = ConfigDict(from_attributes=True)

class RecentActivity(BaseModel):
    id: int
    activity_type: str
    title: str
    description: str
    timestamp: datetime
    action_url: Optional[str] = None
    icon: str
    
    model_config = ConfigDict(from_attributes=True)

class AccountCard(BaseModel):
    id: int
    title: str
    description: str
    icon: str
    route: str
    badge_count: Optional[int] = 0
    status: Optional[str] = None
    category: str
    
    model_config = ConfigDict(from_attributes=True)

class OrderSummary(BaseModel):
    order_id: str
    date: datetime
    status: str
    items_count: int
    total_amount: float
    tracking_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class NotificationItem(BaseModel):
    id: int
    title: str
    message: str
    type: str
    timestamp: datetime
    is_read: bool
    action_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class Preferences(BaseModel):
    email_notifications: bool = True
    sms_notifications: bool = False
    newsletter: bool = True
    marketing_emails: bool = False
    
    model_config = ConfigDict(from_attributes=True)

class AccountDashboard(BaseModel):
    user: UserProfile  # Add this for frontend
    overview: AccountOverview
    stats: QuickStats
    recent_activities: List[RecentActivity]
    quick_access_cards: List[AccountCard]
    recent_orders: List[OrderSummary]
    notifications: List[NotificationItem]
    preferences: Preferences  # Add this for frontend
    
    model_config = ConfigDict(from_attributes=True)

# Wrapper schema for consistent API response
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class DashboardWrapper(SuccessWrapper):
    data: AccountDashboard