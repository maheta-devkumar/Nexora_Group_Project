# schemas/inventory_schema.py
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum

# --- Fixed Enums ---
class PurchaseStatus(str, Enum):
    PENDING = "PENDING"
    RECEIVED = "RECEIVED" 
    CANCELLED = "CANCELLED"
    RETURNED = "RETURNED"

class ReturnStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class MovementType(str, Enum):
    IN = "IN"
    OUT = "OUT"
    RETURN = "RETURN"
    ADJUSTMENT = "ADJUSTMENT"

class ReferenceType(str, Enum):
    PURCHASE = "PURCHASE"
    ORDER = "ORDER"
    RETURN = "RETURN"
    MANUAL = "MANUAL"

# --- Area Schema ---
class AreaBase(BaseModel):
    name: str
    city: str
    state: str
    country: str = "India"
    pincode: Optional[str] = None

class AreaResponse(AreaBase):
    area_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Company Schemas ---
class CompanyBase(BaseModel):
    name: str
    gst_number: Optional[str] = None
    address_line: Optional[str] = None
    area_id: int
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    gst_number: Optional[str] = None
    address_line: Optional[str] = None
    area_id: Optional[int] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None

class CompanyResponse(CompanyBase):
    company_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    area: Optional[AreaResponse] = None

    model_config = ConfigDict(from_attributes=True)

# Company Wrapper Schemas
class CompanyWrapper(BaseModel):
    success: bool
    message: str
    data: CompanyResponse

class CompanyListWrapper(BaseModel):
    success: bool
    message: str
    data: List[CompanyResponse]

# --- Supplier Schemas ---
class SupplierBase(BaseModel):
    company_id: Optional[int] = None  # Changed from int to Optional[int]
    name: str = Field(..., min_length=1, max_length=150)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    address_line: Optional[str] = None
    area_id: int
    gst_number: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    company_id: Optional[int] = None  # Changed from int to Optional[int]
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    address_line: Optional[str] = None
    area_id: Optional[int] = None
    gst_number: Optional[str] = None

# schemas/inventory_schema.py - Add these schemas

# Simplified Company schema for Supplier response
class CompanySimple(BaseModel):
    company_id: int
    name: str
    gst_number: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Simplified Area schema for Supplier response
class AreaSimple(BaseModel):
    area_id: int
    name: str
    city: str
    state: str
    pincode: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Update SupplierResponse to use simplified schemas
class SupplierResponse(SupplierBase):
    supplier_id: int
    is_active: bool
    total_purchases: Decimal
    last_purchase_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    company: Optional[CompanySimple] = None  # Use simplified schema
    area: Optional[AreaSimple] = None       # Use simplified schema

    model_config = ConfigDict(from_attributes=True)

# Supplier Wrapper Schemas
class SupplierWrapper(BaseModel):
    success: bool
    message: str
    data: SupplierResponse

class SupplierListWrapper(BaseModel):
    success: bool
    message: str
    data: List[SupplierResponse]

# --- Purchase Item Schemas ---
class PurchaseItemBase(BaseModel):
    variant_id: int
    quantity: int = Field(..., gt=0)
    cost_per_unit: Decimal = Field(..., gt=0)
    total_cost: Decimal = Field(..., gt=0)

class PurchaseItemCreate(PurchaseItemBase):
    pass

class PurchaseItemResponse(PurchaseItemBase):
    model_config = ConfigDict(from_attributes=True)

# --- Purchase Schemas ---
# schemas/inventory_schema.py - Update Purchase schemas
class PurchaseBase(BaseModel):
    supplier_id: int
    # Remove company_id
    invoice_number: Optional[str] = Field(None, max_length=100)
    total_cost: Decimal = Field(..., gt=0)
    status: PurchaseStatus = PurchaseStatus.PENDING
    notes: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    items: List[PurchaseItemCreate] = Field(..., min_items=1)

class PurchaseUpdate(BaseModel):
    supplier_id: Optional[int] = None
    # Remove company_id
    invoice_number: Optional[str] = Field(None, max_length=100)
    total_cost: Optional[Decimal] = Field(None, gt=0)
    status: Optional[PurchaseStatus] = None
    notes: Optional[str] = None

