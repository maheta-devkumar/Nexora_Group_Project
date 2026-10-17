from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from decimal import Decimal

class Period(str, Enum):
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    CUSTOM = "custom"

class DateRange(BaseModel):
    start_date: datetime
    end_date: datetime

# Sales Analytics
class SalesSummary(BaseModel):
    total_revenue: float
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    refunded_amount: float
    average_order_value: float
    revenue_growth: Optional[float] = None

class SalesTrend(BaseModel):
    period: str
    revenue: float
    orders: int
    date: datetime

# Product Analytics
class ProductPerformance(BaseModel):
    variant_id: int
    product_name: str
    variant_name: Optional[str]
    views: int
    cart_adds: int
    purchases: int
    conversion_rate: float
    revenue: float

class TopSellingProducts(BaseModel):
    variant_id: int
    product_name: str
    variant_name: Optional[str]
    total_sold: int
    total_revenue: float
    stock_quantity: int

# Customer Analytics
class CustomerInsights(BaseModel):
    total_customers: int
    new_customers: int
    returning_customers: int
    repeat_purchase_rate: float
    average_order_frequency: float
    top_customers: List[Dict[str, Any]]

class CustomerGrowth(BaseModel):
    period: str
    new_customers: int
    total_customers: int
    date: datetime

# Inventory Analytics
class InventoryStatus(BaseModel):
    variant_id: int
    product_name: str
    variant_name: Optional[str]
    current_stock: int
    status: str

# Search & Behavior Analytics
class SearchAnalytics(BaseModel):
    top_searches: List[Dict[str, Any]]
    total_searches: int
    no_result_searches: int
    search_success_rate: float

class UserBehavior(BaseModel):
    active_sessions: int
    device_breakdown: Dict[str, float]

# Admin Activity
class AdminActivityLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    log_id: int
    admin_id: int
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

# Dashboard Summary
class DashboardSummary(BaseModel):
    sales_summary: SalesSummary
    top_products: List[TopSellingProducts]
    customer_insights: CustomerInsights
    inventory_alerts: List[InventoryStatus]
    recent_activity: List[AdminActivityLogOut]

# Reports
class SalesReport(BaseModel):
    summary: SalesSummary
    trends: List[SalesTrend]
    period: Period
    date_range: Optional[DateRange] = None

class AnalyticsResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None