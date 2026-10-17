from sqlalchemy.orm import Session
from models.order.order import Order
from models.order.order_item import OrderItem
from models.order.order_history import OrderHistory
from models.order.order_return import OrderReturn
from models.order.return_product import ReturnProduct
from models.user import User
from models.address import Address
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product import Product
from schemas.order_schema import OrderCreate
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List, Optional
import math

class OrderRepository:
    
    @staticmethod
    def get_order_by_id(db: Session, order_id: int) -> Optional[Order]:
        """Get order by ID"""
        return db.query(Order).filter(Order.order_id == order_id).first()
    
    @staticmethod
    def create_order(db: Session, order_data: OrderCreate, user_id: int) -> Order:
        """Create a new order - Updated to handle OrderCreate schema"""
        try:
            # Convert OrderCreate schema to dictionary for Order model
            order_dict = {
                'user_id': user_id,
                'address_id': order_data.address_id,
                'subtotal': order_data.subtotal,
                'discount_amount': order_data.discount_amount,
                'delivery_fee': order_data.delivery_fee,
                'tax_amount': order_data.tax_amount,
                'total_amount': order_data.total_amount,
                'coupon_code': order_data.coupon_code,
                'order_status': 'PLACED',
                'payment_status': 'PENDING'
            }
            
            order = Order(**order_dict)
            db.add(order)
            db.flush()
            return order
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def create_order_item(db: Session, order_item: OrderItem) -> OrderItem:
        """Create order item - expects OrderItem model instance"""
        db.add(order_item)
        db.flush()
        return order_item

    @staticmethod  
    def create_order_history(db: Session, order_history: OrderHistory) -> OrderHistory:
        """Create order history - expects OrderHistory model instance"""
        db.add(order_history)
        db.flush()
        return order_history
    
    @staticmethod
    def update_order_status(db: Session, order_id: int, status: str) -> Optional[Order]:
        """Update order status"""
        order = db.query(Order).filter(Order.order_id == order_id).first()
        
        if order:
            order.order_status = status
            db.commit()
            db.refresh(order)
        
        return order
    
    @staticmethod
    def get_all_orders(db: Session, page: int = 1, per_page: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """Get all orders"""
        query = db.query(Order)
        
        if status:
            query = query.filter(Order.order_status == status)
        
        total = query.count()
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        
        if total == 0:
            return {
                "orders": [],
                "total_orders": 0,
                "total_pages": total_pages
            }
        
        offset = (page - 1) * per_page
        orders = query.order_by(Order.placed_at.desc()).offset(offset).limit(per_page).all()
        
        return {
            "orders": orders,
            "total_orders": total,
            "total_pages": total_pages
        }
    
    @staticmethod
    def create_return_request(db: Session, return_data: Dict[str, Any]) -> OrderReturn:
        """Create a return request"""
        return_request = OrderReturn(**return_data)
        db.add(return_request)
        db.commit()
        db.refresh(return_request)
        return return_request
    
    @staticmethod
    def create_return_product(db: Session, return_product_data: Dict[str, Any]) -> ReturnProduct:
        """Create a return product record"""
        return_product = ReturnProduct(**return_product_data)
        db.add(return_product)
        return return_product

    @staticmethod
    def get_orders_by_user_id(db: Session, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get orders for a specific user"""
        import math
        
        query = db.query(Order).filter(Order.user_id == user_id)
        
        total = query.count()
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        
        if total == 0:
            return {
                "orders": [],
                "total_orders": 0,
                "total_pages": total_pages
            }
        
        offset = (page - 1) * per_page
        orders = query.order_by(Order.placed_at.desc()).offset(offset).limit(per_page).all()
        
        return {
            "orders": orders,
            "total_orders": total,
            "total_pages": total_pages
        }