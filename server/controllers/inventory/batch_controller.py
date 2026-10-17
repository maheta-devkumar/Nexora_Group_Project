from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.inventory.batch_service import BatchService
from schemas.inventory_schema import ProductBatchCreate
from typing import List, Dict, Any

class BatchController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = BatchService(db)
    
    def create_batch(self, batch_data: ProductBatchCreate) -> Dict[str, Any]:
        """Create a new product batch"""
        try:
            return self.service.create_batch(batch_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_batch(self, batch_id: int) -> Dict[str, Any]:
        """Get batch by ID"""
        try:
            return self.service.get_batch(batch_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_batches(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all batches"""
        try:
            return self.service.get_all_batches(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_batch(self, batch_id: int, batch_data) -> Dict[str, Any]:
        """Update batch information"""
        try:
            return self.service.update_batch(batch_id, batch_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))