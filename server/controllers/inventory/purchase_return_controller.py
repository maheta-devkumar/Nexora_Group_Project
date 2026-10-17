from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.inventory.purchase_return_service import PurchaseReturnService
from schemas.inventory_schema import PurchaseReturnCreate
from typing import List, Dict, Any

class PurchaseReturnController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = PurchaseReturnService(db)
    
    def create_purchase_return(self, return_data: PurchaseReturnCreate) -> Dict[str, Any]:
        """Create a new purchase return"""
        try:
            return self.service.create_purchase_return(return_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_purchase_return(self, return_id: int) -> Dict[str, Any]:
        """Get purchase return by ID"""
        try:
            return self.service.get_purchase_return(return_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_purchase_returns(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all purchase returns"""
        try:
            return self.service.get_all_purchase_returns(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_purchase_return_status(self, return_id: int, status: str) -> Dict[str, str]:
        """Update purchase return status"""
        try:
            return self.service.update_purchase_return_status(return_id, status)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))