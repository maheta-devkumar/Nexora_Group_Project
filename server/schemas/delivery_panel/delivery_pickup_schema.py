from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from decimal import Decimal


# ===== ENUMS =====
class PickupStatus(str, Enum):
    """Status of a pickup"""
    ASSIGNED = "ASSIGNED"
    PENDING_PICKUP = "PENDING_PICKUP"
    PICKED_UP = "PICKED_UP"
    CANCELLED = "CANCELLED"





class VendorType(str, Enum):
    """Type of vendor/pickup location"""
    STORE = "STORE"
    WAREHOUSE = "WAREHOUSE"
    SUPPLIER = "SUPPLIER"


# ===== REQUEST SCHEMAS =====



class ConfirmPickupRequest(BaseModel):
    """Request to confirm pickup"""
    delivery_id: int
    notes: Optional[str] = None
    pod_image_url: Optional[str] = None  # Proof of pickup image
    signature_url: Optional[str] = None  # Vendor signature if applicable


class PickupFilters(BaseModel):
    """Filters for pending pickups"""
    vendor_type: Optional[VendorType] = None
    sort_by: str = "nearest"  # nearest, time, priority
    pickup_location_id: Optional[int] = None


# ===== RESPONSE SCHEMAS =====
class VendorDetails(BaseModel):
    """Vendor/seller details"""
    vendor_id: int
    vendor_name: str
    vendor_type: VendorType
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    business_hours: Optional[str] = None


class PickupLocation(BaseModel):
    """Pickup location details"""
    location_id: int
    name: str
    address_line1: str
    address_line2: Optional[str] = None
    area_name: str
    city_name: str
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: Optional[float] = None
    estimated_time_minutes: Optional[int] = None


class PickupItem(BaseModel):
    """A single item in a pickup"""
    variant_id: int
    variant_name: str
    product_name: str
    quantity: int
    sku: Optional[str] = None


class PendingPickup(BaseModel):
    """Single pending pickup item"""
    delivery_id: int
    order_id: int
    delivery_number: str  # Format: DLV-{delivery_id:05d}
    order_number: str    # Format: ORD-{order_id:05d}
    
    # Vendor information
    vendor: VendorDetails
    
    # Pickup location
    pickup_location: PickupLocation
    
    # Order details
    items: List[PickupItem]
    total_items: int
    order_amount: Optional[float] = None
    payment_type: str  # COD or PREPAID
    
    # Status & timing
    status: PickupStatus
    status_text: str
    assigned_at: datetime
    expected_pickup_time: Optional[datetime] = None
    pickup_time_slot: Optional[str] = None  # e.g., "10:00 AM - 12:00 PM"
    
    # Actions available
    available_actions: List[str]  # scan_qr, confirm, navigate, call
    
    # Metadata
    priority: Optional[str] = None  # URGENT, HIGH, NORMAL
    notes: Optional[str] = None


class PickupLocationGroup(BaseModel):
    """Group of pickups at same location"""
    location_id: int
    location_name: str
    location_type: VendorType
    address: str
    distance: Optional[str] = None
    estimated_time: Optional[str] = None
    pickup_count: int
    pickups: List[PendingPickup]


# FIXED: Changed stats from Dict[str, int] to Dict[str, Any] to allow nested dicts
class PendingPickupsResponse(BaseModel):
    """Response for pending pickups list"""
    pending_pickups: List[PendingPickup]
    grouped_by_location: List[PickupLocationGroup]
    stats: Dict[str, Any]  # Changed from Dict[str, int] to allow nested dicts
    total_count: int


class PickupDetailsResponse(BaseModel):
    """Detailed response for single pickup"""
    pickup: Optional[PendingPickup] = None  # Made optional for error cases
    order_details: Dict[str, Any]  # Extended order info
    vendor_contact: Optional[Dict[str, Any]] = None  # Extended contact info
    pickup_instructions: Optional[str] = None
    qr_requirements: Optional[List[str]] = None  # QR verification requirements





class ConfirmPickupResponse(BaseModel):
    """Response for pickup confirmation"""
    success: bool
    message: str
    delivery_id: int
    order_id: int
    confirmed_at: datetime
    new_status: PickupStatus
    next_step: Optional[str] = None  # Next action for delivery person


class NavigationResponse(BaseModel):
    """Navigation details for pickup location"""
    success: bool
    pickup_location_id: int
    google_maps_url: str
    openstreetmap_url: str
    latitude: float
    longitude: float
    formatted_address: str
    distance_km: Optional[float] = None
    estimated_time_minutes: Optional[int] = None


class VendorContactResponse(BaseModel):
    """Vendor contact information"""
    success: bool
    vendor_id: int
    vendor_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    business_hours: Optional[str] = None
    emergency_contact: Optional[str] = None
    notes: Optional[str] = None


# ===== ERROR RESPONSE SCHEMAS =====
class PickupErrorResponse(BaseModel):
    """Error response for pickup operations"""
    success: bool = False
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None


# ===== COMMON RESPONSE =====
class DeliveryPickupResponse(BaseModel):
    """General response wrapper"""
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[PickupErrorResponse] = None