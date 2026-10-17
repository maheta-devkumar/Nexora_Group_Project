from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional
from datetime import date, datetime

# --- Core Profile Schemas ---
class ProfileBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    profile_img_url: Optional[str] = None

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    profile_img_url: Optional[str] = None
    
    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v):
        if v is not None and v not in ['Male', 'Female', 'Other', 'male', 'female', 'other']:
            raise ValueError('Gender must be Male, Female, or Other')
        return v
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None and len(v) < 10:
            raise ValueError('Phone number must be at least 10 characters')
        return v

class ProfileResponse(BaseModel):
    user_id: int
    username: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    profile_img_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Password Change Schema ---
class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

# --- User Statistics Schema ---
class UserStats(BaseModel):
    total_orders: int
    active_orders: int
    completed_orders: int
    cancelled_orders: int
    total_spent: float
    saved_addresses: int
    wishlist_items: int
    reviews: int
    cart_items: int

# --- Response Wrapper Schemas ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: str

class ProfileWrapper(SuccessWrapper):
    data: ProfileResponse

class StatsWrapper(SuccessWrapper):
    data: UserStats

class MessageWrapper(SuccessWrapper):
    data: Optional[dict] = None