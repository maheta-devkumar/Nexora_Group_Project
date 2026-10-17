from sqlalchemy.orm import Session
from models.user import User
from models.role import UserRole
from models.address import Address
from models.cart import Cart
from models.wishlist import Wishlist
from models.order.order import Order
from models.payment import Payment
from models.analytics.review_vote import ReviewVote
from models.analytics.recently_viewed import RecentlyViewed
from models.analytics.search_history import SearchHistory
from models.analytics.user_sessions import UserSession 
from models.analytics.admin_activity_log import AdminActivityLog 
from models.notification import Notification
from models.feedback.feedback import Feedback
from models.feedback.user_issue import UserIssue
from models.delivery.delivery_person import DeliveryPerson
from typing import List, Optional

class UserRepository:
    
    @staticmethod
    def get_all_users(db: Session) -> List[User]:
        """Get all users"""
        return db.query(User).all()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.user_id == user_id).first()
    


    @staticmethod
    def get_admin_users(db: Session) -> List[User]:
        """Get all admin users"""
        from models.role import Role # Local import to avoid circular dep if any
        return db.query(User).join(UserRole, User.user_id == UserRole.user_id).join(Role, UserRole.role_id == Role.role_id).filter(Role.role_name == 'admin').all()
    
    @staticmethod
    def update_user(db: Session, user: User, update_data: dict) -> User:
        """Update user"""
        for key, value in update_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def delete_user(db: Session, user: User) -> None:

        user_id = user.user_id

        # ---------------------------
        # DELETE MODELS DEPENDING ON USER
        # ---------------------------
        db.query(UserRole).filter(UserRole.user_id == user_id).delete()
        db.query(Address).filter(Address.user_id == user_id).delete()
        db.query(Cart).filter(Cart.user_id == user_id).delete()
        db.query(Wishlist).filter(Wishlist.user_id == user_id).delete()
        db.query(Order).filter(Order.user_id == user_id).delete()
        db.query(Payment).filter(Payment.user_id == user_id).delete()
        db.query(ReviewVote).filter(ReviewVote.user_id == user_id).delete()
        db.query(Notification).filter(Notification.user_id == user_id).delete()
        db.query(Feedback).filter(Feedback.user_id == user_id).delete()
        db.query(RecentlyViewed).filter(RecentlyViewed.user_id == user_id).delete()
        db.query(SearchHistory).filter(SearchHistory.user_id == user_id).delete()
        db.query(UserSession).filter(UserSession.user_id == user_id).delete()

        # Admin logs (admin_id = user_id)
        db.query(AdminActivityLog).filter(AdminActivityLog.admin_id == user_id).delete()

        # UserIssue can contain user_id in raised_by_id
        db.query(UserIssue).filter(UserIssue.raised_by_id == user_id).delete()

        # Delivery person entries (1-to-1)
        db.query(DeliveryPerson).filter(DeliveryPerson.user_id == user_id).delete()

        # ---------------------------
        # FINALLY DELETE USER
        # ---------------------------
        db.delete(user)
        db.commit()