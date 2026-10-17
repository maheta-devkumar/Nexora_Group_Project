# schemas/delivery_reports_schema.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class ReportRange(str, Enum):
    OVERALL = "overall"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"

# Add to ReportFormat enum
class ReportFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    PDF = "pdf"
    
class DeliveryStatus(str, Enum):
    ASSIGNED = "ASSIGNED"
    PICKED_UP = "PICKED_UP"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


# Summary Card Schemas
class SummaryCard(BaseModel):
    title: str
    value: int
    subtitle: Optional[str] = None


class DeliverySummary(BaseModel):
    total_deliveries: int
    completed_deliveries: int
    pending_deliveries: int
    failed_deliveries: int
    cancelled_deliveries: int
    total_earnings: float
    average_delivery_time: Optional[float] = None  # in hours
    success_rate: float  # percentage


# Trend Data Schema
class TrendPoint(BaseModel):
    date: str  # Format: "YYYY-MM-DD" or "Week XX"
    deliveries: int
    earnings: float


class TrendData(BaseModel):
    labels: List[str]
    delivery_data: List[int]
    earnings_data: List[float]


# Period Breakdown Schema
class PeriodBreakdown(BaseModel):
    period: str  # "This Week", "Last Week", "2025-01", etc.
    period_start: datetime
    period_end: datetime
    total_orders: int
    completed: int
    failed: int
    cancelled: int
    earnings: float
    average_distance: Optional[float] = None


# Order-wise Report Schema
class OrderReportItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    order_id: int
    delivery_id: int
    customer_name: str
    delivery_date: datetime
    status: str
    distance_km: Optional[float] = None
    earning_amount: float
    delivery_time_minutes: Optional[int] = None
    address: Optional[str] = None


# Main Response Schema
class DeliveryReportsResponse(BaseModel):
    summary: DeliverySummary
    period_breakdown: List[PeriodBreakdown]
    trend: TrendData
    orders: List[OrderReportItem]
    filters_applied: Dict[str, Any]
    report_range: ReportRange
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None