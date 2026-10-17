# delivery_panel/performance/delivery_performance_schema.py
from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from decimal import Decimal


# ===== ENUMS =====
class PerformancePeriod(str, Enum):
    """Time periods for filtering performance data"""
    TODAY = "today"
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    THIS_MONTH = "this_month"
    LAST_MONTH = "last_month"
    CUSTOM = "custom"


class BadgeType(str, Enum):
    """Types of performance badges"""
    MILESTONE = "milestone"
    RATING = "rating"
    CONSISTENCY = "consistency"
    SPEED = "speed"
    EFFICIENCY = "efficiency"


class BadgeTier(str, Enum):
    """Badge quality tiers"""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


# ===== REQUEST SCHEMAS =====
class DateRangeFilter(BaseModel):
    """Request schema for date range filtering"""
    period: PerformancePeriod = PerformancePeriod.LAST_7_DAYS
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    model_config = ConfigDict(from_attributes=True)


# ===== METRICS SCHEMAS =====
class PerformanceMetrics(BaseModel):
    """Performance summary metrics"""
    total_deliveries: int = 0
    completed_deliveries: int = 0
    pending_deliveries: int = 0
    cancelled_deliveries: int = 0
    failed_deliveries: int = 0
    
    on_time_deliveries: int = 0
    on_time_rate: float = 0.0  # Percentage
    average_rating: float = 0.0
    total_rating_count: int = 0
    
    average_delivery_time: float = 0.0  # In minutes
    fastest_delivery_time: float = 0.0  # In minutes
    slowest_delivery_time: float = 0.0  # In minutes
    
    total_distance_km: float = 0.0
    average_distance_km: float = 0.0
    
    total_earnings: float = 0.0
    average_earnings_per_delivery: float = 0.0
    
    model_config = ConfigDict(from_attributes=True)


class PerformanceMetricsResponse(BaseModel):
    """Response with performance metrics"""
    metrics: PerformanceMetrics
    period: str
    date_range: Optional[Dict[str, date]] = None
    last_updated: datetime


# ===== CHART DATA SCHEMAS =====
class DataPoint(BaseModel):
    """Single data point for charts"""
    date: str  # Format: YYYY-MM-DD
    value: float
    label: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class TimeSeriesData(BaseModel):
    """Time series data for charts"""
    data_points: List[DataPoint]
    metric_name: str
    metric_label: str
    unit: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class PerformanceChartData(BaseModel):
    """Complete chart data for performance page"""
    rating_trend: TimeSeriesData
    deliveries_trend: TimeSeriesData
    on_time_trend: TimeSeriesData
    earnings_trend: TimeSeriesData
    distance_trend: TimeSeriesData
    
    model_config = ConfigDict(from_attributes=True)


class PerformanceChartsResponse(BaseModel):
    """Response with chart data"""
    charts: PerformanceChartData
    period: str
    date_range: Optional[Dict[str, date]] = None


# ===== RATING SCHEMAS =====
class CustomerRating(BaseModel):
    """Detailed customer rating"""
    order_id: int
    order_number: str
    customer_name: str
    rating: int
    review_text: Optional[str] = None
    review_date: datetime
    delivery_time_minutes: Optional[float] = None
    is_on_time: bool = True
    
    model_config = ConfigDict(from_attributes=True)


class RatingDistribution(BaseModel):
    """Distribution of ratings"""
    one_star: int = 0
    two_stars: int = 0
    three_stars: int = 0
    four_stars: int = 0
    five_stars: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class RatingHistoryResponse(BaseModel):
    """Response with rating history"""
    ratings: List[CustomerRating]
    distribution: RatingDistribution
    average_rating: float
    total_ratings: int
    period: str
    date_range: Optional[Dict[str, date]] = None


# ===== BADGE SCHEMAS =====
class BadgeRequirement(BaseModel):
    """Requirements to earn a badge"""
    metric: str
    threshold: float
    period: Optional[str] = None  # e.g., "30_days", "all_time"


class PerformanceBadge(BaseModel):
    """Performance badge earned by delivery person"""
    badge_id: str
    badge_type: BadgeType
    badge_tier: BadgeTier
    title: str
    description: str
    icon_key: str  # Lucide icon name
    earned_date: Optional[date] = None
    is_new: bool = False
    requirements: List[BadgeRequirement]
    progress: Optional[float] = None  # Current progress towards badge (0-1)
    is_earned: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class BadgesResponse(BaseModel):
    """Response with earned badges"""
    badges: List[PerformanceBadge]
    total_badges: int
    earned_badges: int
    next_badges: List[PerformanceBadge]  # Badges close to being earned


