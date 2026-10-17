from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    email: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Token] = None