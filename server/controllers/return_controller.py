from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.return_service import ReturnService
from typing import Dict, Any

class ReturnController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = ReturnService(db)
    
    def create_return_request(self, order_id: int, user_id: int, return_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a return request for an order"""
        try:
            return self.service.create_return_request(order_id, user_id, return_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_user_returns(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get return requests for a user"""
        try:
            return self.service.get_user_returns(user_id, page, per_page)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_return_details(self, return_id: int, user_id: int) -> Dict[str, Any]:
        """Get detailed return request with items"""
        try:
            return self.service.get_return_details(return_id, user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_return_status(self, return_id: int, status: str) -> Dict[str, Any]:
        """Update return request status"""
        try:
            return self.service.update_return_status(return_id, status)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_returns_admin(self, page: int = 1, per_page: int = 20, status: str = None) -> Dict[str, Any]:
        """Get all return requests"""
        try:
            return self.service.get_all_returns_admin(page, per_page, status)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))