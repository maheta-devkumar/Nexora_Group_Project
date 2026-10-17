from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.account_service import AccountService
from models.user import User
from typing import Dict, Any

class AccountController:
    
    def __init__(self, db: Session = Depends(get_db), current_user: User = None):
        self.db = db
        self.current_user = current_user
        self.service = AccountService(db)
    
    def get_account_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Get account dashboard"""
        try:
            # Verify the user is accessing their own data
            if self.current_user and self.current_user.user_id != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to access this resource"
                )
            
            return self.service.get_account_dashboard(user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))