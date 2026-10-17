# delivery_panel/profile/delivery_profile_schema.py
from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from enum import Enum
from decimal import Decimal


# Enums
class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class DocumentStatus(str, Enum):
    VERIFIED = "VERIFIED"
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    EXPIRED = "EXPIRED"


class NotificationPreference(str, Enum):
    ALL = "ALL"
    IMPORTANT_ONLY = "IMPORTANT_ONLY"
    NONE = "NONE"


class ThemePreference(str, Enum):
    LIGHT = "LIGHT"
    DARK = "DARK"
    SYSTEM = "SYSTEM"


# Profile Overview Schema
class ProfileOverview(BaseModel):
    user_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    profile_image_url: Optional[str] = None
    role: str = "Delivery Partner"
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    last_login: Optional[datetime] = None
    
    # Delivery-specific fields
    delivery_person_id: int
    license_number: Optional[str] = None
    delivery_status: str = "ACTIVE"
    rating: Optional[Decimal] = None
    joined_at: datetime
    is_online: bool = False
    
    # Stats
    total_deliveries: int = 0
    total_earnings: Decimal = Decimal('0.00')
    average_rating: Optional[float] = None
    on_time_rate: Optional[float] = None


# Personal Information Schema
class PersonalInfo(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    profile_image_url: Optional[str] = None
    
    # Address Information
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    
    # Delivery-specific
    license_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None


class PersonalInfoUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    profile_image_url: Optional[str] = None


# Account Settings Schema
class AccountSetting(BaseModel):
    setting_id: int
    setting_type: str
    setting_name: str
    setting_value: str
    description: Optional[str] = None
    is_editable: bool = True


class AccountSettingsResponse(BaseModel):
    notifications: List[AccountSetting]
    privacy: List[AccountSetting]
    preferences: List[AccountSetting]
    total_settings: int


class NotificationSettingUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    order_updates: Optional[bool] = None
    payment_updates: Optional[bool] = None
    promotional_offers: Optional[bool] = None


class ThemeSettingUpdate(BaseModel):
    theme: ThemePreference = ThemePreference.LIGHT
    font_size: Optional[str] = None
    language: Optional[str] = None


# Documents & Verification Schema
class VerificationDocument(BaseModel):
    document_id: int
    document_type: str
    document_name: str
    document_number: Optional[str] = None
    status: DocumentStatus
    verified_at: Optional[datetime] = None
    expiry_date: Optional[date] = None
    uploaded_at: datetime
    download_url: Optional[str] = None
    remarks: Optional[str] = None


class VerificationStatus(BaseModel):
    overall_status: DocumentStatus
    verified_documents: int
    total_documents: int
    pending_documents: int
    documents: List[VerificationDocument]


# Statistics Schema
class DeliveryStat(BaseModel):
    period: str  # "today", "week", "month", "total"
    deliveries: int
    earnings: Decimal
    average_rating: Optional[float] = None
    on_time_rate: Optional[float] = None


class ProfileStats(BaseModel):
    total_deliveries: int
    completed_deliveries: int
    total_earnings: Decimal
    average_rating: Optional[float] = None
    on_time_rate: Optional[float] = None
    joined_since_days: int
    performance_trend: Optional[float] = None  # percentage change


# Change Password Schema
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class PasswordStrengthResponse(BaseModel):
    is_strong: bool
    score: int  # 0-100
    suggestions: List[str]


# Profile Response Schema
class ProfileResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    profile_overview: Optional[ProfileOverview] = None
    personal_info: Optional[PersonalInfo] = None
    account_settings: Optional[AccountSettingsResponse] = None
    verification_status: Optional[VerificationStatus] = None
    statistics: Optional[ProfileStats] = None


class ProfileUpdateResponse(BaseModel):
    success: bool = True
    message: str
    updated_fields: List[str]
    profile_data: Optional[Dict[str, Any]] = None


# Error Schema
class ProfileErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


# Health Check Schema
class ProfileHealthResponse(BaseModel):
    success: bool = True
    message: str
    module: str = "delivery_profile"
    timestamp: datetime
    dependencies: Dict[str, bool]


# File Upload Schema (for profile image)
class FileUploadResponse(BaseModel):
    success: bool = True
    message: str
    file_url: str
    file_name: str
    file_size: int
    content_type: str


# Settings Update Request
class SettingsUpdateRequest(BaseModel):
    setting_type: str  # "notification", "privacy", "preference"
    setting_key: str
    setting_value: Any


# Address Update Request
class AddressUpdateRequest(BaseModel):
    address_type: str = "Home"  # Home, Work, Other
    line1: str
    line2: Optional[str] = None
    area_id: int  # Only area_id is needed, not area/city/state names
    is_default: bool = True


# Bank Details Schema (if shown in HTML)
class BankDetails(BaseModel):
    account_holder: str
    bank_name: str
    account_number_masked: str
    ifsc_code: str
    branch_name: Optional[str] = None
    is_verified: bool = False


# Contact Information Schema
class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str
    is_primary: bool = False


# Activity Log Schema
class ProfileActivity(BaseModel):
    activity_id: int
    activity_type: str
    description: str
    timestamp: datetime
    ip_address: Optional[str] = None
    device_info: Optional[str] = None


class ActivityLogResponse(BaseModel):
    activities: List[ProfileActivity]
    total_activities: int
    recent_activity: Optional[ProfileActivity] = None