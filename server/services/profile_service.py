from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.profile_repository import ProfileRepository
from schemas.profile_schema import ProfileUpdate, PasswordChange, ProfileResponse, UserStats
from utils.hashing import verify_password, hash_password
from typing import Dict, Any
import os
import shutil
import uuid
from fastapi import UploadFile

class ProfileService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = ProfileRepository()

    def get_user_profile(self, user_id: int) -> ProfileResponse:
        """Get user profile"""
        user = self.repository.get_user_by_id(self.db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return ProfileResponse.model_validate(user)

    def update_user_profile(self, user_id: int, profile_data: ProfileUpdate) -> ProfileResponse:
        """Update user profile"""
        user = self.repository.get_user_by_id(self.db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get only the fields that were actually provided
        update_data = profile_data.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data provided for update"
            )
        
        # Update user
        updated_user = self.repository.update_user(self.db, user, update_data)
        
        return ProfileResponse.model_validate(updated_user)

    def upload_profile_image(self, user_id: int, file: UploadFile) -> ProfileResponse:
        """Upload profile image"""
        user = self.repository.get_user_by_id(self.db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Create upload directory
        upload_dir = "uploads/profiles"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )
            
        # Update user profile image URL
        # We store the relative path that will be served by StaticFiles
        # The frontend should prepend the base URL if needed, or we return absolute URL
        # For simplicity, returning relative path assuming /uploads is mounted
        relative_path = f"/uploads/profiles/{filename}"
        
        # Update user in DB
        updated_user = self.repository.update_user(self.db, user, {"profile_img_url": relative_path})
        
        return ProfileResponse.model_validate(updated_user)

    def change_password(self, user_id: int, password_data: PasswordChange) -> Dict[str, str]:
        """Change user password"""
        user = self.repository.get_user_by_id(self.db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not verify_password(password_data.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Check if new passwords match
        if password_data.new_password != password_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New passwords do not match"
            )
        
        # Check if new password is different from current
        if verify_password(password_data.new_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )
        
        # Hash and update password
        user.password_hash = hash_password(password_data.new_password)
        self.repository.update_user(self.db, user, {})
        
        return {"message": "Password changed successfully"}

    def get_user_stats(self, user_id: int) -> UserStats:
        """Get user statistics"""
        user = self.repository.get_user_by_id(self.db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get order statistics
        order_stats = self.repository.get_user_order_stats(self.db, user_id)
        
        # Get additional statistics
        additional_stats = self.repository.get_user_additional_stats(self.db, user_id)
        
        # Combine all stats
        all_stats = {
            "total_orders": order_stats.get("total_orders", 0),
            "active_orders": order_stats.get("active_orders", 0),
            "completed_orders": order_stats.get("completed_orders", 0),
            "cancelled_orders": order_stats.get("cancelled_orders", 0),
            "total_spent": order_stats.get("total_spent", 0.0),
            "saved_addresses": additional_stats.get("saved_addresses", 0),
            "wishlist_items": additional_stats.get("wishlist_items", 0),
            "cart_items": additional_stats.get("cart_items", 0),
            "reviews": additional_stats.get("reviews", 0),
        }

        return UserStats(**all_stats)
