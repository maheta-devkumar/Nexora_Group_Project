from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_, and_
from typing import List, Optional, Tuple, Dict
from datetime import datetime, timedelta
from models.notification import Notification
from models.user import User
from schemas.notification_admin import NotificationSearchQuery

class NotificationAdminRepository:
    
    @staticmethod
    def get_all_notifications(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[NotificationSearchQuery] = None
    ) -> Tuple[List[Notification], int]:
        """Get all notifications in the system with optional filtering"""
        query = db.query(Notification).join(User, Notification.user_id == User.user_id)
        
        if filters:
            # Apply filters
            if filters.user_id:
                query = query.filter(Notification.user_id == filters.user_id)
            
            if filters.type:
                query = query.filter(Notification.type == filters.type)
            
            if filters.is_read is not None:
                query = query.filter(Notification.is_read == filters.is_read)
            
            if filters.keyword:
                search_term = f"%{filters.keyword}%"
                query = query.filter(
                    or_(
                        Notification.title.ilike(search_term),
                        Notification.message.ilike(search_term)
                    )
                )
            
            if filters.start_date:
                query = query.filter(Notification.created_at >= filters.start_date)
            
            if filters.end_date:
                query = query.filter(Notification.created_at <= filters.end_date)
        
        # Get total count
        total = query.count()
        
        # Get paginated results
        notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        
        return notifications, total
    
    @staticmethod
    def get_notifications_by_user(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Notification], int]:
        """Get all notifications for a specific user"""
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        total = query.count()
        notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        
        return notifications, total
    
    @staticmethod
    def get_unread_notifications(db: Session, skip: int = 0, limit: int = 50) -> Tuple[List[Notification], int]:
        """Get all unread notifications in the system"""
        query = db.query(Notification).filter(Notification.is_read == False)
        
        total = query.count()
        notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        
        return notifications, total
    
    @staticmethod
    def search_notifications(
        db: Session,
        keyword: str,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Notification], int]:
        """Search notifications by title or message"""
        search_term = f"%{keyword}%"
        query = db.query(Notification).filter(
            or_(
                Notification.title.ilike(search_term),
                Notification.message.ilike(search_term)
            )
        )
        
        total = query.count()
        notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        
        return notifications, total
    
    @staticmethod
    def get_notification_stats(db: Session) -> Dict:
        """Get notification statistics for dashboard"""
        # Total notifications
        total_notifications = db.query(func.count(Notification.notification_id)).scalar() or 0
        
        # Total unread notifications
        total_unread = db.query(func.count(Notification.notification_id)).filter(
            Notification.is_read == False
        ).scalar() or 0
        
        # Total unique users with notifications
        total_users = db.query(func.count(func.distinct(Notification.user_id))).scalar() or 0
        
        # Average notifications per user
        avg_notifications = 0
        if total_users > 0:
            avg_notifications = total_notifications / total_users
        
        return {
            "total_notifications": total_notifications,
            "total_unread": total_unread,
            "total_users_with_notifications": total_users,
            "average_notifications_per_user": round(avg_notifications, 2)
        }
    
    @staticmethod
    def get_notification_count_by_type(db: Session) -> List[Dict]:
        """Get notification count grouped by type"""
        result = db.query(
            Notification.type,
            func.count(Notification.notification_id).label('count')
        ).group_by(Notification.type).all()
        
        total_count = db.query(func.count(Notification.notification_id)).scalar() or 1
        
        stats = []
        for type_name, count in result:
            percentage = (count / total_count) * 100 if total_count > 0 else 0
            stats.append({
                "type": type_name,
                "count": count,
                "percentage": round(percentage, 2)
            })
        
        return stats
    
    @staticmethod
    def send_notification_to_all_users(
        db: Session,
        title: str,
        message: str,
        type: str,
        reference_id: Optional[int] = None
    ) -> int:
        """Send notification to all users in the system"""
        # Get all user IDs
        user_ids = [user_id[0] for user_id in db.query(User.user_id).all()]
        
        if not user_ids:
            return 0
        
        # Create notifications in bulk
        notifications = []
        for user_id in user_ids:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=type,
                reference_id=reference_id,
                is_read=False,
                created_at=func.now()
            )
            notifications.append(notification)
        
        db.add_all(notifications)
        db.commit()
        
        return len(notifications)
    
    @staticmethod
    def mark_notification_read_by_admin(db: Session, notification_id: int) -> Optional[Notification]:
        """Admin can mark any notification as read"""
        notification = db.query(Notification).filter(
            Notification.notification_id == notification_id
        ).first()
        
        if notification and not notification.is_read:
            notification.is_read = True
            notification.read_at = func.now()
            db.commit()
            db.refresh(notification)
        
        return notification
    
    @staticmethod
    def update_notification(
        db: Session,
        notification_id: int,
        title: Optional[str] = None,
        message: Optional[str] = None,
        type: Optional[str] = None,
        reference_id: Optional[int] = None
    ) -> Optional[Notification]:
        """Update notification details"""
        notification = db.query(Notification).filter(
            Notification.notification_id == notification_id
        ).first()
        
        if notification:
            if title is not None:
                notification.title = title
            if message is not None:
                notification.message = message
            if type is not None:
                notification.type = type
            if reference_id is not None:
                notification.reference_id = reference_id
            
            db.commit()
            db.refresh(notification)
        
        return notification
    
    @staticmethod
    def delete_notification_by_admin(db: Session, notification_id: int) -> bool:
        """Admin can delete any notification"""
        notification = db.query(Notification).filter(
            Notification.notification_id == notification_id
        ).first()
        
        if notification:
            db.delete(notification)
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def delete_old_notifications(db: Session, days: int = 30) -> int:
        """Delete notifications older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        result = db.query(Notification).filter(
            Notification.created_at < cutoff_date
        ).delete()
        
        db.commit()
        return result
    
    @staticmethod
    def get_notification_with_user(db: Session, notification_id: int) -> Optional[Tuple[Notification, User]]:
        """Get notification with user details"""
        result = db.query(Notification, User).join(
            User, Notification.user_id == User.user_id
        ).filter(
            Notification.notification_id == notification_id
        ).first()
        
        return result