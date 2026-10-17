from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


# --- Basic item schemas ---
class OverviewSchema(BaseModel):
    totalRevenue: float = 0.0
    totalOrders: int = 0
    totalCustomers: int = 0
    totalProducts: int = 0
    revenueGrowth: float = 0.0
    ordersGrowth: float = 0.0
    customersGrowth: float = 0.0
    productsGrowth: float = 0.0


class SalesPoint(BaseModel):
    label: str
    value: float


class RevenuePoint(BaseModel):
    label: str
    value: float


class RecentOrderItem(BaseModel):
    order_id: int
    order_no: Optional[str] = None
    customer_name: Optional[str] = None
    total_amount: float
    order_status: Optional[str] = None
    placed_at: Optional[datetime] = None


class TopProductItem(BaseModel):
    product_id: int
    product_name: str
    sold: int
    revenue: Optional[float] = 0.0


class LowStockItem(BaseModel):
    variant_id: int
    variant_name: Optional[str] = None
    product_name: Optional[str] = None
    stock_quantity: int


class SystemAlertItem(BaseModel):
    id: int
    message: str
    created_at: Optional[datetime] = None
    severity: Optional[str] = "info"


class CategoryPerformanceItem(BaseModel):
    category_id: int
    category_name: str
    sales: float


class OrderStatusDistributionItem(BaseModel):
    status: str
    count: int


class CustomerStatsSchema(BaseModel):
    active_customers: int = 0
    new_customers: int = 0
    returning_customers: int = 0


class TrafficPoint(BaseModel):
    source: str
    sessions: int


class ReturnRatePoint(BaseModel):
    period: str
    return_rate: float


# --- Wrapper responses ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"
    data: Any


class OverviewWrapper(SuccessWrapper):
    data: OverviewSchema


class SalesWrapper(SuccessWrapper):
    data: List[SalesPoint]


class RevenueWrapper(SuccessWrapper):
    data: List[RevenuePoint]


class RecentOrdersWrapper(SuccessWrapper):
    data: List[RecentOrderItem]


class TopProductsWrapper(SuccessWrapper):
    data: List[TopProductItem]


class LowStockWrapper(SuccessWrapper):
    data: List[LowStockItem]


class SystemAlertsWrapper(SuccessWrapper):
    data: List[SystemAlertItem]


class CategoryPerformanceWrapper(SuccessWrapper):
    data: List[CategoryPerformanceItem]


class OrderStatusWrapper(SuccessWrapper):
    data: List[OrderStatusDistributionItem]


class CustomerStatsWrapper(SuccessWrapper):
    data: CustomerStatsSchema


class TrafficWrapper(SuccessWrapper):
    data: List[TrafficPoint]


class ReturnRateWrapper(SuccessWrapper):
    data: List[ReturnRatePoint]