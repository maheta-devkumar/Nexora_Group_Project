from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from decimal import Decimal

class ReportType(str, Enum):
    PRODUCT = "product"
    SALES = "sales"
    ORDER = "order"
    CUSTOMER = "customer"
    DELIVERY = "delivery"
    INVENTORY = "inventory"
    MARKETING = "marketing"
    ADMIN = "admin"

class ReportFormat(str, Enum):
    JSON = "json"
    CSV = "csv"
    PDF = "pdf"
    EXCEL = "excel"

class TimePeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"

class DateRange(BaseModel):
    start_date: date
    end_date: date

class ReportRequest(BaseModel):
    report_type: ReportType
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    format: ReportFormat = ReportFormat.JSON
    filters: Optional[Dict[str, Any]] = None

# ===== PRODUCT REPORTS =====

class ProductPerformance(BaseModel):
    variant_id: int
    product_name: str
    variant_name: Optional[str]
    category_name: Optional[str]
    brand_name: Optional[str]
    views: int
    wishlist_adds: int
    cart_adds: int
    purchases: int
    total_sold: int
    total_revenue: float
    conversion_rate: float
    stock_quantity: int

class TopSellingProduct(BaseModel):
    variant_id: int
    product_name: str
    variant_name: Optional[str]
    category_name: str
    brand_name: Optional[str]
    total_sold: int
    total_revenue: float
    stock_quantity: int

class ProductConversionRate(BaseModel):
    variant_id: int
    product_name: str
    views: int
    cart_adds: int
    purchases: int
    view_to_cart_rate: float
    cart_to_purchase_rate: float
    overall_conversion_rate: float

class LowStockAlert(BaseModel):
    variant_id: int
    product_name: str
    variant_name: Optional[str]
    current_stock: int
    threshold: int
    status: str

class ProductRatingDistribution(BaseModel):
    variant_id: int
    product_name: str
    average_rating: float
    total_reviews: int
    rating_1: int
    rating_2: int
    rating_3: int
    rating_4: int
    rating_5: int

class ProductSalesSummary(BaseModel):
    variant_id: int
    product_name: str
    category_name: str
    brand_name: Optional[str]
    quantity_sold: int
    revenue: float
    average_price: float

class ProductReviewDetail(BaseModel):
    review_id: int
    variant_id: int
    product_name: str
    user_name: str
    rating: int
    title: Optional[str]
    body: Optional[str]
    created_at: datetime | None
    helpful_votes: int

# ===== SALES REPORTS =====

class SalesReport(BaseModel):
    total_revenue: float
    total_orders: int
    total_items_sold: int
    average_order_value: float
    total_discount: float
    net_sales: float
    refund_amount: float

class SalesByCategory(BaseModel):
    category_id: int
    category_name: str
    revenue: float
    order_count: int
    item_count: int

class SalesByBrand(BaseModel):
    brand_id: int
    brand_name: str
    revenue: float
    order_count: int
    item_count: int

class DailySalesTrend(BaseModel):
    date: date
    revenue: float
    order_count: int
    item_count: int
    average_order_value: float

class OrderDetail(BaseModel):
    order_id: int
    order_date: datetime | None
    customer_name: str
    customer_email: str
    order_status: str
    payment_status: str
    subtotal: float
    discount: float
    delivery_fee: float
    tax: float
    total_amount: float
    items_count: int

class OrderStatusSummary(BaseModel):
    status: str
    count: int
    percentage: float
    total_amount: float

class ReturnSummary(BaseModel):
    total_returns: int
    returned_items: int
    refund_amount: float
    reasons: Dict[str, int]

class RefundSummary(BaseModel):
    total_refunds: int
    refund_amount: float
    pending_refunds: int
    pending_amount: float

class OrderItemDetail(BaseModel):
    order_id: int
    variant_id: int
    product_name: str
    variant_name: Optional[str]
    quantity: int
    unit_price: float
    discount_per_unit: Optional[float] = None
    total_price: float
    discount_per_unit: float

# ===== CUSTOMER REPORTS =====

class CustomerReport(BaseModel):
    total_customers: int
    active_customers: int
    new_customers: int
    returning_customers: int
    average_orders_per_customer: float
    average_spent_per_customer: float

