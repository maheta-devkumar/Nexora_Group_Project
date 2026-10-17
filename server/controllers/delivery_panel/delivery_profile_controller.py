# delivery_panel/profile/delivery_profile_controller.py
from fastapi import HTTPException, status, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
from datetime import datetime
from config.dependencies import get_db, get_current_user, is_delivery_person
from services.delivery_panel.delivery_profile_service import DeliveryProfileService
from schemas.delivery_panel.delivery_profile_schema import (
    ProfileOverview, PersonalInfo, PersonalInfoUpdate,
    AccountSettingsResponse, VerificationStatus, ProfileStats,
    ProfileResponse, ProfileUpdateResponse, AddressUpdateRequest,
    ChangePasswordRequest, ProfileHealthResponse, FileUploadResponse
)
from models.user import User
from models.delivery.delivery_person import DeliveryPerson

class DeliveryProfileController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryProfileService(db)
    
    def _get_delivery_person_id(self, current_user: User) -> int:
        """Get delivery person ID from user"""
        delivery_person = self.db.query(DeliveryPerson).filter(
            DeliveryPerson.user_id == current_user.user_id
        ).first()
        
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a delivery person"
            )
        
        return delivery_person.delivery_person_id
    
    def get_profile_overview(self, current_user: User) -> ProfileOverview:
        """Get profile overview"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_profile_overview(delivery_person_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get profile overview: {str(e)}"
            )
    
    def get_personal_info(self, current_user: User) -> PersonalInfo:
        """Get personal information"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_personal_info(delivery_person_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get personal information: {str(e)}"
            )
    
    def update_personal_info(
        self,
        current_user: User,
        update_data: PersonalInfoUpdate
    ) -> ProfileUpdateResponse:
        """Update personal information"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.update_personal_info(delivery_person_id, update_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update personal information: {str(e)}"
            )
    
    def get_verification_status(self, current_user: User) -> VerificationStatus:
        """Get verification documents status"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_verification_status(delivery_person_id)
        except Exception as e:
            # Return empty verification status on error
            return VerificationStatus(
                overall_status="PENDING",
                verified_documents=0,
                total_documents=0,
                pending_documents=0,
                documents=[]
            )
    
    def get_profile_statistics(self, current_user: User) -> ProfileStats:
        """Get profile statistics"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_profile_statistics(delivery_person_id)
        except Exception as e:
            # Return empty stats on error
            return ProfileStats(
                total_deliveries=0,
                completed_deliveries=0,
                total_earnings=0.00,
                average_rating=None,
                on_time_rate=None,
                joined_since_days=0,
                performance_trend=None
            )
    
    def get_account_settings(self, current_user: User) -> AccountSettingsResponse:
        """Get account settings"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_account_settings(delivery_person_id)
        except Exception as e:
            # Return empty settings on error
            return AccountSettingsResponse(
                notifications=[],
                privacy=[],
                preferences=[],
                total_settings=0
            )
    
    def update_address(
        self,
        current_user: User,
        address_data: AddressUpdateRequest
    ) -> ProfileUpdateResponse:
        """Update delivery person's address
        
        Only updates address table fields:
        - address_type (Home/Work/Other)
        - line1 (required)
        - line2 (optional)
        - area_id (required - from dropdown selection)
        - is_default (boolean)
        """
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.update_address(delivery_person_id, address_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update address: {str(e)}"
            )
    
    def change_password(
        self,
        current_user: User,
        password_data: ChangePasswordRequest
    ) -> ProfileUpdateResponse:
        """Change delivery person's password"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.change_password(delivery_person_id, password_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to change password: {str(e)}"
            )
    
    def upload_profile_image(
        self,
        current_user: User,
        file: UploadFile = File(...)
    ) -> FileUploadResponse:
        """Upload profile image"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only image files are allowed (JPEG, PNG, GIF)"
                )
            
            # Validate file size (max 5MB)
            file_size = 0
            file.file.seek(0, 2)  # Seek to end
            file_size = file.file.tell()
            file.file.seek(0)  # Reset to beginning
            
            if file_size > 5 * 1024 * 1024:  # 5MB
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File size too large. Maximum size is 5MB"
                )
            
            # Create uploads directory if not exists
            upload_dir = "uploads/profile_images"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"profile_{delivery_person_id}_{int(datetime.now().timestamp())}{file_extension}"
            file_path = os.path.join(upload_dir, unique_filename)
            
            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Generate URL (relative for now)
            file_url = f"/{upload_dir}/{unique_filename}"
            
            # Update user's profile image URL in database
            delivery_person = self.db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first()
            
            if delivery_person:
                user = self.db.query(User).filter(
                    User.user_id == delivery_person.user_id
                ).first()
                
                if user:
                    user.profile_img_url = file_url
                    self.db.commit()
            
            return FileUploadResponse(
                success=True,
                message="Profile image uploaded successfully",
                file_url=file_url,
                file_name=unique_filename,
                file_size=file_size,
                content_type=file.content_type
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload profile image: {str(e)}"
            )
    
    def get_comprehensive_profile(self, current_user: User) -> ProfileResponse:
        """Get comprehensive profile information (all in one)"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Get all profile data
            profile_overview = self.service.get_profile_overview(delivery_person_id)
            personal_info = self.service.get_personal_info(delivery_person_id)
            account_settings = self.service.get_account_settings(delivery_person_id)
            verification_status = self.service.get_verification_status(delivery_person_id)
            statistics = self.service.get_profile_statistics(delivery_person_id)
            
            return ProfileResponse(
                success=True,
                message="Profile information retrieved successfully",
                profile_overview=profile_overview,
                personal_info=personal_info,
                account_settings=account_settings,
                verification_status=verification_status,
                statistics=statistics
            )
            
        except ValueError as e:
            # Return empty profile if not found
            return ProfileResponse(
                success=True,
                message="Profile information not found",
                profile_overview=None,
                personal_info=None,
                account_settings=None,
                verification_status=None,
                statistics=None
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get comprehensive profile: {str(e)}"
            )
    
    def health_check(self, current_user: User) -> ProfileHealthResponse:
        """Health check for profile module"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Test database connections
            delivery_person_exists = bool(self.db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first())
            
            user_exists = bool(self.db.query(User).filter(
                User.user_id == current_user.user_id
            ).first())
            
            dependencies = {
                "database": True,
                "delivery_person_record": delivery_person_exists,
                "user_record": user_exists,
                "service_layer": True
            }
            
            return ProfileHealthResponse(
                success=True,
                message="Profile module is working correctly",
                timestamp=datetime.now(),
                dependencies=dependencies
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Profile module health check failed: {str(e)}"
            )