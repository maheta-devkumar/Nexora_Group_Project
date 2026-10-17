from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.delivery_person_service import DeliveryPersonService
from schemas.delivery_schema import DeliveryPersonCreate
from typing import Dict, Any

class DeliveryPersonController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryPersonService(db)
    
    def register_delivery_person(self, delivery_data: DeliveryPersonCreate) -> Dict[str, Any]:
        """Register a delivery person"""
        try:
            return self.service.register_delivery_person(delivery_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_delivery_persons(self, page: int = 1, per_page: int = 20, status: str = None) -> Dict[str, Any]:
        """Get all delivery persons"""
        try:
            return self.service.get_all_delivery_persons(page, per_page, status)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_delivery_person_by_id(self, delivery_person_id: int) -> Dict[str, Any]:
        """Get delivery person by ID"""
        try:
            return self.service.get_delivery_person_by_id(delivery_person_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_delivery_person_status(self, delivery_person_id: int, status: str) -> Dict[str, Any]:
        """Update delivery person status"""
        try:
            return self.service.update_delivery_person_status(delivery_person_id, status)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_delivery_person_rating(self, delivery_person_id: int, rating: float) -> Dict[str, Any]:
        """Update delivery person rating"""
        try:
            return self.service.update_delivery_person_rating(delivery_person_id, rating)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_my_delivery_profile(self, user_id: int) -> Dict[str, Any]:
        """Get current user's delivery profile"""
        try:
            return self.service.get_my_delivery_profile(user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))