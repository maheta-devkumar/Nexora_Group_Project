from sqlalchemy.orm import Session
from models.order.order_return import OrderReturn
from models.order.return_product import ReturnProduct
from models.order.order import Order
from models.product_catalog.product_variant import ProductVariant
from models.user import User
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List, Optional
import math

class ReturnRepository:
    
    @staticmethod
    def get_return_by_id(db: Session, return_id: int) -> Optional[OrderReturn]:
        """Get return by ID"""
        return db.query(OrderReturn).filter(OrderReturn.return_id == return_id).first()
    
    @staticmethod
    def get_returns_by_user_id(db: Session, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get return requests for a user"""
        query = db.query(OrderReturn).join(Order).filter(Order.user_id == user_id)
        
        total = query.count()
        offset = (page - 1) * per_page
        returns = query.order_by(OrderReturn.requested_at.desc()).offset(offset).limit(per_page).all()
        
        return {
            "returns": returns,
            "total_returns": total
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
    def update_return_status(db: Session, return_id: int, status: str) -> Optional[OrderReturn]:
        """Update return request status"""
        return_req = db.query(OrderReturn).filter(OrderReturn.return_id == return_id).first()
        
        if return_req:
            return_req.status = status
            db.commit()
            db.refresh(return_req)
        
        return return_req
    
    @staticmethod
    def get_all_returns(db: Session, page: int = 1, per_page: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """Get all return requests"""
        query = db.query(OrderReturn)
        
        if status:
            query = query.filter(OrderReturn.status == status)
        
        total = query.count()
        offset = (page - 1) * per_page
        returns = query.order_by(OrderReturn.requested_at.desc()).offset(offset).limit(per_page).all()
        
        return {
            "returns": returns,
            "total_returns": total
        }