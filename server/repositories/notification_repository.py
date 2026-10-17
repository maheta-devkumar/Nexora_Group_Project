from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from models.notification import Notification
from schemas.notification import NotificationCreate, NotificationUpdate
from datetime import datetime

class NotificationRepository:
    
    @staticmethod
    def create_notification(db: Session, notification_data: NotificationCreate) -> Notification:
        """Create a new notification"""
        db_notification = Notification(**notification_data.model_dump())
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        return db_notification

    @staticmethod
    def create_bulk_notifications(db: Session, notifications_data: list) -> List[Notification]:
        """Create multiple notifications at once - FIXED VERSION"""
        try:
            print(f"📨 Creating {len(notifications_data)} notifications...")
            
            # Create notification objects
            db_notifications = []
            for data in notifications_data:
                # Ensure required fields exist
                if not all(k in data for k in ['user_id', 'title', 'message', 'type']):
                    print(f"⚠️ Missing required fields in notification data: {data}")
                    continue
                
                # Add timestamp if not provided
                if 'created_at' not in data:
                    data['created_at'] = datetime.utcnow()
                
                # Add is_read if not provided
                if 'is_read' not in data:
                    data['is_read'] = False
                
                db_notifications.append(Notification(**data))
            
            if not db_notifications:
                print("⚠️ No valid notifications to create")
                return []
            
            # Add all and commit
            db.add_all(db_notifications)
            db.commit()
            
            # Get IDs for logging
            notification_ids = [n.notification_id for n in db_notifications]
            print(f"✅ Successfully created {len(db_notifications)} notifications with IDs: {notification_ids}")
            
            return db_notifications
            
        except Exception as e:
            db.rollback()
            print(f"❌ Error creating bulk notifications: {str(e)}")
            raise

    @staticmethod
    def get_user_notifications(
        db: Session, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 50,
        is_read: Optional[bool] = None
    ) -> List[Notification]:
        """Get notifications for a user with pagination"""
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)
            
        return query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def get_notification_by_id(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
        """Get a specific notification for a user"""
        return db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
        """Mark a notification as read"""
        notification = db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification and not notification.is_read:
            notification.is_read = True
            notification.read_at = func.now()
            db.commit()
            db.refresh(notification)
            
        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """Mark all user notifications as read"""
        result = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({
            'is_read': True,
            'read_at': func.now()
        })
        db.commit()
        return result

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get count of unread notifications for a user"""
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

    @staticmethod
    def get_total_count(db: Session, user_id: int) -> int:
        """Get total notification count for a user"""
        return db.query(Notification).filter(Notification.user_id == user_id).count()

    @staticmethod
    def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
        """Delete a specific notification"""
        notification = db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            db.delete(notification)
            db.commit()
            return True
        return False

    @staticmethod
    def delete_all_notifications(db: Session, user_id: int) -> int:
        """Delete all notifications for a user"""
        result = db.query(Notification).filter(Notification.user_id == user_id).delete()
        db.commit()
        return result