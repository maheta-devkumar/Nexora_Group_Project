from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.delivery_service import DeliveryService
from typing import Dict, Any, Optional

class DeliveryController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryService(db)
    
    def assign_delivery_person(self, order_id: int, delivery_person_id: int) -> Dict[str, Any]:
        """Assign delivery person to order"""
        try:
            return self.service.assign_delivery_person(order_id, delivery_person_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_delivery_person_orders(self, delivery_person_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all orders assigned to a delivery person"""
        try:
            return self.service.get_delivery_person_orders(delivery_person_id, page, per_page)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_delivery_status(self, delivery_id: int, status: str, delivery_person_id: int) -> Dict[str, Any]:
        """Update delivery status"""
        try:
            return self.service.update_delivery_status(delivery_id, status, delivery_person_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_delivery_person_earnings(self, delivery_person_id: int) -> Dict[str, Any]:
        """Get earnings summary for delivery person"""
        try:
            return self.service.get_delivery_person_earnings(delivery_person_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_deliveries(self, page: int = 1, per_page: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """Get all deliveries"""
        try:
            return self.service.get_all_deliveries(page, per_page, status)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_delivery_by_order_id(self, order_id: int) -> Dict[str, Any]:
        """Get delivery by order ID"""
        try:
            return self.service.get_delivery_by_order_id(order_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    # Keep the original serialize_delivery function for compatibility
    def serialize_delivery(self, delivery: Any, db: Session) -> Dict[str, Any]:
        """Serialize delivery with related data - kept for compatibility"""
        from services.delivery_service import DeliveryService
        service = DeliveryService(db)
        return service._serialize_delivery(delivery)