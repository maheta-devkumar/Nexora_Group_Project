from fastapi import APIRouter, Depends, Query, status
from typing import Optional
from config.dependencies import get_current_user, is_admin
from controllers.notification_controller import NotificationController
from schemas.notification import (
    NotificationCreate, 
    NotificationOut, 
    BulkNotificationCreate,
    NotificationList,
    UnreadCountResponse
)
from models.user import User

# Import admin dependencies
from controllers.notification_admin_controller import NotificationAdminController
from schemas.notification_admin import (
    NotificationSearchQuery,
    NotificationBroadcast,
    NotificationUpdateAdmin,
    DeleteOldNotifications,
    NotificationStatsResponse,
    NotificationTypeStatsResponse,
    NotificationListAdmin
)

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])

# ====================
# CUSTOMER ENDPOINTS (Original)
# ====================

# ✅ GET /api/v1/notifications/ - Get all notifications for current user
@router.get("/", response_model=NotificationList)
def get_user_notifications(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    current_user: User = Depends(get_current_user),
    controller: NotificationController = Depends()
):
    """
    Get all notifications for the authenticated user with pagination.
    Optionally filter by read status.
    """
    return controller.get_user_notifications(current_user, skip, limit, is_read)

# ✅ GET /api/v1/notifications/unread-count - Get unread count
@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    controller: NotificationController = Depends()
):
    """Get the count of unread notifications for the current user"""
    return controller.get_unread_count(current_user)

# ✅ POST /api/v1/notifications/ - Create notification (Admin only)
@router.post("/", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(is_admin),
    controller: NotificationController = Depends()
):
    """Create and send a notification to a specific user (Admin only)"""
    return controller.create_notification(notification_data, current_user)

# ✅ POST /api/v1/notifications/bulk - Send bulk notifications (Admin only)
@router.post("/bulk", response_model=list[NotificationOut], status_code=status.HTTP_201_CREATED)
def create_bulk_notifications(
    bulk_data: BulkNotificationCreate,
    current_user: User = Depends(is_admin),
    controller: NotificationController = Depends()
):
    """Send notifications to multiple users (Admin only)"""
    return controller.create_bulk_notifications(bulk_data, current_user)

# ✅ PUT /api/v1/notifications/{notification_id}/read - Mark as read
@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    controller: NotificationController = Depends()
):
    """Mark a specific notification as read"""
    return controller.mark_notification_read(notification_id, current_user)

# ✅ PUT /api/v1/notifications/mark-all-read - Mark all as read
@router.put("/mark-all-read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    controller: NotificationController = Depends()
):
    """Mark all notifications for the current user as read"""
    return controller.mark_all_notifications_read(current_user)

# ✅ DELETE /api/v1/notifications/{notification_id} - Delete notification
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    controller: NotificationController = Depends()
):
    """Delete a specific notification"""
    return controller.delete_notification(notification_id, current_user)

# ✅ DELETE /api/v1/notifications/ - Delete all notifications
@router.delete("/")
def delete_all_notifications(
    current_user: User = Depends(get_current_user),
    controller: NotificationController = Depends()
):
    """Delete all notifications for the current user"""
    return controller.delete_all_notifications(current_user)

# ====================
# ADMIN ENDPOINTS (From notification_admin_routes.py)
# ====================

# 🔐 All admin routes require admin authentication

# 1️⃣ Viewing & Filtering (Core)

