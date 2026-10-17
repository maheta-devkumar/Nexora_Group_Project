from sqlalchemy.orm import Session
from sqlalchemy import func
from models.delivery.delivery_person import DeliveryPerson
from models.user import User
from models.delivery.delivery import Delivery
from models.delivery.delivery_earnings import DeliveryEarnings
from typing import Optional, List, Dict, Any
import math

class DeliveryPersonRepository:
    
    @staticmethod
    def get_delivery_person_by_id(db: Session, delivery_person_id: int) -> Optional[DeliveryPerson]:
        """Get delivery person by ID"""
        return db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
    
    @staticmethod
    def get_delivery_person_by_user_id(db: Session, user_id: int) -> Optional[DeliveryPerson]:
        """Get delivery person by user ID"""
        return db.query(DeliveryPerson).filter(
            DeliveryPerson.user_id == user_id
        ).first()
    
    @staticmethod
    def create_delivery_person(db: Session, delivery_data: Dict[str, Any]) -> DeliveryPerson:
        """Create a new delivery person"""
        new_delivery_person = DeliveryPerson(**delivery_data)
        db.add(new_delivery_person)
        db.commit()
        db.refresh(new_delivery_person)
        return new_delivery_person
    
    @staticmethod
    def get_all_delivery_persons(db: Session, page: int = 1, per_page: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """Get all delivery persons with filtering and pagination"""
        query = db.query(DeliveryPerson)
        
        if status:
            query = query.filter(DeliveryPerson.status == status)
        
        total = query.count()
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        
        if total == 0:
            return {
                "delivery_persons": [],
                "total_delivery_persons": 0,
                "total_pages": total_pages
            }
        
        offset = (page - 1) * per_page
        delivery_persons = query.offset(offset).limit(per_page).all()
        
        return {
            "delivery_persons": delivery_persons,
            "total_delivery_persons": total,
            "total_pages": total_pages
        }
    
    @staticmethod
    def update_delivery_person_status(db: Session, delivery_person_id: int, status: str) -> Optional[DeliveryPerson]:
        """Update delivery person status"""
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if delivery_person:
            delivery_person.status = status
            db.commit()
            db.refresh(delivery_person)
        
        return delivery_person
    
    @staticmethod
    def update_delivery_person_rating(db: Session, delivery_person_id: int, rating: float) -> Optional[DeliveryPerson]:
        """Update delivery person rating"""
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if delivery_person:
            delivery_person.rating = rating
            db.commit()
            db.refresh(delivery_person)
        
        return delivery_person
    
    @staticmethod
    def get_delivery_stats(db: Session, delivery_person_id: int) -> Dict[str, Any]:
        """Get delivery statistics for a delivery person"""
        total_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED"
        ).count()
        
        total_earnings = db.query(DeliveryEarnings).filter(
            DeliveryEarnings.delivery_person_id == delivery_person_id
        ).with_entities(func.sum(DeliveryEarnings.amount)).scalar() or 0
        
        return {
            "total_deliveries": total_deliveries,
            "total_earnings": float(total_earnings)
        }