class PurchaseResponse(PurchaseBase):
    purchase_id: int
    purchase_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Purchase Wrapper Schemas
class PurchaseWrapper(BaseModel):
    success: bool
    message: str
    data: PurchaseResponse

class PurchaseListWrapper(BaseModel):
    success: bool
    message: str
    data: List[PurchaseResponse]

# --- Purchase Return Item Schemas ---
class PurchaseReturnItemBase(BaseModel):
    variant_id: int
    quantity: int = Field(..., gt=0)
    refund_amount: Decimal = Field(..., gt=0)
    reason: Optional[str] = Field(None, max_length=255)

class PurchaseReturnItemCreate(PurchaseReturnItemBase):
    pass

class PurchaseReturnItemResponse(PurchaseReturnItemBase):
    model_config = ConfigDict(from_attributes=True)

# --- Purchase Return Schemas ---
class PurchaseReturnBase(BaseModel):
    purchase_id: int
    reason: str = Field(..., min_length=1)
    total_refund: Decimal = Field(..., gt=0)
    status: ReturnStatus = ReturnStatus.PENDING

class PurchaseReturnCreate(PurchaseReturnBase):
    items: List[PurchaseReturnItemCreate] = Field(..., min_items=1)

class PurchaseReturnUpdate(BaseModel):
    reason: Optional[str] = Field(None, min_length=1)
    total_refund: Optional[Decimal] = Field(None, gt=0)
    status: Optional[ReturnStatus] = None

class PurchaseReturnResponse(PurchaseReturnBase):
    return_id: int
    return_date: datetime

    model_config = ConfigDict(from_attributes=True)

# Purchase Return Wrapper Schemas
class PurchaseReturnWrapper(BaseModel):
    success: bool
    message: str
    data: PurchaseReturnResponse

class PurchaseReturnListWrapper(BaseModel):
    success: bool
    message: str
    data: List[PurchaseReturnResponse]

# --- Batch Item Schemas ---
class BatchItemBase(BaseModel):
    variant_id: int
    quantity: int = Field(..., gt=0)

class BatchItemCreate(BatchItemBase):
    pass

class BatchItemResponse(BatchItemBase):
    model_config = ConfigDict(from_attributes=True)

# --- Product Batch Schemas ---
class ProductBatchBase(BaseModel):
    purchase_id: int
    batch_number: str = Field(..., min_length=1, max_length=100)
    manufactured_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

class ProductBatchCreate(ProductBatchBase):
    items: List[BatchItemCreate] = Field(..., min_items=1)

class ProductBatchUpdate(BaseModel):
    batch_number: Optional[str] = Field(None, min_length=1, max_length=100)
    manufactured_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

class ProductBatchResponse(ProductBatchBase):
    batch_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Product Batch Wrapper Schemas
class ProductBatchWrapper(BaseModel):
    success: bool
    message: str
    data: ProductBatchResponse

class ProductBatchListWrapper(BaseModel):
    success: bool
    message: str
    data: List[ProductBatchResponse]

# --- Stock Movement Schemas ---
class StockMovementBase(BaseModel):
    variant_id: int
    movement_type: MovementType
    reference_type: ReferenceType
    reference_id: int
    quantity: int
    unit_cost: Optional[Decimal] = None
    remark: Optional[str] = Field(None, max_length=255)

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementResponse(StockMovementBase):
    movement_id: int
    moved_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Stock Movement Wrapper Schemas
class StockMovementWrapper(BaseModel):
    success: bool
    message: str
    data: StockMovementResponse

class StockMovementListWrapper(BaseModel):
    success: bool
    message: str
    data: List[StockMovementResponse]

# --- Stock Summary Schema ---
class StockSummaryResponse(BaseModel):
    variant_id: int
    variant_name: str
    current_stock: int
    reserved_stock: int
    available_stock: int
    total_value: Decimal

    model_config = ConfigDict(from_attributes=True)

class AreaListWrapper(BaseModel):
    success: bool
    message: str
    data: List[AreaResponse]

class StockSummaryListWrapper(BaseModel):
    success: bool
    message: str
    data: List[StockSummaryResponse]

# --- Message Wrapper ---
class MessageWrapper(BaseModel):
    success: bool
    message: str
    data: dict = {}
