from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum

# --- Enums ---
class DiscountType(str, Enum):
    PERCENT = "PERCENT"
    FLAT = "FLAT"

# --- Coupon Schemas ---
class CouponBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    discount_type: DiscountType
    discount_value: Decimal = Field(..., gt=0)
    min_order_amount: Optional[Decimal] = None
    max_discount_amount: Optional[Decimal] = None
    start_date: datetime
    end_date: datetime
    usage_limit: int = Field(default=1, ge=1)
    is_active: bool = True

class CouponCreate(CouponBase):
    variant_ids: Optional[List[int]] = None

class CouponUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=255)
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[Decimal] = Field(None, gt=0)
    min_order_amount: Optional[Decimal] = None
    max_discount_amount: Optional[Decimal] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    usage_limit: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None

class CouponResponse(CouponBase):
    coupon_id: int
    created_at: datetime
    variants: List[int] = []

    model_config = ConfigDict(from_attributes=True)

# Coupon Wrapper Schemas
class CouponWrapper(BaseModel):
    success: bool
    message: str
    data: CouponResponse

class CouponListWrapper(BaseModel):
    success: bool
    message: str
    data: List[CouponResponse]

# --- Offer Schemas ---
class OfferBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    discount_type: DiscountType
    discount_value: Decimal = Field(..., gt=0)
    start_date: datetime
    end_date: datetime
    is_active: bool = True

class OfferCreate(OfferBase):
    variant_ids: Optional[List[int]] = None

class OfferUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[Decimal] = Field(None, gt=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class OfferResponse(OfferBase):
    offer_id: int
    created_at: datetime
    variants: List[int] = []

    model_config = ConfigDict(from_attributes=True)

# Offer Wrapper Schemas
class OfferWrapper(BaseModel):
    success: bool
    message: str
    data: OfferResponse

class OfferListWrapper(BaseModel):
    success: bool
    message: str
    data: List[OfferResponse]

# --- Coupon Validation Schemas ---
class CouponValidationRequest(BaseModel):
    coupon_code: str
    variant_ids: List[int]
    order_total: Decimal = Field(..., gt=0)

class CouponValidationResponse(BaseModel):
    valid: bool
    discount_amount: Decimal
    message: str
    coupon: Optional[CouponResponse] = None

class CouponValidationWrapper(BaseModel):
    success: bool
    message: str
    data: CouponValidationResponse

# --- Message Wrapper ---
class MessageWrapper(BaseModel):
    success: bool
    message: str
    data: dict = {}