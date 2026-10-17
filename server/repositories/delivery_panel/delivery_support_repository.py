from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

# Import models
from models.feedback.user_issue import UserIssue
from models.order.order import Order
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson


class DeliverySupportRepository:
    
    @staticmethod
    def validate_order_exists(db: Session, order_id: int) -> bool:
        """
        Validate if order exists (only if order_id is provided)
        """
        order = db.query(Order).filter(
            Order.order_id == order_id
        ).first()
        
        return order is not None
    
    @staticmethod
    def validate_delivery_association(
        db: Session, 
        delivery_person_id: int, 
        order_id: int
    ) -> bool:
        """
        Validate if the order is assigned to the delivery person (optional validation)
        """
        delivery = db.query(Delivery).filter(
            Delivery.order_id == order_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        return delivery is not None
    
    @staticmethod
    def create_issue_record(
        db: Session,
        delivery_person_id: int,
        issue_type: str,
        description: str,
        order_id: Optional[int] = None,
        priority: str = "MEDIUM"
    ) -> bool:
        """
        Create a new issue record in the database
        """
        try:
            # Get the user_id from delivery_person_id
            delivery_person = db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery_person:
                return False
            
            user_id = delivery_person.user_id
            
            # Create the issue
            issue = UserIssue(
                raised_by_id=user_id,
                raised_by_role="delivery",
                order_id=order_id,
                delivery_id=None,  # Will be filled if we can find the delivery
                issue_type=issue_type,
                title=f"Issue Report: {issue_type}",
                description=description,
                priority=priority,
                status="OPEN",
                created_at=datetime.now()
            )
            
            # If order_id is provided, try to find associated delivery
            if order_id:
                delivery = db.query(Delivery).filter(
                    Delivery.order_id == order_id,
                    Delivery.delivery_person_id == delivery_person_id
                ).first()
                
                if delivery:
                    issue.delivery_id = delivery.delivery_id
            
            db.add(issue)
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            # Log the error if you have logging configured
            # logger.error(f"Failed to create issue record: {e}")
            return False
    
    @staticmethod
    def get_delivery_person_info(db: Session, delivery_person_id: int) -> Optional[dict]:
        """
        Get delivery person info for logging/validation
        """
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person:
            return None
        
        return {
            "delivery_person_id": delivery_person.delivery_person_id,
            "user_id": delivery_person.user_id,
            "status": delivery_person.status,
            "is_online": delivery_person.is_online
        }