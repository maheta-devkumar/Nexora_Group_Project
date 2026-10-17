from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.user_service import UserService
from typing import List, Dict, Any

class UserController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = UserService(db)
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        try:
            return self.service.get_all_users()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_user_by_id(self, user_id: int) -> Dict[str, Any]:
        """Get user by ID"""
        try:
            return self.service.get_user_by_id(user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_user(self, user_id: int, update_data: dict) -> Dict[str, Any]:
        """Update user"""
        try:
            return self.service.update_user(user_id, update_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_user(self, user_id: int) -> Dict[str, str]:
        """Delete user"""
        try:
            return self.service.delete_user(user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))