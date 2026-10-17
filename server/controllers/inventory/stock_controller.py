from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.inventory.stock_service import StockService
from typing import List, Dict, Any

class StockController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = StockService(db)
    
    def get_stock_movements(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all stock movements"""
        try:
            return self.service.get_stock_movements(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_stock_summary(self) -> List[Dict[str, Any]]:
        """Get current stock summary"""
        try:
            return self.service.get_stock_summary()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def adjust_stock(self, adjustment_data: dict, user_id: int) -> Dict[str, Any]:
        """Manually adjust stock"""
        try:
            return self.service.adjust_stock(adjustment_data, user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_variant_movements(self, variant_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get stock movements for a specific variant"""
        try:
            return self.service.get_variant_movements(variant_id, skip, limit)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))