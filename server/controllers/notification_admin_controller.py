from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional
from config.dependencies import get_db, is_admin
from services.notification_admin_service import NotificationAdminService
from schemas.notification_admin import (
    NotificationSearchQuery,
    NotificationBroadcast,
    NotificationUpdateAdmin,
    DeleteOldNotifications,
    NotificationStatsResponse,
    NotificationTypeStatsResponse,
    NotificationListAdmin
)
from schemas.notification import NotificationOut, BulkNotificationCreate
from models.user import User

class NotificationAdminController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = NotificationAdminService(db)
    
    # 1️⃣ Viewing & Filtering (Core)
    
    def get_all_notifications(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[NotificationSearchQuery] = None
    ) -> NotificationListAdmin:
        """View all notifications in the system"""
        try:
            return self.service.get_all_notifications(skip, limit, filters)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch notifications: {str(e)}"
            )
    
    def get_notifications_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> NotificationListAdmin:
        """View notifications for a specific user"""
        try:
            return self.service.get_notifications_by_user(user_id, skip, limit)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch user notifications: {str(e)}"
            )
    
    def get_unread_notifications(
        self,
        skip: int = 0,
        limit: int = 50
    ) -> NotificationListAdmin:
        """Get all unread notifications in the system"""
        try:
            return self.service.get_unread_notifications(skip, limit)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch unread notifications: {str(e)}"
            )
    
    def search_notifications(
        self,
        keyword: str,
        skip: int = 0,
        limit: int = 50
    ) -> NotificationListAdmin:
        """Search notifications by title or message"""
        try:
            if not keyword or len(keyword.strip()) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Search keyword must be at least 2 characters"
                )
            
            return self.service.search_notifications(keyword.strip(), skip, limit)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to search notifications: {str(e)}"
            )
    
    # 2️⃣ Analytics (Dashboard Insight)
    
    def get_notification_stats(self) -> NotificationStatsResponse:
        """Get notification statistics for dashboard"""
        try:
            return self.service.get_notification_stats()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get notification stats: {str(e)}"
            )
    
    def get_notification_count_by_type(self) -> NotificationTypeStatsResponse:
        """Get notification count grouped by type"""
        try:
            return self.service.get_notification_count_by_type()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get notification type stats: {str(e)}"
            )
    
    # 3️⃣ Sending & Broadcasting
    
    def send_notification_to_user(
        self,
        user_id: int,
        title: str,
        message: str,
        type: str,
        reference_id: Optional[int] = None
    ) -> NotificationOut:
        """Send notification to a single user"""
        try:
            # Verify user exists
            from models.user import User
            user = self.db.query(User).filter(User.user_id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User with ID {user_id} not found"
                )
            
            return self.service.send_notification_to_user(
                user_id, title, message, type, reference_id
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send notification: {str(e)}"
            )
    
    def send_notification_to_multiple_users(
        self,
        user_ids: list[int],
        title: str,
        message: str,
        type: str,
        reference_id: Optional[int] = None
    ) -> list[NotificationOut]:
        """Send notifications to multiple selected users"""
        try:
            # Verify all users exist
            from models.user import User
            existing_users = self.db.query(User.user_id).filter(User.user_id.in_(user_ids)).all()
            existing_user_ids = [user_id[0] for user_id in existing_users]
            
            missing_users = set(user_ids) - set(existing_user_ids)
            if missing_users:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Users not found: {missing_users}"
                )
            
            return self.service.send_notification_to_multiple_users(
                user_ids, title, message, type, reference_id
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send notifications: {str(e)}"
            )
    
    def send_notification_to_all_users(self, broadcast: NotificationBroadcast) -> dict:
        """Broadcast notification to all users"""
        try:
            count = self.service.send_notification_to_all_users(broadcast)
            return {
                "message": f"Notification sent to {count} users",
                "sent_count": count
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to broadcast notification: {str(e)}"
            )
    
    # 4️⃣ Update & Moderation
    
    def mark_notification_read_by_admin(self, notification_id: int) -> NotificationOut:
        """Admin can mark any notification as read"""
        notification = self.service.mark_notification_read_by_admin(notification_id)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        return notification
    
    def update_notification(
        self,
        notification_id: int,
        update_data: NotificationUpdateAdmin
    ) -> NotificationOut:
        """Update notification details"""
        try:
            # Check if at least one field is provided
            if all(value is None for value in update_data.model_dump().values()):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="At least one field must be provided for update"
                )
            
            notification = self.service.update_notification(notification_id, update_data)
            if not notification:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found"
                )
            return notification
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update notification: {str(e)}"
            )
    
    # 5️⃣ Cleanup / Maintenance
    
    def delete_notification_by_admin(self, notification_id: int) -> dict:
        """Admin can delete any notification"""
        success = self.service.delete_notification_by_admin(notification_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        return {"message": "Notification deleted successfully"}
    
    def delete_old_notifications(self, days: int = 30, confirm: bool = False) -> dict:
        """Delete notifications older than specified days"""
        try:
            if not confirm:
                # Return preview of what would be deleted
                from datetime import datetime, timedelta
                from sqlalchemy import func
                from models.notification import Notification
                
                cutoff_date = datetime.now() - timedelta(days=days)
                count = self.db.query(Notification).filter(
                    Notification.created_at < cutoff_date
                ).count()
                
                return {
                    "message": f"Preview: {count} notifications would be deleted (older than {days} days)",
                    "would_delete_count": count,
                    "confirm_required": True,
                    "instruction": "Set confirm=true to actually delete"
                }
            
            count = self.service.delete_old_notifications(days)
            return {
                "message": f"Successfully deleted {count} notifications older than {days} days",
                "deleted_count": count
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete old notifications: {str(e)}"
            )