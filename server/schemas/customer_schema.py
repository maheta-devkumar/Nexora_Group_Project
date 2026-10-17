from pydantic import BaseModel, EmailStr, ConfigDict, field_serializer
from typing import Optional, List
from datetime import date, datetime


class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str]
    is_active: bool


class CustomerResponse(BaseModel):
    user_id: int
    email: str
    is_active: bool
    full_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("full_name")
    def serialize_full_name(self, _):
        first = getattr(self, "first_name", None)
        last = getattr(self, "last_name", None)

        if first or last:
            return f"{first or ''} {last or ''}".strip()

        return None


# ✅ FIXED: Wrapper that matches actual API response
class CustomerListResponse(BaseModel):
    success: bool
    message: str
    data: List[CustomerResponse]


class CustomerUpdate(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    is_active: Optional[bool]


class CustomerStatsResponse(BaseModel):
    total_orders: int
    total_spent: float


class MessageResponse(BaseModel):
    success: bool
    message: str
    data: Optional[object] = None

class CustomerSingleResponse(BaseModel):
    success: bool
    message: str
    data: CustomerResponse
class SingleCustomerWrapper(BaseModel):
    success: bool
    message: str
    data: CustomerResponse
