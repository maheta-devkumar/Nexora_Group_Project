from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from decimal import Decimal


# Enums
class DeliveryStatus(str, Enum):
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    RETURNED = "RETURNED"


class PaymentType(str, Enum):
    COD = "COD"
    PREPAID = "PREPAID"


class RatingStars(int, Enum):
    ONE = 1
    TWO = 2
    THREE = 3
    FOUR = 4
    FIVE = 5


# Request Schemas
class DateFilterRequest(BaseModel):
    """Date range filter for completed deliveries"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    period: Optional[str] = None  # "today", "week", "month", "custom"


class PaginationRequest(BaseModel):
    """Pagination request"""
    page: int = 1
    per_page: int = 20


class CompletedDeliveriesFilter(BaseModel):
    """Filter options for completed deliveries"""
    date_filter: Optional[DateFilterRequest] = None
    pagination: Optional[PaginationRequest] = None
    status: Optional[DeliveryStatus] = None
    min_earning: Optional[float] = None
    max_earning: Optional[float] = None


# Response Schemas
class CustomerInfo(BaseModel):
    """Customer information for completed delivery"""
    customer_id: int
    name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class DeliveryEarningsInfo(BaseModel):
    """Earnings information for completed delivery"""
    amount: float
    earning_id: Optional[int] = None
    earned_at: Optional[datetime] = None
    is_settled: bool = False


class CustomerRatingInfo(BaseModel):
    """Customer rating information"""
    rating: Optional[float] = None
    review_id: Optional[int] = None
    review_text: Optional[str] = None
    created_at: Optional[datetime] = None
    
    @property
    def stars_display(self) -> str:
        """Convert rating to star display (e.g., ★★★★☆)"""
        if not self.rating:
            return "No rating"
        full_stars = int(self.rating)
        half_star = self.rating - full_stars >= 0.5
        empty_stars = 5 - full_stars - (1 if half_star else 0)
        
        stars = "★" * full_stars
        if half_star:
            stars += "½"
        stars += "☆" * empty_stars
        return stars


class PODInfo(BaseModel):
    """Proof of Delivery information"""
    pod_image_url: Optional[str] = None
    signature_url: Optional[str] = None
    delivery_notes: Optional[str] = None
    has_pod: bool = False
    
    @property
    def pod_type(self) -> str:
        """Get POD type description"""
        if self.pod_image_url and self.signature_url:
            return "image_and_signature"
        elif self.pod_image_url:
            return "image"
        elif self.signature_url:
            return "signature"
        else:
            return "none"


class AddressInfo(BaseModel):
    """Address information for completed delivery"""
    address_line1: str
    address_line2: Optional[str] = None
    area_name: str
    city_name: str
    pincode: Optional[str] = None
    
    @property
    def short_address(self) -> str:
        """Short address format (Area, City)"""
        return f"{self.area_name}, {self.city_name}"
    
    @property
    def full_address(self) -> str:
        """Full address format"""
        address = self.address_line1
        if self.address_line2:
            address += f", {self.address_line2}"
        address += f", {self.area_name}, {self.city_name}"
        if self.pincode:
            address += f" - {self.pincode}"
        return address


class CompletedDeliveryItem(BaseModel):
    """Single completed delivery item for list view"""
    delivery_id: int
    order_id: int
    order_number: str  # Formatted like ORD-12456
    delivery_status: DeliveryStatus
    delivered_at: datetime
    delivery_person_id: int
    
    # Customer info
    customer: CustomerInfo
    
    # Address info (short format)
    address: AddressInfo
    
    # Order details
    total_amount: float
    payment_type: PaymentType
    items_count: int
    
    # Earnings
    earnings: DeliveryEarningsInfo
    
    # Rating
    rating: CustomerRatingInfo
    
    # POD availability
    has_pod: bool
    
    # Additional info
    distance_km: Optional[float] = None
    expected_vs_actual: Optional[str] = None  # "On time", "Early", "Late"
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def formatted_delivered_at(self) -> str:
        """Formatted delivery datetime"""
        return self.delivered_at.strftime("%Y-%m-%d %I:%M %p")
    
    @property
    def delivered_date(self) -> str:
        """Date only"""
        return self.delivered_at.strftime("%Y-%m-%d")
    
    @property
    def delivered_time(self) -> str:
        """Time only"""
        return self.delivered_at.strftime("%I:%M %p")
    
    @property
    def earnings_display(self) -> str:
        """Formatted earnings amount"""
        return f"₹{self.earnings.amount:.2f}"


class CompletedDeliveryDetail(CompletedDeliveryItem):
    """Detailed view of a completed delivery"""
    # Extended address info
    address_full: str
    
    # Order extended details
    subtotal: float
    discount_amount: float
    delivery_fee: float
    tax_amount: float
    coupon_code: Optional[str] = None
    
    # Delivery extended details
    assigned_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    expected_delivery_time: Optional[datetime] = None
    delivery_notes: Optional[str] = None
    distance_km: Optional[float] = None
    
    # POD details
    pod_info: PODInfo
    
    # Performance metrics
    delivery_duration_minutes: Optional[int] = None
    is_on_time: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def time_to_deliver(self) -> Optional[str]:
        """Time taken to deliver from assignment"""
        if self.assigned_at and self.delivered_at:
            delta = self.delivered_at - self.assigned_at
            minutes = delta.total_seconds() / 60
            if minutes < 60:
                return f"{int(minutes)} mins"
            else:
                hours = minutes / 60
                return f"{hours:.1f} hours"
        return None


class CompletedDeliveriesResponse(BaseModel):
    """Response for completed deliveries list"""
    success: bool = True
    message: str = "Completed deliveries retrieved successfully"
    data: List[CompletedDeliveryItem]
    pagination: Optional[Dict[str, Any]] = None
    filters: Optional[Dict[str, Any]] = None
    summary: Dict[str, Any]
    
    model_config = ConfigDict(from_attributes=True)


class CompletedDeliveryResponse(BaseModel):
    """Response for single completed delivery"""
    success: bool = True
    message: str = "Delivery details retrieved successfully"
    data: CompletedDeliveryDetail


class PODResponse(BaseModel):
    """Response for Proof of Delivery"""
    success: bool = True
    message: str = "POD retrieved successfully"
    data: PODInfo


class CompletedSummary(BaseModel):
    """Summary statistics for completed deliveries"""
    total_deliveries: int
    total_earnings: float
    average_rating: float
    on_time_rate: float
    completed_today: int
    earnings_today: float
    period_earnings: Optional[float] = None
    period_deliveries: Optional[int] = None


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None