class CustomerEngagement(BaseModel):
    user_id: int
    customer_name: str
    total_orders: int
    total_spent: float
    cart_items: int
    wishlist_items: int
    reviews_count: int
    last_login: Optional[datetime | None]

class CustomerFeedbackSummary(BaseModel):
    total_feedback: int
    complaints: int
    suggestions: int
    app_feedback: int
    delivery_feedback: int
    average_rating: float
    unresolved_count: int

class CustomerDetail(BaseModel):
    user_id: int
    username: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    registration_date: datetime | None
    last_login: Optional[datetime | None]
    total_orders: int
    total_spent: float
    is_active: bool

# ===== DELIVERY REPORTS =====

class DeliveryPerformance(BaseModel):
    total_deliveries: int
    completed_deliveries: int
    pending_deliveries: int
    delayed_deliveries: int
    failed_deliveries: int
    on_time_rate: float
    average_delivery_time: Optional[float]

class DeliveryPersonRanking(BaseModel):
    delivery_person_id: int
    delivery_person_name: str
    total_deliveries: int
    completed_deliveries: int
    delayed_deliveries: int
    failed_deliveries: int
    average_rating: float
    total_earnings: float

class DeliveryIssueSummary(BaseModel):
    total_issues: int
    resolved_issues: int
    pending_issues: int
    issue_types: Dict[str, int]
    priority_breakdown: Dict[str, int]

class DeliveryPersonDetail(BaseModel):
    delivery_person_id: int
    user_id: int
    user_name: str
    license_number: Optional[str]
    status: str
    rating: float
    joined_at: datetime | None
    total_deliveries: int
    total_earnings: float

class DeliveryRatingDetail(BaseModel):
    delivery_id: int
    delivery_person_id: int
    delivery_person_name: str
    order_id: int
    customer_name: str
    rating: Optional[int]
    feedback_type: Optional[str]
    feedback_date: Optional[datetime | None]

# ===== INVENTORY REPORTS =====

class InventoryStatus(BaseModel):
    variant_id: int
    product_name: str
    variant_name: Optional[str]
    category_name: str
    current_stock: int
    reserved_stock: int
    available_stock: int
    status: str

class StockMovement(BaseModel):
    movement_id: int
    variant_id: int
    product_name: str
    movement_type: str
    quantity: int
    unit_cost: Optional[float]
    reference_type: Optional[str]
    reference_id: Optional[int]
    moved_at: datetime | None
    remark: Optional[str]

class PurchaseSummary(BaseModel):
    purchase_id: int
    supplier_name: str
    invoice_number: Optional[str]
    total_cost: float
    total_quantity: int
    purchase_date: datetime | None
    status: str

class SupplierPerformance(BaseModel):
    supplier_id: int
    supplier_name: str
    company_name: str
    total_purchases: float
    total_quantity: int
    average_cost: float
    last_purchase_date: Optional[datetime | None]
    return_rate: float

# ===== MARKETING REPORTS =====

class CouponUsage(BaseModel):
    coupon_id: int
    coupon_code: str
    total_usage: int
    total_discount: float
    total_orders: int
    average_discount: float
    redemption_rate: float

class OfferPerformance(BaseModel):
    offer_id: int
    offer_title: str
    affected_products: int
    affected_orders: int
    total_discount: float
    revenue_influenced: float
    start_date: datetime | None
    end_date: datetime | None
    is_active: bool

class PromotionalSummary(BaseModel):
    total_coupons: int
    active_coupons: int
    total_offers: int
    active_offers: int
    total_discount_given: float
    orders_with_promotions: int

# ===== ADMIN REPORTS =====

class AdminActivity(BaseModel):
    log_id: int
    admin_id: int
    admin_name: str
    action: str
    entity_type: str
    entity_id: Optional[int]
    old_value: Optional[str]
    new_value: Optional[str]
    created_at: datetime | None
    ip_address: Optional[str]

class NotificationReport(BaseModel):
    notification_id: int
    user_id: int
    user_name: str
    title: str
    type: str
    is_read: bool
    created_at: datetime | None
    read_at: Optional[datetime | None]

# ===== RESPONSE SCHEMAS =====

class ReportResponse(BaseModel):
    success: bool
    report_type: ReportType
    generated_at: datetime | None
    data: Union[List[Any], Dict[str, Any]]
    summary: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

class ReportExportResponse(BaseModel):
    success: bool
    download_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    message: Optional[str] = None