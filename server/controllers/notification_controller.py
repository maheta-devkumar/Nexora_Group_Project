from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional
from config.dependencies import get_db, get_current_user
from services.notification_service import NotificationService
from schemas.notification import (
    NotificationCreate, 
    NotificationOut, 
    BulkNotificationCreate,
    NotificationList,
    UnreadCountResponse
)
from models.user import User

class NotificationController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = NotificationService(db)

    # ✅ CREATE - Send notification (Admin only)
    def create_notification(self, notification_data: NotificationCreate, current_user: User) -> NotificationOut:
        """Create and send a notification to a user (Admin only)"""
        try:
            return self.service.send_notification(
                user_id=notification_data.user_id,
                title=notification_data.title,
                message=notification_data.message,
                type=notification_data.type,
                reference_id=notification_data.reference_id
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send notification: {str(e)}"
            )

    # ✅ CREATE - Send bulk notifications (Admin only)
    def create_bulk_notifications(self, bulk_data: BulkNotificationCreate, current_user: User) -> list[NotificationOut]:
        """Send notifications to multiple users (Admin only)"""
        try:
            return self.service.send_bulk_notifications(bulk_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send bulk notifications: {str(e)}"
            )

    # ✅ READ - Get user notifications
    def get_user_notifications(
        self, 
        current_user: User,
        skip: int = 0, 
        limit: int = 50,
        is_read: Optional[bool] = None
    ) -> NotificationList:
        """Get all notifications for the current user"""
        try:
            return self.service.get_user_notifications(
                user_id=current_user.user_id,
                skip=skip,
                limit=limit,
                is_read=is_read
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch notifications: {str(e)}"
            )

    # ✅ READ - Get unread count
    def get_unread_count(self, current_user: User) -> UnreadCountResponse:
        """Get unread notification count for the current user"""
        try:
            count = self.service.get_unread_count(current_user.user_id)
            return UnreadCountResponse(unread_count=count)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get unread count: {str(e)}"
            )

    # ✅ UPDATE - Mark notification as read
    def mark_notification_read(self, notification_id: int, current_user: User) -> NotificationOut:
        """Mark a specific notification as read"""
        notification = self.service.mark_notification_read(notification_id, current_user.user_id)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        return notification

    # ✅ UPDATE - Mark all notifications as read
    def mark_all_notifications_read(self, current_user: User) -> dict:
        """Mark all user notifications as read"""
        try:
            count = self.service.mark_all_notifications_read(current_user.user_id)
            return {
                "message": f"Successfully marked {count} notifications as read",
                "marked_count": count
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to mark notifications as read: {str(e)}"
            )

    # ✅ DELETE - Delete a notification
    def delete_notification(self, notification_id: int, current_user: User) -> dict:
        """Delete a specific notification"""
        success = self.service.delete_notification(notification_id, current_user.user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        return {"message": "Notification deleted successfully"}

    # ✅ DELETE - Delete all notifications
    def delete_all_notifications(self, current_user: User) -> dict:
        """Delete all notifications for the current user"""
        try:
            count = self.service.delete_all_notifications(current_user.user_id)
            return {
                "message": f"Successfully deleted {count} notifications",
                "deleted_count": count
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete notifications: {str(e)}"
            )