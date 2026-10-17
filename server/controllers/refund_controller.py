from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.refund_service import RefundService
from typing import Dict, Any

class RefundController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = RefundService(db)
    
    def process_refund(self, return_id: int, admin_id: int) -> Dict[str, Any]:
        """Process refund for a return"""
        try:
            return self.service.process_refund(return_id, admin_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_refund_details(self, refund_id: int, user_id: int) -> Dict[str, Any]:
        """Get refund details"""
        try:
            return self.service.get_refund_details(refund_id, user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_refunds_by_user(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all refunds for a user"""
        try:
            return self.service.get_refunds_by_user(user_id, page, per_page)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_refunds(self, page: int = 1, per_page: int = 20, status: str = None) -> Dict[str, Any]:
        """Get all refunds"""
        try:
            return self.service.get_all_refunds(page, per_page, status)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_refund_status(self, refund_id: int, status: str, admin_id: int) -> Dict[str, Any]:
        """Update refund status"""
        try:
            return self.service.update_refund_status(refund_id, status, admin_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))