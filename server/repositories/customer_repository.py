from sqlalchemy.orm import Session
from sqlalchemy import func
from models.user import User
from models.order.order import Order
from models.role import Role, UserRole
from models.address import Address
from models.cart import Cart
from models.wishlist import Wishlist
from models.payment import Payment
from models.analytics.review_vote import ReviewVote
from models.notification import Notification
from models.feedback.feedback import Feedback
from models.analytics.recently_viewed import RecentlyViewed
from models.analytics.search_history import SearchHistory
from models.analytics.user_sessions import UserSession
from models.analytics.admin_activity_log import AdminActivityLog
from models.feedback.user_issue import UserIssue
from models.delivery.delivery_person import DeliveryPerson
class CustomerRepository:

    @staticmethod
    def get_all_customers(db: Session):
        return (
            db.query(User)
            .join(UserRole)
            .join(Role)
            .filter(Role.role_name == "customer")
            .all()
        )

    @staticmethod
    def get_customer_by_id(db: Session, user_id: int):
        return (
            db.query(User)
            .join(UserRole)
            .join(Role)
            .filter(Role.role_name == "customer", User.user_id == user_id)
            .first()
        )

    @staticmethod
    def update_customer(db: Session, customer: User, data: dict):
        for key, value in data.items():
            setattr(customer, key, value)
        db.commit()
        db.refresh(customer)
        return customer



    @staticmethod
    def delete_customer(db: Session, user: User) -> None:
        """
        Permanently delete a CUSTOMER user and all dependent records.
        This method assumes the user role has already been validated as 'customer'.
        """

        user_id = user.user_id

        # ---------------------------
        # ROLE & AUTH
        # ---------------------------
        db.query(UserRole).filter(UserRole.user_id == user_id).delete()

        # ---------------------------
        # USER RELATED DATA
        # ---------------------------
        db.query(Address).filter(Address.user_id == user_id).delete()
        db.query(Cart).filter(Cart.user_id == user_id).delete()
        db.query(Wishlist).filter(Wishlist.user_id == user_id).delete()
        db.query(Order).filter(Order.user_id == user_id).delete()
        db.query(Payment).filter(Payment.user_id == user_id).delete()

        # ---------------------------
        # INTERACTIONS & ACTIVITY
        # ---------------------------
        db.query(ReviewVote).filter(ReviewVote.user_id == user_id).delete()
        db.query(Notification).filter(Notification.user_id == user_id).delete()
        db.query(Feedback).filter(Feedback.user_id == user_id).delete()
        db.query(RecentlyViewed).filter(RecentlyViewed.user_id == user_id).delete()
        db.query(SearchHistory).filter(SearchHistory.user_id == user_id).delete()
        db.query(UserSession).filter(UserSession.user_id == user_id).delete()

        # ---------------------------
        # ADMIN / SYSTEM REFERENCES
        # ---------------------------
        db.query(AdminActivityLog).filter(AdminActivityLog.admin_id == user_id).delete()
        db.query(UserIssue).filter(UserIssue.raised_by_id == user_id).delete()

        # ---------------------------
        # DELIVERY PERSON (SAFETY)
        # ---------------------------
        # In case role was changed earlier
        db.query(DeliveryPerson).filter(DeliveryPerson.user_id == user_id).delete()

        # ---------------------------
        # FINALLY DELETE USER
        # ---------------------------
        db.delete(user)
        db.commit()


    @staticmethod
    def get_customer_orders(db: Session, user_id: int):
        return db.query(Order).filter(Order.user_id == user_id).all()

    @staticmethod
    def get_customer_stats(db: Session, user_id: int):
        total_orders = db.query(func.count(Order.order_id)).filter(Order.user_id == user_id).scalar()
        total_spent = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            Order.user_id == user_id
        ).scalar()

        return {
            "total_orders": total_orders or 0,
            "total_spent": float(total_spent or 0),
        }