# ===== TREND ANALYSIS SCHEMAS =====
class PerformanceTrend(BaseModel):
    """Performance trend analysis"""
    trend_direction: str  # "improving", "declining", "stable"
    trend_percentage: float
    comparison_period: str
    metric: str
    insight: str
    
    model_config = ConfigDict(from_attributes=True)


class TrendAnalysisResponse(BaseModel):
    """Response with trend analysis"""
    trends: List[PerformanceTrend]
    overall_trend: str
    period: str
    date_range: Optional[Dict[str, date]] = None


# ===== COMPARISON SCHEMAS =====
class PeerComparison(BaseModel):
    """Comparison with peer delivery persons"""
    metric: str
    your_value: float
    average_value: float
    percentile: float  # 0-100
    rank: Optional[int] = None
    total_peers: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


class ComparisonResponse(BaseModel):
    """Response with peer comparison"""
    comparisons: List[PeerComparison]
    overall_percentile: float
    period: str


# ===== DETAILED DELIVERY RECORDS =====
class PerformanceDeliveryRecord(BaseModel):
    """Detailed delivery record for performance analysis"""
    delivery_id: int
    order_id: int
    order_number: str
    customer_name: str
    delivery_date: datetime
    status: str
    distance_km: float
    estimated_time_minutes: Optional[int] = None
    actual_time_minutes: Optional[float] = None
    is_on_time: bool = True
    earnings: float
    rating: Optional[int] = None
    feedback_type: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class DeliveryRecordsResponse(BaseModel):
    """Response with detailed delivery records"""
    deliveries: List[PerformanceDeliveryRecord]
    total_records: int
    period: str
    date_range: Optional[Dict[str, date]] = None
    page: int = 1
    total_pages: int = 1


# ===== WEEKLY/MONTHLY SUMMARY =====
class PeriodSummary(BaseModel):
    """Summary for a specific period"""
    period: str  # e.g., "2024-W01", "2024-01"
    total_deliveries: int
    completed_deliveries: int
    on_time_rate: float
    average_rating: float
    total_earnings: float
    average_delivery_time: float
    
    model_config = ConfigDict(from_attributes=True)


class PeriodSummaryResponse(BaseModel):
    """Response with period summaries"""
    summaries: List[PeriodSummary]
    period_type: str  # "weekly" or "monthly"
    date_range: Optional[Dict[str, date]] = None


# ===== ACHIEVEMENT MILESTONES =====
class AchievementMilestone(BaseModel):
    """Delivery achievement milestone"""
    milestone_id: str
    title: str
    description: str
    target_value: float
    current_value: float
    unit: str
    achieved_date: Optional[date] = None
    is_achieved: bool = False
    progress_percentage: float
    
    model_config = ConfigDict(from_attributes=True)


class MilestonesResponse(BaseModel):
    """Response with achievement milestones"""
    milestones: List[AchievementMilestone]
    next_milestone: Optional[AchievementMilestone] = None


# ===== COMPREHENSIVE PERFORMANCE RESPONSE =====
class CompletePerformanceResponse(BaseModel):
    """Complete performance data in one response"""
    metrics: PerformanceMetrics
    charts: PerformanceChartData
    badges: List[PerformanceBadge]
    ratings: RatingHistoryResponse
    trends: TrendAnalysisResponse
    comparison: ComparisonResponse
    period: str
    date_range: Optional[Dict[str, date]] = None
    last_updated: datetime


# ===== ERROR RESPONSE =====
class PerformanceErrorResponse(BaseModel):
    """Error response for performance endpoints"""
    error: bool = True
    message: str
    detail: Optional[str] = None
    code: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# ===== HELPER MODELS =====
class BadgeDefinition(BaseModel):
    """Definition of a badge for internal use"""
    badge_id: str
    badge_type: BadgeType
    badge_tier: BadgeTier
    title: str
    description: str
    icon_key: str
    requirements: List[BadgeRequirement]
    priority: int = 0  # For sorting
    
    model_config = ConfigDict(from_attributes=True)


class PerformanceFilters(BaseModel):
    """Internal filters for performance queries"""
    delivery_person_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    include_failed: bool = False
    min_rating: Optional[int] = None
    status_filter: Optional[List[str]] = None
    
    model_config = ConfigDict(from_attributes=True)