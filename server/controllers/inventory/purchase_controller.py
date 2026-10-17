from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.inventory.purchase_service import PurchaseService
from schemas.inventory_schema import PurchaseCreate
from typing import List, Dict, Any

class PurchaseController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = PurchaseService(db)
    
    def create_purchase(self, purchase_data: PurchaseCreate) -> Dict[str, Any]:
        """Create a new purchase"""
        try:
            return self.service.create_purchase(purchase_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_purchase(self, purchase_id: int) -> Dict[str, Any]:
        """Get purchase by ID"""
        try:
            return self.service.get_purchase(purchase_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_purchases(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all purchases"""
        try:
            return self.service.get_all_purchases(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_purchase_status(self, purchase_id: int, status: str) -> Dict[str, str]:
        """Update purchase status"""
        try:
            return self.service.update_purchase_status(purchase_id, status)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))