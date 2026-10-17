from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.user_repository import UserRepository
from typing import List, Dict, Any

class UserService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = UserRepository()
    
    def serialize_user(self, user) -> Dict[str, Any]:
        """Convert user to dictionary"""
        return {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        users = self.repository.get_all_users(self.db)
        return [self.serialize_user(user) for user in users]
    
    def get_user_by_id(self, user_id: int) -> Dict[str, Any]:
        """Get user by ID"""
        user = self.repository.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return self.serialize_user(user)
    
    def update_user(self, user_id: int, update_data: dict) -> Dict[str, Any]:
        """Update user"""
        user = self.repository.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Only allow updating specific fields
        allowed_fields = ["first_name", "last_name", "phone", "is_active"]
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        updated_user = self.repository.update_user(self.db, user, filtered_data)
        return self.serialize_user(updated_user)
    
    def delete_user(self, user_id: int) -> Dict[str, str]:
        """Delete user"""
        user = self.repository.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        self.repository.delete_user(self.db, user)
        return {"message": "User deleted successfully"}