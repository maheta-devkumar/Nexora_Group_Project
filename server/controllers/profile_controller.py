from sqlalchemy.orm import Session
from services.profile_service import ProfileService
from schemas.profile_schema import (
    ProfileUpdate, 
    PasswordChange, 
    ProfileResponse, 
    UserStats
)
from typing import Dict
from fastapi import UploadFile

class ProfileController:
    
    def __init__(self, db: Session):
        self.db = db
        self.profile_service = ProfileService(db)

    def get_user_profile(self, user_id: int) -> ProfileResponse:
        """Get user profile"""
        return self.profile_service.get_user_profile(user_id)

    def update_user_profile(self, user_id: int, profile_data: ProfileUpdate) -> ProfileResponse:
        """Update user profile"""
        return self.profile_service.update_user_profile(user_id, profile_data)

    def upload_profile_image(self, user_id: int, file: UploadFile) -> ProfileResponse:
        """Upload profile image"""
        return self.profile_service.upload_profile_image(user_id, file)

    def change_password(self, user_id: int, password_data: PasswordChange) -> Dict[str, str]:
        """Change user password"""
        return self.profile_service.change_password(user_id, password_data)

    def get_user_stats(self, user_id: int) -> UserStats:
        """Get user statistics"""
        return self.profile_service.get_user_stats(user_id)