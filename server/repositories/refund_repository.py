from sqlalchemy.orm import Session
from models.order.order_refund import OrderRefund
from models.order.order_return import OrderReturn
from models.order.order import Order
from models.user import User
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List, Optional
import math

class RefundRepository:
    
    @staticmethod
    def get_refund_by_id(db: Session, refund_id: int) -> Optional[OrderRefund]:
        """Get refund by ID"""
        return db.query(OrderRefund).filter(OrderRefund.refund_id == refund_id).first()
    
    @staticmethod
    def get_refunds_by_user_id(db: Session, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all refunds for a user"""
        # Get refunds through order returns that belong to the user
        query = db.query(OrderRefund).join(OrderReturn).join(Order).filter(Order.user_id == user_id)
        
        total = query.count()
        offset = (page - 1) * per_page
        refunds = query.order_by(OrderRefund.created_at.desc()).offset(offset).limit(per_page).all()
        
        return {
            "refunds": refunds,
            "total_refunds": total
        }
    
    @staticmethod
    def create_refund(db: Session, refund_data: Dict[str, Any]) -> OrderRefund:
        """Create a new refund"""
        refund = OrderRefund(**refund_data)
        db.add(refund)
        db.commit()
        db.refresh(refund)
        return refund
    
    @staticmethod
    def update_refund_status(db: Session, refund_id: int, status: str, admin_id: int) -> Optional[OrderRefund]:
        """Update refund status"""
        refund = db.query(OrderRefund).filter(OrderRefund.refund_id == refund_id).first()
        
        if refund:
            refund.status = status
            refund.processed_by = admin_id
            refund.processed_at = datetime.now()
            db.commit()
            db.refresh(refund)
        
        return refund
    
    @staticmethod
    def get_all_refunds(db: Session, page: int = 1, per_page: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """Get all refunds"""
        query = db.query(OrderRefund)
        
        if status:
            query = query.filter(OrderRefund.status == status)
        
        total = query.count()
        offset = (page - 1) * per_page
        refunds = query.order_by(OrderRefund.created_at.desc()).offset(offset).limit(per_page).all()
        
        return {
            "refunds": refunds,
            "total_refunds": total
        }
    
    @staticmethod
    def get_refund_by_return_id(db: Session, return_id: int) -> Optional[OrderRefund]:
        """Get refund by return ID"""
        return db.query(OrderRefund).filter(OrderRefund.return_id == return_id).first()