from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from enum import Enum
from decimal import Decimal


# Enums
class EarningsPeriod(str, Enum):
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    CUSTOM = "custom"


class TransactionType(str, Enum):
    DELIVERY_FEE = "delivery_fee"
    PEAK_BONUS = "peak_bonus"
    DISTANCE_BONUS = "distance_bonus"
    RATING_BONUS = "rating_bonus"
    INCENTIVE = "incentive"
    PENALTY = "penalty"
    OTHER = "other"


class TransactionStatus(str, Enum):
    SETTLED = "SETTLED"
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    FAILED = "FAILED"


class PaymentMethod(str, Enum):
    BANK_TRANSFER = "BANK_TRANSFER"
    UPI = "UPI"
    CASH = "CASH"
    WALLET = "WALLET"


class StatementFormat(str, Enum):
    CSV = "csv"
    PDF = "pdf"
    EXCEL = "excel"


# Request Schemas
class DateFilterRequest(BaseModel):
    """Date range filter for earnings"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    period: Optional[EarningsPeriod] = None  # "today", "week", "month", "custom"


class ChartFilterRequest(BaseModel):
    """Filter for chart data"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    grouping: str = "daily"  # "daily", "weekly", "monthly"


class TransactionFilterRequest(BaseModel):
    """Filter for transactions"""
    date_filter: Optional[DateFilterRequest] = None
    type: Optional[TransactionType] = None
    status: Optional[TransactionStatus] = None
    page: int = 1
    per_page: int = 20


class StatementDownloadRequest(BaseModel):
    """Request for statement download"""
    start_date: date
    end_date: date
    format: StatementFormat = StatementFormat.CSV
    include_pending: bool = False


# Response Schemas
class EarningsOverview(BaseModel):
    """Earnings overview summary"""
    total_earnings: float = Field(description="Total earnings all time")
    today_earnings: float = Field(description="Earnings today")
    week_earnings: float = Field(description="Earnings this week")
    month_earnings: float = Field(description="Earnings this month")
    pending_settlement: float = Field(description="Amount pending settlement")
    settled_amount: float = Field(description="Amount already settled")
    last_settlement_date: Optional[date] = Field(None, description="Date of last settlement")
    next_payout_date: Optional[date] = Field(None, description="Next scheduled payout date")
    
    # Performance metrics
    today_deliveries: int = Field(0, description="Deliveries completed today")
    week_deliveries: int = Field(0, description="Deliveries this week")
    month_deliveries: int = Field(0, description="Deliveries this month")
    average_per_delivery: float = Field(0.0, description="Average earnings per delivery")


class EarningsBreakdown(BaseModel):
    """Breakdown of earnings by type"""
    delivery_fees: float = Field(0.0, description="Base delivery fees")
    peak_bonus: float = Field(0.0, description="Peak hour bonuses")
    distance_bonus: float = Field(0.0, description="Distance bonuses")
    rating_bonus: float = Field(0.0, description="Rating-based bonuses")
    incentives: float = Field(0.0, description="Other incentives")
    penalties: float = Field(0.0, description="Penalties/deductions")
    
    @property
    def total(self) -> float:
        """Total of all breakdown components"""
        return (
            self.delivery_fees + 
            self.peak_bonus + 
            self.distance_bonus + 
            self.rating_bonus + 
            self.incentives - 
            self.penalties
        )


class ChartDataPoint(BaseModel):
    """Single data point for earnings chart"""
    date: str  # Format: YYYY-MM-DD
    label: str  # Display label e.g., "Oct 20"
    amount: float
    deliveries: int = 0
    average_per_delivery: float = 0.0
    
    model_config = ConfigDict(from_attributes=True)


class ChartDataResponse(BaseModel):
    """Response with chart data"""
    period: str  # "daily", "weekly", "monthly"
    data_points: List[ChartDataPoint]
    total_amount: float
    total_deliveries: int
    start_date: date
    end_date: date
    
    model_config = ConfigDict(from_attributes=True)


