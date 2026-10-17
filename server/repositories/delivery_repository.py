from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery_earnings import DeliveryEarnings
from models.order.order import Order
from models.user import User
from models.address import Address
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List, Optional
import math

class DeliveryRepository:
    
    @staticmethod
    def get_delivery_by_id(db: Session, delivery_id: int) -> Optional[Delivery]:
        """Get delivery by ID"""
        return db.query(Delivery).filter(Delivery.delivery_id == delivery_id).first()
    
    @staticmethod
    def get_delivery_by_order_id(db: Session, order_id: int) -> Optional[Delivery]:
        """Get delivery by order ID"""
        return db.query(Delivery).filter(Delivery.order_id == order_id).first()
    
    @staticmethod
    def get_deliveries_by_delivery_person(db: Session, delivery_person_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all deliveries for a delivery person"""
        query = db.query(Delivery).filter(Delivery.delivery_person_id == delivery_person_id)
        
        total = query.count()
        
        if total == 0:
            return {
                "deliveries": [],
                "total_deliveries": 0
            }
        
        offset = (page - 1) * per_page
        deliveries = query.order_by(Delivery.assigned_at.desc()).offset(offset).limit(per_page).all()
        
        return {
            "deliveries": deliveries,
            "total_deliveries": total
        }
    
    @staticmethod
    def create_delivery(db: Session, delivery_data: Dict[str, Any]) -> Delivery:
        """Create a new delivery"""
        delivery = Delivery(**delivery_data)
        db.add(delivery)
        db.commit()
        db.refresh(delivery)
        return delivery
    
    @staticmethod
    def update_delivery_status(db: Session, delivery_id: int, status: str) -> Optional[Delivery]:
        """Update delivery status"""
        delivery = db.query(Delivery).filter(Delivery.delivery_id == delivery_id).first()
        
        if delivery:
            delivery.status = status
            if status == "DELIVERED":
                delivery.delivered_at = datetime.now()
            db.commit()
            db.refresh(delivery)
        
        return delivery
    
    @staticmethod
    def get_all_deliveries(db: Session, page: int = 1, per_page: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """Get all deliveries"""
        query = db.query(Delivery)
        
        if status:
            query = query.filter(Delivery.status == status)
        
        total = query.count()
        
        if total == 0:
            return {
                "deliveries": [],
                "total_deliveries": 0
            }
        
        offset = (page - 1) * per_page
        deliveries = query.order_by(Delivery.assigned_at.desc()).offset(offset).limit(per_page).all()
        
        return {
            "deliveries": deliveries,
            "total_deliveries": total
        }

    @staticmethod
    def get_available_deliveries(db: Session, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all available deliveries (no delivery person assigned)"""
        # status="AVAILABLE", is_available=True, delivery_person_id=None
        query = db.query(Delivery).filter(
            Delivery.status == "AVAILABLE",
            Delivery.is_available == True,
            Delivery.delivery_person_id == None
        )
        
        total = query.count()
        
        if total == 0:
            return {
                "deliveries": [],
                "total_deliveries": 0
            }
        
        offset = (page - 1) * per_page
        # Order by oldest first so older orders get picked up
        deliveries = query.order_by(Delivery.available_since.asc()).offset(offset).limit(per_page).all()
        
        return {
            "deliveries": deliveries,
            "total_deliveries": total
        }
    
    @staticmethod
    def get_delivery_person_earnings(db: Session, delivery_person_id: int) -> Dict[str, Any]:
        """Get earnings summary for delivery person"""
        total_earnings = db.query(DeliveryEarnings).filter(
            DeliveryEarnings.delivery_person_id == delivery_person_id
        ).with_entities(func.sum(DeliveryEarnings.amount)).scalar() or Decimal('0')
        
        completed_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED"
        ).count()
        
        pending_earnings = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status.in_(["ASSIGNED", "PICKED", "OUT_FOR_DELIVERY"])
        ).count() * Decimal('50.00')
        
        current_month_earnings = db.query(DeliveryEarnings).filter(
            DeliveryEarnings.delivery_person_id == delivery_person_id,
            extract('month', DeliveryEarnings.earned_at) == datetime.now().month,
            extract('year', DeliveryEarnings.earned_at) == datetime.now().year
        ).with_entities(func.sum(DeliveryEarnings.amount)).scalar() or Decimal('0')
        
        return {
            "total_earnings": float(total_earnings),
            "completed_deliveries": completed_deliveries,
            "pending_earnings": float(pending_earnings),
            "current_month_earnings": float(current_month_earnings)
        }
    
    @staticmethod
    def create_delivery_earnings(db: Session, earnings_data: Dict[str, Any]) -> DeliveryEarnings:
        """Create delivery earnings record"""
        earnings = DeliveryEarnings(**earnings_data)
        db.add(earnings)
        db.commit()
        db.refresh(earnings)
        return earnings