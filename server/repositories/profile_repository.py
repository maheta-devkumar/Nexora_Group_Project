from sqlalchemy.orm import Session
from sqlalchemy import func
from models.user import User
from models.order.order import Order
from models.address import Address
from models.wishlist import Wishlist
from models.cart import Cart
from models.product_catalog.product_review import ProductReview
from typing import Optional, Dict, Any

class ProfileRepository:

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.user_id == user_id).first()

    @staticmethod
    def update_user(db: Session, user: User, update_data: Dict[str, Any]) -> User:
        """Update user with provided data"""
        for key, value in update_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_user_order_stats(db: Session, user_id: int) -> Dict[str, Any]:
        """Get user's order statistics"""
        total_orders = db.query(func.count(Order.order_id)).filter(
            Order.user_id == user_id
        ).scalar() or 0
    
        active_orders = db.query(func.count(Order.order_id)).filter(
            Order.user_id == user_id,
            Order.order_status.in_(['pending', 'processing', 'shipped', 'out_for_delivery'])
        ).scalar() or 0
        
        completed_orders = db.query(func.count(Order.order_id)).filter(
            Order.user_id == user_id,
            Order.order_status == 'delivered'
        ).scalar() or 0
        
        cancelled_orders = db.query(func.count(Order.order_id)).filter(
            Order.user_id == user_id,
            Order.order_status == 'cancelled'
        ).scalar() or 0
        
        total_spent = db.query(func.sum(Order.total_amount)).filter(
            Order.user_id == user_id,
            Order.order_status == 'delivered'
        ).scalar() or 0.0
        
        return {
            "total_orders": total_orders,
            "active_orders": active_orders,
            "completed_orders": completed_orders,
            "cancelled_orders": cancelled_orders,
            "total_spent": float(total_spent)
        }
    
    @staticmethod
    def get_user_additional_stats(db: Session, user_id: int) -> Dict[str, int]:
        """Get additional user statistics"""
        saved_addresses = db.query(func.count(Address.address_id)).filter(
            Address.user_id == user_id
        ).scalar() or 0
        
        wishlist_items = db.query(func.count(Wishlist.variant_id)).filter(
            Wishlist.user_id == user_id
        ).scalar() or 0
        
        cart_items = db.query(func.count(Cart.variant_id)).filter(
            Cart.user_id == user_id
        ).scalar() or 0
        
        reviews = db.query(func.count(ProductReview.review_id)).filter(
            ProductReview.user_id == user_id
        ).scalar() or 0
        
        return {
            "saved_addresses": saved_addresses,
            "wishlist_items": wishlist_items,
            "cart_items": cart_items,
            "reviews": reviews
        }