class TransactionItem(BaseModel):
    """Single transaction item"""
    transaction_id: str  # Formatted ID e.g., "TXN-001234"
    reference_id: Optional[str] = None  # Delivery ID or order ID
    type: TransactionType
    description: str
    amount: float
    status: TransactionStatus
    transaction_date: datetime
    settled_date: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None
    bank_reference: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def formatted_date(self) -> str:
        """Formatted transaction date"""
        return self.transaction_date.strftime("%Y-%m-%d %I:%M %p")
    
    @property
    def amount_display(self) -> str:
        """Formatted amount with sign"""
        prefix = "+" if self.amount >= 0 else ""
        return f"{prefix}₹{abs(self.amount):.2f}"
    
    @property
    def is_credit(self) -> bool:
        """Check if transaction is credit (positive amount)"""
        return self.amount >= 0


class BankInfo(BaseModel):
    """Bank account information"""
    account_holder: str
    bank_name: str
    account_number_masked: str  # e.g., "••••••••5678"
    ifsc_code: str  # Full IFSC code (no masking)
    account_type: Optional[str] = None  # "Savings", "Current"
    branch_name: Optional[str] = None
    is_verified: bool = False
    verified_at: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def display_account_number(self) -> str:
        """Display formatted account number"""
        return f"Account ending in {self.account_number_masked[-4:]}"


class PayoutHistoryItem(BaseModel):
    """Single payout history item"""
    payout_id: str  # Formatted ID e.g., "PAY-001234"
    amount: float
    status: TransactionStatus
    payout_date: datetime
    settlement_date: Optional[datetime] = None
    transaction_count: int = 0
    bank_reference: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.BANK_TRANSFER
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def formatted_payout_date(self) -> str:
        """Formatted payout date"""
        return self.payout_date.strftime("%Y-%m-%d")


class StatementData(BaseModel):
    """Statement data for export"""
    start_date: date
    end_date: date
    generated_at: datetime
    delivery_person_id: int
    delivery_person_name: str
    overview: EarningsOverview
    transactions: List[TransactionItem]
    payouts: List[PayoutHistoryItem]
    bank_info: Optional[BankInfo] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def filename(self) -> str:
        """Generate filename for statement"""
        return f"earnings_statement_{self.start_date}_{self.end_date}.csv"


# Main Response Schemas
class EarningsOverviewResponse(BaseModel):
    """Response for earnings overview"""
    success: bool = True
    message: str = "Earnings overview retrieved successfully"
    overview: EarningsOverview
    breakdown: EarningsBreakdown
    period_comparison: Optional[Dict[str, Any]] = None


class ChartDataApiResponse(BaseModel):
    """API response for chart data"""
    success: bool = True
    message: str = "Chart data retrieved successfully"
    data: ChartDataResponse


class TransactionsResponse(BaseModel):
    """Response for transactions list"""
    success: bool = True
    message: str = "Transactions retrieved successfully"
    transactions: List[TransactionItem]
    pagination: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None


class BankInfoResponse(BaseModel):
    """Response for bank information"""
    success: bool = True
    message: str = "Bank information retrieved successfully"
    bank_info: BankInfo
    payout_schedule: Dict[str, Any] = Field(default_factory=dict)


class PayoutsResponse(BaseModel):
    """Response for payout history"""
    success: bool = True
    message: str = "Payout history retrieved successfully"
    payouts: List[PayoutHistoryItem]
    pagination: Optional[Dict[str, Any]] = None


class StatementResponse(BaseModel):
    """Response for statement download"""
    success: bool = True
    message: str = "Statement generated successfully"
    statement: StatementData
    download_url: Optional[str] = None  # If file is saved/stored
    content_type: str = "text/csv"
    filename: str


class EarningsSummaryResponse(BaseModel):
    """Comprehensive earnings summary"""
    success: bool = True
    message: str = "Earnings summary retrieved successfully"
    overview: EarningsOverview
    breakdown: Optional[EarningsBreakdown] = None
    chart_data: ChartDataResponse
    recent_transactions: List[TransactionItem]
    bank_info: Optional[BankInfo] = None


# Error Response
class EarningsErrorResponse(BaseModel):
    """Error response for earnings module"""
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None