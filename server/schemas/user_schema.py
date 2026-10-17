from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- Authentication Schemas ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None

class TokenData(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserAuthResponse(BaseModel):
    user_id: int
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None
    user: Optional[UserData] = None

class RegisterResponse(BaseModel):
    status: bool = True
    message: str = "User Registered Successfully"
    user: UserData

class UserData(BaseModel):
    user_id: int
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str]
    roles: List[str]
    profile_img_url: Optional[str] = None
# --- Utility Schemas (Keep existing ones) ---
class UserDetail(BaseModel):
    user_id: int
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserSummaryResponseData(BaseModel):
    users: List[UserDetail]
    total_users: int

# --- Core User Schemas (Keep existing) ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    user_id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Wrapper Schemas (Keep existing) ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class UserSummaryWrapper(SuccessWrapper):
    data: UserSummaryResponseData

class UserWrapper(SuccessWrapper):
    data: UserResponse

class MessageWrapper(SuccessWrapper):
    data: dict

class UserListWrapper(SuccessWrapper):
    data: List[UserDetail]