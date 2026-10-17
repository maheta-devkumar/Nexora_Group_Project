from sqlalchemy.orm import Session
from typing import List, Optional
from repositories.notification_repository import NotificationRepository
from schemas.notification import (
    NotificationCreate, 
    NotificationOut, 
    BulkNotificationCreate,
    NotificationList
)
from models.notification import Notification as NotificationModel
from utils.send_email import EmailService  # Import email service
from models.user import User

class NotificationService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = NotificationRepository()
        self.email_service = EmailService(db_session=db)  # Initialize email service
    
    def send_notification_by_email(
        self, 
        email: str, 
        title: str, 
        message: str, 
        type: str,
        reference_id: Optional[int] = None
    ) -> Optional[NotificationOut]:
        """
        Send a system notification to a user by their email address.
        
        Args:
            email: User's email address
            title: Notification title
            message: Notification message
            type: Notification type (ORDER, PROMOTION, SYSTEM, SECURITY, etc.)
            reference_id: Optional reference ID (order_id, promotion_id, etc.)
            
        Returns:
            NotificationOut if successful, None if user not found
        """
        # Find user by email
        user = self.db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"⚠️ User with email {email} not found")
            return None
        
        # Create notification using existing method
        return self.send_notification(
            user_id=user.id,
            title=title,
            message=message,
            type=type,
            reference_id=reference_id
        )

    def send_bulk_notifications_by_email(
        self,
        emails: List[str],
        title: str,
        message: str,
        type: str,
        reference_id: Optional[int] = None
    ) -> List[NotificationOut]:
        """
        Send system notifications to multiple users by their email addresses.
        
        Args:
            emails: List of user email addresses
            title: Notification title
            message: Notification message
            type: Notification type (ORDER, PROMOTION, SYSTEM, SECURITY, etc.)
            reference_id: Optional reference ID (order_id, promotion_id, etc.)
            
        Returns:
            List of NotificationOut objects (only for users that were found)
        """
        notifications = []
        
        for email in emails:
            notification = self.send_notification_by_email(
                email=email,
                title=title,
                message=message,
                type=type,
                reference_id=reference_id
            )
            
            if notification:
                notifications.append(notification)
            else:
                print(f"⚠️ Skipped notification for email {email} - user not found")
        
        return notifications

    def send_notification(
        self, 
        user_id: int, 
        title: str, 
        message: str, 
        type: str,
        reference_id: Optional[int] = None
    ) -> NotificationOut:
        """Send a single notification to a user"""
        notification_data = NotificationCreate(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            reference_id=reference_id
        )
        
        db_notification = self.repository.create_notification(self.db, notification_data)
        
        # ============================================
        # SEND EMAIL NOTIFICATION TO CUSTOMER (c)
        # ============================================
        try:
            self._send_email_notification(db_notification)
        except Exception as email_error:
            # Don't fail notification creation if email fails
            print(f"⚠️ Email sending failed but notification was created: {email_error}")
        
        return NotificationOut.model_validate(db_notification)

    def send_bulk_notifications(self, bulk_data: BulkNotificationCreate) -> List[NotificationOut]:
        """Send notifications to multiple users"""
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
        
        db_notifications = self.repository.create_bulk_notifications(self.db, notifications_data)
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS TO CUSTOMERS (c)
        # ============================================
        try:
            for notification in db_notifications:
                self._send_email_notification(notification)
        except Exception as email_error:
            # Don't fail bulk notifications if email fails
            print(f"⚠️ Email sending failed for bulk notifications: {email_error}")
        
        return [NotificationOut.model_validate(notification) for notification in db_notifications]

    def get_user_notifications(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 50,
        is_read: Optional[bool] = None
    ) -> NotificationList:
        """Get all notifications for a user with pagination"""
        notifications = self.repository.get_user_notifications(self.db, user_id, skip, limit, is_read)
        total_count = self.repository.get_total_count(self.db, user_id)
        unread_count = self.repository.get_unread_count(self.db, user_id)
        
        return NotificationList(
            notifications=[NotificationOut.model_validate(notification) for notification in notifications],
            total_count=total_count,
            unread_count=unread_count
        )

    def mark_notification_read(self, notification_id: int, user_id: int) -> Optional[NotificationOut]:
        """Mark a specific notification as read"""
        notification = self.repository.mark_as_read(self.db, notification_id, user_id)
        return NotificationOut.model_validate(notification) if notification else None

    def mark_all_notifications_read(self, user_id: int) -> int:
        """Mark all user notifications as read"""
        return self.repository.mark_all_as_read(self.db, user_id)

    def get_unread_count(self, user_id: int) -> int:
        """Get unread notification count for a user"""
        return self.repository.get_unread_count(self.db, user_id)

    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete a specific notification"""
        return self.repository.delete_notification(self.db, notification_id, user_id)

    def delete_all_notifications(self, user_id: int) -> int:
        """Delete all notifications for a user"""
        return self.repository.delete_all_notifications(self.db, user_id)

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
- Sent: {notification.created_at.strftime('%Y-%m-%d %H:%M:%S') if notification.created_at else 'Recently'}
- Reference: {f'#{notification.reference_id}' if notification.reference_id else 'N/A'}

You can view this notification and manage your preferences in your account dashboard.

Thank you for using our platform.

Best regards,
Notification System
"""
            
            # Send email
            self.email_service.send_email_to_customer(user_email, subject, email_message)
            
            
        except Exception as e:
            print(f"⚠️ Failed to send email notification: {e}")