@router.get("/admin/all", response_model=NotificationListAdmin)
def get_all_notifications(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=200, description="Number of records to return"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    type: Optional[str] = Query(None, description="Filter by notification type"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    keyword: Optional[str] = Query(None, description="Search by title or message"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    📋 **ADMIN ONLY** - View all notifications in the system with filtering
    
    - **Main admin dashboard view**
    - Filter by user, type, read status
    - Search by keyword in title/message
    - Date range filtering
    - Pagination support
    """
    # Prepare filters
    filters = NotificationSearchQuery(
        user_id=user_id,
        type=type,
        is_read=is_read,
        keyword=keyword,
        start_date=start_date,
        end_date=end_date
    )
    
    return controller.get_all_notifications(skip, limit, filters)

@router.get("/admin/user/{user_id}", response_model=NotificationListAdmin)
def get_notifications_by_user(
    user_id: int,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    👤 **ADMIN ONLY** - View notifications for a specific user
    
    - **Customer support and issue tracking**
    - View all notifications for any user
    - Pagination support
    """
    return controller.get_notifications_by_user(user_id, skip, limit)

@router.get("/admin/unread", response_model=NotificationListAdmin)
def get_unread_notifications(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    🔔 **ADMIN ONLY** - Get all unread notifications in the system
    
    - **Highlight messages that need attention**
    - View pending/unread notifications
    - Pagination support
    """
    return controller.get_unread_notifications(skip, limit)

@router.get("/admin/search", response_model=NotificationListAdmin)
def search_notifications(
    keyword: str = Query(..., min_length=2, description="Search keyword"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    🔍 **ADMIN ONLY** - Search notifications by title or message
    
    - **Fast admin lookup**
    - Search across all notifications
    - Minimum 2 characters required
    - Pagination support
    """
    return controller.search_notifications(keyword, skip, limit)

# 2️⃣ Analytics (Dashboard Insight)

@router.get("/admin/stats", response_model=NotificationStatsResponse)
def get_notification_stats(
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    📊 **ADMIN ONLY** - Get notification statistics
    
    - **Quick overview cards on dashboard**
    - Total notifications
    - Unread count
    - Users with notifications
    - Average notifications per user
    """
    return controller.get_notification_stats()

@router.get("/admin/stats/by-type", response_model=NotificationTypeStatsResponse)
def get_notification_count_by_type(
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    📈 **ADMIN ONLY** - Get notification count by type
    
    - **Understand which events occur most**
    - Count notifications grouped by type
    - Percentage breakdown
    """
    return controller.get_notification_count_by_type()

# 3️⃣ Sending & Broadcasting

@router.post("/admin/send-to-user", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def send_notification_to_user(
    user_id: int = Query(..., description="User ID to send notification to"),
    title: str = Query(..., description="Notification title"),
    message: str = Query(..., description="Notification message"),
    type: str = Query("SYSTEM", description="Notification type"),
    reference_id: Optional[int] = Query(None, description="Optional reference ID"),
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    📤 **ADMIN ONLY** - Send notification to a single user
    
    - **Direct communication or alerts**
    - Send to any user by ID
    - Supports all notification types
    - Optional reference ID for linking
    """
    return controller.send_notification_to_user(user_id, title, message, type, reference_id)

@router.post("/admin/send-to-multiple", response_model=list[NotificationOut], status_code=status.HTTP_201_CREATED)
def send_notification_to_multiple_users(
    user_ids: list[int] = Query(..., description="List of user IDs"),
    title: str = Query(..., description="Notification title"),
    message: str = Query(..., description="Notification message"),
    type: str = Query("SYSTEM", description="Notification type"),
    reference_id: Optional[int] = Query(None, description="Optional reference ID"),
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    📨 **ADMIN ONLY** - Send notifications to multiple users
    
    - **Partial announcements or campaigns**
    - Send to selected users
    - Batch processing
    - All users receive the same message
    """
    return controller.send_notification_to_multiple_users(user_ids, title, message, type, reference_id)

@router.post("/admin/broadcast", status_code=status.HTTP_201_CREATED)
def send_notification_to_all_users(
    broadcast: NotificationBroadcast,
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    📢 **ADMIN ONLY** - Broadcast notification to all users
    
    - **System-wide alerts**
    - Send to every user in the system
    - Ideal for maintenance announcements
    - System type by default
    """
    return controller.send_notification_to_all_users(broadcast)

# 4️⃣ Update & Moderation

@router.put("/admin/{notification_id}/read-admin", response_model=NotificationOut)
def mark_notification_read_by_admin(
    notification_id: int,
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    ✅ **ADMIN ONLY** - Mark notification as read (admin override)
    
    - **Manual override if a user misses a notification**
    - Admin can mark any notification as read
    - Useful for customer support
    """
    return controller.mark_notification_read_by_admin(notification_id)

@router.put("/admin/{notification_id}", response_model=NotificationOut)
def update_notification(
    notification_id: int,
    update_data: NotificationUpdateAdmin,
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    ✏️ **ADMIN ONLY** - Update notification details
    
    - **Correct mistakes without deleting**
    - Update title, message, type, or reference
    - Partial updates supported
    """
    return controller.update_notification(notification_id, update_data)

# 5️⃣ Cleanup / Maintenance

@router.delete("/admin/{notification_id}")
def delete_notification_by_admin(
    notification_id: int,
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    🗑️ **ADMIN ONLY** - Delete a specific notification
    
    - **Moderation or user issue correction**
    - Admin can delete any notification
    - Immediate removal
    """
    return controller.delete_notification_by_admin(notification_id)

@router.delete("/admin/cleanup/old")
def delete_old_notifications(
    days: int = Query(30, ge=1, le=365, description="Delete notifications older than X days"),
    confirm: bool = Query(False, description="Set to true to confirm deletion"),
    current_user: User = Depends(is_admin),
    controller: NotificationAdminController = Depends()
):
    """
    🧹 **ADMIN ONLY** - Delete old notifications
    
    - **Keep database clean and optimized**
    - Remove notifications older than X days
    - Preview mode (confirm=false) shows what would be deleted
    - Confirmation required for actual deletion
    """
    return controller.delete_old_notifications(days, confirm)