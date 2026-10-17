# delivery_panel/vehicle/delivery_vehicle_schema.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum


# Enums
class VehicleStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"
    OFF_DUTY = "OFF_DUTY"


class DocumentStatus(str, Enum):
    VERIFIED = "VERIFIED"
    PENDING = "PENDING"
    EXPIRED = "EXPIRED"
    UNDER_REVIEW = "UNDER_REVIEW"


class InsuranceStatus(str, Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    RENEWAL_PENDING = "RENEWAL_PENDING"


class ServiceStatus(str, Enum):
    COMPLETED = "COMPLETED"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    OVERDUE = "OVERDUE"


# Vehicle Basic Information Schema
class VehicleBasicInfo(BaseModel):
    vehicle_id: int
    vehicle_type: str
    brand: str
    model: str
    year: Optional[int] = None
    color: Optional[str] = None
    registration_number: str
    status: VehicleStatus
    current_mileage: Optional[float] = None
    average_fuel_efficiency: Optional[float] = None
    next_service_km: Optional[float] = None


# Vehicle Details Response
class VehicleDetailsResponse(BaseModel):
    vehicle_info: Optional[VehicleBasicInfo] = None  # Changed from required to Optional
    last_updated: Optional[datetime] = None


# Vehicle Document Schema
class VehicleDocument(BaseModel):
    document_id: int
    document_type: str
    document_name: str
    document_number: str
    status: DocumentStatus
    verified_at: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    uploaded_at: Optional[datetime] = None
    download_url: Optional[str] = None
    remarks: Optional[str] = None


class VehicleDocumentsResponse(BaseModel):
    documents: List[VehicleDocument]
    total_documents: int
    verified_count: int
    pending_count: int


# Insurance Details Schema
class InsuranceDetails(BaseModel):
    insurance_id: int
    provider_name: str
    policy_number_masked: str  # Masked for security
    policy_number_full: Optional[str] = None  # Only in backend
    coverage_type: str
    amount_covered: Optional[float] = None
    premium_amount: Optional[float] = None
    status: InsuranceStatus
    start_date: datetime
    expiry_date: datetime
    renewal_date: Optional[datetime] = None
    agent_contact: Optional[str] = None
    agent_email: Optional[str] = None


class InsuranceResponse(BaseModel):
    insurance_details: Optional[InsuranceDetails] = None  # Changed from required to Optional
    days_until_expiry: Optional[int] = None
    is_active: bool = False

# Service History Schema
class ServiceRecord(BaseModel):
    service_id: int
    service_type: str
    service_date: datetime
    mileage_at_service: float
    description: str
    cost: Optional[float] = None
    status: ServiceStatus
    service_center: Optional[str] = None
    next_service_km: Optional[float] = None
    next_service_date: Optional[datetime] = None
    notes: Optional[str] = None


class ServiceHistoryResponse(BaseModel):
    service_records: List[ServiceRecord]
    total_services: int
    last_service_date: Optional[datetime] = None
    next_service_date: Optional[datetime] = None
    total_service_cost: Optional[float] = None


class VehicleComprehensiveResponse(BaseModel):
    vehicle_info: Optional[VehicleBasicInfo] = None  # Changed from required to Optional
    insurance_details: Optional[InsuranceDetails] = None
    recent_service: Optional[ServiceRecord] = None
    document_count: int = 0


# Error Response
class VehicleErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


# Success Response
class VehicleSuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


# Empty Response for no data
class NoVehicleResponse(BaseModel):
    success: bool = True
    message: str = "No vehicle information found"
    data: Dict[str, Any] = {}


# Filter Request (if needed for future)
class VehicleFilterRequest(BaseModel):
    document_status: Optional[DocumentStatus] = None
    insurance_status: Optional[InsuranceStatus] = None
    service_status: Optional[ServiceStatus] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None