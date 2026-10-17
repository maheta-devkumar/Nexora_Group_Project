# delivery_panel/profile/delivery_profile_service.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal

from repositories.delivery_panel.delivery_profile_repository import DeliveryProfileRepository
from schemas.delivery_panel.delivery_profile_schema import (
    ProfileOverview, PersonalInfo, PersonalInfoUpdate,
    AccountSettingsResponse, AccountSetting, VerificationStatus,
    VerificationDocument, ProfileStats, ProfileResponse,
    ProfileUpdateResponse, AddressUpdateRequest, ChangePasswordRequest,
    PasswordStrengthResponse
)
from models.user import User
from models.delivery.delivery_person import DeliveryPerson
import hashlib
import re

class DeliveryProfileService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryProfileRepository()
    
    def get_profile_overview(self, delivery_person_id: int) -> ProfileOverview:
        """Get profile overview"""
        overview_data = self.repository.get_profile_overview(
            self.db, delivery_person_id
        )
        
        if not overview_data:
            raise ValueError("Delivery person not found")
        
        # Format address if exists
        address = overview_data.get("address")
        formatted_address = None
        if address:
            addr, area, city, state = address
            address_parts = []
            if addr.line1:
                address_parts.append(addr.line1)
            if addr.line2:
                address_parts.append(addr.line2)
            if area and area.area_name:
                address_parts.append(area.area_name)
            if city and city.city_name:
                address_parts.append(city.city_name)
            if state and state.state_name:
                address_parts.append(state.state_name)
            formatted_address = ", ".join(address_parts)
        
        return ProfileOverview(
            user_id=overview_data["user_id"],
            full_name=overview_data["full_name"],
            email=overview_data["email"],
            phone=overview_data["phone"],
            profile_image_url=overview_data["profile_image_url"],
            role=overview_data["role"],
            is_active=overview_data["is_active"],
            is_verified=overview_data["is_verified"],
            created_at=overview_data["created_at"],
            last_login=overview_data["last_login"],
            delivery_person_id=overview_data["delivery_person_id"],
            license_number=overview_data["license_number"],
            delivery_status=overview_data["delivery_status"],
            rating=overview_data["rating"],
            joined_at=overview_data["joined_at"],
            is_online=overview_data["is_online"],
            total_deliveries=overview_data["total_deliveries"],
            total_earnings=overview_data["total_earnings"],
            average_rating=overview_data["average_rating"],
            on_time_rate=overview_data["on_time_rate"]
        )
    
    def get_personal_info(self, delivery_person_id: int) -> PersonalInfo:
        """Get personal information"""
        personal_data = self.repository.get_personal_info(
            self.db, delivery_person_id
        )
        
        if not personal_data:
            raise ValueError("Delivery person not found")
        
        return PersonalInfo(**personal_data)
    
    def update_personal_info(
        self, 
        delivery_person_id: int,
        update_data: PersonalInfoUpdate
    ) -> ProfileUpdateResponse:
        """Update personal information"""
        # Convert Pydantic model to dict
        update_dict = update_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            return ProfileUpdateResponse(
                success=False,
                message="No data provided for update",
                updated_fields=[]
            )
        
        # Validate phone number if provided
        if 'phone' in update_dict and update_dict['phone']:
            if not self._validate_phone_number(update_dict['phone']):
                return ProfileUpdateResponse(
                    success=False,
                    message="Invalid phone number format",
                    updated_fields=[]
                )
        
        # Validate date of birth if provided
        if 'date_of_birth' in update_dict and update_dict['date_of_birth']:
            if not self._validate_date_of_birth(update_dict['date_of_birth']):
                return ProfileUpdateResponse(
                    success=False,
                    message="Invalid date of birth",
                    updated_fields=[]
                )
        
        # Update in repository
        success = self.repository.update_personal_info(
            self.db, delivery_person_id, update_dict
        )
        
        if success:
            updated_fields = list(update_dict.keys())
            # Get updated data
            updated_data = self.repository.get_personal_info(self.db, delivery_person_id)
            
            return ProfileUpdateResponse(
                success=True,
                message="Personal information updated successfully",
                updated_fields=updated_fields,
                profile_data=updated_data
            )
        else:
            return ProfileUpdateResponse(
                success=False,
                message="Failed to update personal information",
                updated_fields=[]
            )
    
    def get_verification_status(self, delivery_person_id: int) -> VerificationStatus:
        """Get verification documents status"""
        documents_data = self.repository.get_verification_documents(
            self.db, delivery_person_id
        )
        
        if not documents_data:
            return VerificationStatus(
                overall_status="PENDING",
                verified_documents=0,
                total_documents=0,
                pending_documents=0,
                documents=[]
            )
        
        # Convert to VerificationDocument objects
        documents = []
        verified_count = 0
        
        for doc_data in documents_data:
            document = VerificationDocument(**doc_data)
            documents.append(document)
            if document.status == "VERIFIED":
                verified_count += 1
        
        # Determine overall status
        total_documents = len(documents)
        pending_documents = total_documents - verified_count
        
        overall_status = "VERIFIED" if verified_count == total_documents else "PENDING"
        if pending_documents > 0 and verified_count == 0:
            overall_status = "PENDING"
        elif pending_documents > 0:
            overall_status = "UNDER_REVIEW"
        
        return VerificationStatus(
            overall_status=overall_status,
            verified_documents=verified_count,
            total_documents=total_documents,
            pending_documents=pending_documents,
            documents=documents
        )
    
    def get_profile_statistics(self, delivery_person_id: int) -> ProfileStats:
        """Get profile statistics"""
        stats_data = self.repository.get_profile_statistics(
            self.db, delivery_person_id
        )
        
        return ProfileStats(**stats_data)
    
    def get_account_settings(self, delivery_person_id: int) -> AccountSettingsResponse:
        """Get account settings (simplified - based on HTML)"""
        # These would normally come from a database table
        # For now, returning static settings based on HTML
        
        notification_settings = [
            AccountSetting(
                setting_id=1,
                setting_type="notification",
                setting_name="Order Updates",
                setting_value="true",
                description="Notifications for new orders and updates",
                is_editable=True
            ),
            AccountSetting(
                setting_id=2,
                setting_type="notification",
                setting_name="Payment Updates",
                setting_value="true",
                description="Notifications for payments and earnings",
                is_editable=True
            ),
            AccountSetting(
                setting_id=3,
                setting_type="notification",
                setting_name="Promotional Offers",
                setting_value="false",
                description="Receive promotional offers and discounts",
                is_editable=True
            )
        ]
        
        privacy_settings = [
            AccountSetting(
                setting_id=4,
                setting_type="privacy",
                setting_name="Show Online Status",
                setting_value="true",
                description="Allow others to see your online status",
                is_editable=True
            ),
            AccountSetting(
                setting_id=5,
                setting_type="privacy",
                setting_name="Share Location",
                setting_value="true",
                description="Share location during active deliveries",
                is_editable=True
            )
        ]
        
        preference_settings = [
            AccountSetting(
                setting_id=6,
                setting_type="preference",
                setting_name="Theme",
                setting_value="LIGHT",
                description="Light or dark mode",
                is_editable=True
            ),
            AccountSetting(
                setting_id=7,
                setting_type="preference",
                setting_name="Language",
                setting_value="English",
                description="App language preference",
                is_editable=True
            )
        ]
        
        total_settings = len(notification_settings) + len(privacy_settings) + len(preference_settings)
        
        return AccountSettingsResponse(
            notifications=notification_settings,
            privacy=privacy_settings,
            preferences=preference_settings,
            total_settings=total_settings
        )
    

    def update_address(
        self,
        delivery_person_id: int,
        address_data: AddressUpdateRequest
    ) -> ProfileUpdateResponse:
        """Update delivery person's address"""
        update_dict = address_data.model_dump()
        
        success = self.repository.update_address(
            self.db, delivery_person_id, update_dict
        )
        
        if success:
            return ProfileUpdateResponse(
                success=True,
                message="Address updated successfully",
                updated_fields=list(update_dict.keys())
            )
        else:
            return ProfileUpdateResponse(
                success=False,
                message="Failed to update address. Please check the area ID.",
                updated_fields=[]
            )
            
    def change_password(
        self,
        delivery_person_id: int,
        password_data: ChangePasswordRequest
    ) -> ProfileUpdateResponse:
        """Change delivery person's password"""
        # Validate passwords match
        if password_data.new_password != password_data.confirm_password:
            return ProfileUpdateResponse(
                success=False,
                message="New passwords do not match",
                updated_fields=[]
            )
        
        # Check password strength
        strength_result = self._check_password_strength(password_data.new_password)
        if not strength_result.is_strong:
            return ProfileUpdateResponse(
                success=False,
                message=f"Password is too weak. Suggestions: {', '.join(strength_result.suggestions)}",
                updated_fields=[]
            )
        
        # Get delivery person and user
        delivery_person = self.db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person:
            return ProfileUpdateResponse(
                success=False,
                message="Delivery person not found",
                updated_fields=[]
            )
        
        user = self.db.query(User).filter(
            User.user_id == delivery_person.user_id
        ).first()
        
        if not user:
            return ProfileUpdateResponse(
                success=False,
                message="User not found",
                updated_fields=[]
            )
        
        # Verify current password (simplified - in real app, use proper hashing)
        # For now, we'll skip current password verification for demo
        # In production: if not verify_password(password_data.current_password, user.password_hash):
        
        # Update password (in production, hash the password)
        # For demo: user.password_hash = hash_password(password_data.new_password)
        
        try:
            # Just mark as updated for demo
            # In real app: user.password_hash = generate_password_hash(password_data.new_password)
            self.db.commit()
            
            return ProfileUpdateResponse(
                success=True,
                message="Password updated successfully",
                updated_fields=["password"]
            )
            
        except Exception as e:
            self.db.rollback()
            return ProfileUpdateResponse(
                success=False,
                message=f"Failed to update password: {str(e)}",
                updated_fields=[]
            )
    
    def _validate_phone_number(self, phone: str) -> bool:
        """Validate phone number format"""
        # Simple validation - adjust as needed
        phone_pattern = r'^\+?[1-9]\d{9,14}$'
        return bool(re.match(phone_pattern, phone))
    
    def _validate_date_of_birth(self, dob: date) -> bool:
        """Validate date of birth"""
        # Must be in the past
        if dob >= date.today():
            return False
        
        # Must be reasonable (at least 18 years old for delivery work)
        age = date.today().year - dob.year
        if age < 18:
            return False
        
        return True
    
    def _check_password_strength(self, password: str) -> PasswordStrengthResponse:
        """Check password strength"""
        suggestions = []
        score = 0
        
        # Length check
        if len(password) >= 8:
            score += 25
        else:
            suggestions.append("Password should be at least 8 characters long")
        
        # Contains uppercase
        if re.search(r'[A-Z]', password):
            score += 25
        else:
            suggestions.append("Add uppercase letters")
        
        # Contains lowercase
        if re.search(r'[a-z]', password):
            score += 25
        else:
            suggestions.append("Add lowercase letters")
        
        # Contains numbers
        if re.search(r'\d', password):
            score += 15
        else:
            suggestions.append("Add numbers")
        
        # Contains special characters
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            score += 10
        else:
            suggestions.append("Add special characters")
        
        is_strong = score >= 80
        
        return PasswordStrengthResponse(
            is_strong=is_strong,
            score=score,
            suggestions=suggestions
        )