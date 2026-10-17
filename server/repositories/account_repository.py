from sqlalchemy.orm import Session
from models.user import User
from typing import Optional

class AccountRepository:
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.user_id == user_id).first()