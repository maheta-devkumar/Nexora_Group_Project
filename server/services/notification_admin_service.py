from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from repositories.notification_admin_repository import NotificationAdminRepository
from repositories.notification_repository import NotificationRepository
from schemas.notification import NotificationCreate, NotificationOut
from schemas.notification_admin import (
    NotificationSearchQuery,
    NotificationBroadcast,
    NotificationUpdateAdmin,
    DeleteOldNotifications,
    NotificationStatsResponse,
    NotificationTypeStatsResponse,
    NotificationWithUser,
    NotificationListAdmin
)
from models.notification import Notification as NotificationModel
from models.user import User
from utils.send_email import EmailService  # Import email service
from datetime import datetime


class NotificationAdminService:
    
    def __init__(self, db: Session):
        self.db = db
        self.admin_repo = NotificationAdminRepository()
        self.repo = NotificationRepository()
        self.email_service = EmailService(db_session=db)  # Initialize email service
    
    def get_all_notifications(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[NotificationSearchQuery] = None
    ) -> NotificationListAdmin:
        """Get all notifications with user details and filtering"""
        notifications, total_count = self.admin_repo.get_all_notifications(
            self.db, skip, limit, filters
        )
        
        # Convert to response format with user details
        notification_list = []
        for notification in notifications:
            # Get user details
            user = self.db.query(User).filter(User.user_id == notification.user_id).first()
            
            notification_with_user = NotificationWithUser(
                notification_id=notification.notification_id,
                user_id=notification.user_id,
                user_email=user.email if user else None,
                user_name=f"{user.first_name} {user.last_name}".strip() if user else None,
                title=notification.title,
                message=notification.message,
                type=notification.type,
                is_read=notification.is_read,
                created_at=notification.created_at,
                read_at=notification.read_at,
                reference_id=notification.reference_id
            )
            notification_list.append(notification_with_user)
        
        return NotificationListAdmin(
            notifications=notification_list,
            total_count=total_count,
            page=skip // limit + 1 if limit > 0 else 1,
            limit=limit,
            filters=filters.model_dump() if filters else {}
        )
    
    def get_notifications_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> NotificationListAdmin:
        """Get all notifications for a specific user"""
        notifications, total_count = self.admin_repo.get_notifications_by_user(
            self.db, user_id, skip, limit
        )
        
        # Get user details
        user = self.db.query(User).filter(User.user_id == user_id).first()
        
        # Convert to response format
        notification_list = []
        for notification in notifications:
            notification_with_user = NotificationWithUser(
                notification_id=notification.notification_id,
                user_id=notification.user_id,
                user_email=user.email if user else None,
                user_name=f"{user.first_name} {user.last_name}".strip() if user else None,
                title=notification.title,
                message=notification.message,
                type=notification.type,
                is_read=notification.is_read,
                created_at=notification.created_at,
                read_at=notification.read_at,
                reference_id=notification.reference_id
            )
            notification_list.append(notification_with_user)
        
        return NotificationListAdmin(
            notifications=notification_list,
            total_count=total_count,
            page=skip // limit + 1 if limit > 0 else 1,
            limit=limit,
            filters={"user_id": user_id}
        )
    
    def get_unread_notifications(
        self,
        skip: int = 0,
        limit: int = 50
    ) -> NotificationListAdmin:
        """Get all unread notifications in the system"""
        notifications, total_count = self.admin_repo.get_unread_notifications(
            self.db, skip, limit
        )
        
        # Convert to response format with user details
        notification_list = []
        for notification in notifications:
            # Get user details
            user = self.db.query(User).filter(User.user_id == notification.user_id).first()
            
            notification_with_user = NotificationWithUser(
                notification_id=notification.notification_id,
                user_id=notification.user_id,
                user_email=user.email if user else None,
                user_name=f"{user.first_name} {user.last_name}".strip() if user else None,
                title=notification.title,
                message=notification.message,
                type=notification.type,
                is_read=notification.is_read,
                created_at=notification.created_at,
                read_at=notification.read_at,
                reference_id=notification.reference_id
            )
            notification_list.append(notification_with_user)
        
        return NotificationListAdmin(
            notifications=notification_list,
            total_count=total_count,
            page=skip // limit + 1 if limit > 0 else 1,
            limit=limit,
            filters={"is_read": False}
        )
    
    def search_notifications(
        self,
        keyword: str,
        skip: int = 0,
        limit: int = 50
    ) -> NotificationListAdmin:
        """Search notifications by title or message"""
        notifications, total_count = self.admin_repo.search_notifications(
            self.db, keyword, skip, limit
        )
        
        # Convert to response format with user details
        notification_list = []
        for notification in notifications:
            # Get user details
            user = self.db.query(User).filter(User.user_id == notification.user_id).first()
            
            notification_with_user = NotificationWithUser(
                notification_id=notification.notification_id,
                user_id=notification.user_id,
                user_email=user.email if user else None,
                user_name=f"{user.first_name} {user.last_name}".strip() if user else None,
                title=notification.title,
                message=notification.message,
                type=notification.type,
                is_read=notification.is_read,
                created_at=notification.created_at,
                read_at=notification.read_at,
                reference_id=notification.reference_id
            )
            notification_list.append(notification_with_user)
        
        return NotificationListAdmin(
            notifications=notification_list,
            total_count=total_count,
            page=skip // limit + 1 if limit > 0 else 1,
            limit=limit,
            filters={"keyword": keyword}
        )
    
    def get_notification_stats(self) -> NotificationStatsResponse:
        """Get notification statistics for admin dashboard"""
        stats = self.admin_repo.get_notification_stats(self.db)
        
        return NotificationStatsResponse(**stats)
    
    def get_notification_count_by_type(self) -> NotificationTypeStatsResponse:
        """Get notification count grouped by type"""
        stats_data = self.admin_repo.get_notification_count_by_type(self.db)
        
        total_count = sum(item['count'] for item in stats_data)
        
        return NotificationTypeStatsResponse(
            stats=stats_data,
            total=total_count
        )
    
    def send_notification_to_user(
        self,
        user_id: int,
        title: str,
        message: str,
        type: str,
        reference_id: Optional[int] = None
    ) -> NotificationOut:
        """Send notification to a single user (admin version)"""
        notification_data = NotificationCreate(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            reference_id=reference_id
        )
        
        db_notification = self.repo.create_notification(self.db, notification_data)
        
        # ============================================
        # SEND EMAIL NOTIFICATION TO CUSTOMER (c)
        # ============================================
        try:
            self._send_email_notification(db_notification)
        except Exception as email_error:
            # Don't fail notification if email fails
            print(f"⚠️ Email sending failed but notification was created: {email_error}")
        
        return NotificationOut.model_validate(db_notification)
    
    def send_notification_to_multiple_users(
        self,
        user_ids: List[int],
        title: str,
        message: str,
        type: str,
        reference_id: Optional[int] = None
    ) -> List[NotificationOut]:
        """Send notifications to multiple selected users"""
        from schemas.notification import BulkNotificationCreate
        
        bulk_data = BulkNotificationCreate(
            user_ids=user_ids,
            title=title,
            message=message,
            type=type,
            reference_id=reference_id
        )
        
        # Use the existing bulk notification method
        notifications_data = []
        for user_id in bulk_data.user_ids:
            notification_dict = {
                'user_id': user_id,
                'title': bulk_data.title,
                'message': bulk_data.message,
                'type': bulk_data.type,
                'reference_id': bulk_data.reference_id
            }
            notifications_data.append(notification_dict)
        
        db_notifications = self.repo.create_bulk_notifications(self.db, notifications_data)
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS TO MULTIPLE CUSTOMERS (c)
        # ============================================
        try:
            for notification in db_notifications:
                self._send_email_notification(notification)
        except Exception as email_error:
            # Don't fail bulk notifications if email fails
            print(f"⚠️ Email sending failed for bulk notifications: {email_error}")
        
        return [NotificationOut.model_validate(notification) for notification in db_notifications]
    
    def send_notification_to_all_users(self, broadcast: NotificationBroadcast) -> int:
        """Broadcast notification to all users"""
        count = self.admin_repo.send_notification_to_all_users(
            self.db,
            broadcast.title,
            broadcast.message,
            broadcast.type,
            broadcast.reference_id
        )
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS TO ALL CUSTOMERS (c)
        # ============================================
        try:
            # Get all user emails
            all_user_emails = self.email_service.get_all_user_emails()
            
            if all_user_emails:
                # Determine subject based on type
                subject_prefix = ""
                if broadcast.type == "PROMOTION":
                    subject_prefix = "🎁 Special Announcement: "
                elif broadcast.type == "SYSTEM":
                    subject_prefix = "🔔 Important System Update: "
                elif broadcast.type == "SECURITY":
                    subject_prefix = "🔐 Security Notice: "
                elif broadcast.type == "ANNOUNCEMENT":
                    subject_prefix = "📢 Important Announcement: "
                else:
                    subject_prefix = "📢 Notification: "
                
                subject = f"{subject_prefix}{broadcast.title}"
                
                # Format email message
                email_message = f"""
Dear Valued Customer,

{broadcast.message}

Notification Details:
- Title: {broadcast.title}
- Type: {broadcast.type}
- Sent: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Reference: {f'#{broadcast.reference_id}' if broadcast.reference_id else 'N/A'}

This is a broadcast notification sent to all users.

{
    "PROMOTION": "🎉 Special offers and promotions just for you!",
    "SYSTEM": "🔧 Important system updates and maintenance information.",
    "SECURITY": "🔐 Important security information to keep your account safe.",
    "ANNOUNCEMENT": "📢 Important announcements about our services.",
}.get(broadcast.type, "Important notification from our platform.")

You can manage your notification preferences in your account settings.

Thank you for being a valued customer!

Best regards,
Customer Support Team
"""
                
                # Send to all users
                results = self.email_service.send_to_all_users(subject, email_message)
               
        
        except Exception as email_error:
            # Don't fail broadcast if email fails
            print(f"⚠️ Email sending failed for broadcast: {email_error}")
        
        return count
    
    def mark_notification_read_by_admin(self, notification_id: int) -> Optional[NotificationOut]:
        """Admin can mark any notification as read"""
        notification = self.admin_repo.mark_notification_read_by_admin(self.db, notification_id)
        
        return NotificationOut.model_validate(notification) if notification else None
    
    def update_notification(
        self,
        notification_id: int,
        update_data: NotificationUpdateAdmin
    ) -> Optional[NotificationOut]:
        """Update notification details"""
        notification = self.admin_repo.update_notification(
            self.db,
            notification_id,
            title=update_data.title,
            message=update_data.message,
            type=update_data.type,
            reference_id=update_data.reference_id
        )
        
        return NotificationOut.model_validate(notification) if notification else None
    
    def delete_notification_by_admin(self, notification_id: int) -> bool:
        """Admin can delete any notification"""
        return self.admin_repo.delete_notification_by_admin(self.db, notification_id)
    
    def delete_old_notifications(self, days: int = 30) -> int:
        """Delete notifications older than specified days"""
        return self.admin_repo.delete_old_notifications(self.db, days)
    
    def _send_email_notification(self, notification: NotificationModel):
        """Send email notifications to customers"""
        try:
            # Get user email
            user_email = self.email_service.get_user_email_by_id(notification.user_id)
            if not user_email:
                print(f"⚠️ No email found for user ID {notification.user_id}")
                return
            
            # Determine email subject based on notification type
            subject_prefix = ""
            if notification.type == "ORDER":
                subject_prefix = "📦 Order Update: "
            elif notification.type == "PROMOTION":
                subject_prefix = "🎁 Special Offer: "
            elif notification.type == "SYSTEM":
                subject_prefix = "🔔 System Notification: "
            elif notification.type == "SECURITY":
                subject_prefix = "🔐 Security Alert: "
            elif notification.type == "ANNOUNCEMENT":
                subject_prefix = "📢 Announcement: "
            else:
                subject_prefix = "📢 Notification: "
            
            subject = f"{subject_prefix}{notification.title}"
            
            # Format email message
            email_message = f"""
Dear User,

{notification.message}

Notification Details:
- Title: {notification.title}
- Type: {notification.type}
- Sent: {notification.created_at.strftime('%Y-%m-%d %H:%M:%S') if notification.created_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Reference: {f'#{notification.reference_id}' if notification.reference_id else 'N/A'}

This notification was sent by the administration team.

You can view this notification and manage your preferences in your account dashboard.

If you have any questions, please contact our support team.

Best regards,
Support Team
"""
            
            # Send email
            self.email_service.send_email_to_customer(user_email, subject, email_message)
            
            print(f"✅ Admin notification email sent to user {notification.user_id}")
            
        except Exception as e:
            print(f"⚠️ Failed to send email notification: {e}")