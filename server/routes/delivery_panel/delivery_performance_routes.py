# delivery_panel/performance/delivery_performance_routes.py
from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List
from datetime import date

# Import dependencies and controller
from config.dependencies import get_current_user, is_delivery_person
from controllers.delivery_panel.delivery_performance_controller import DeliveryPerformanceController
from schemas.delivery_panel.delivery_performance_schema import (
    PerformanceMetricsResponse, PerformanceChartsResponse,
    RatingHistoryResponse, BadgesResponse, TrendAnalysisResponse,
    ComparisonResponse, DeliveryRecordsResponse, PeriodSummaryResponse,
    MilestonesResponse, CompletePerformanceResponse,
    PerformancePeriod, PerformanceErrorResponse
)
from models.user import User

# Create router
router = APIRouter(
    prefix="/api/v1/delivery_panel/performance",
    tags=["Delivery Performance"]
)


# ===== HEALTH CHECK =====
@router.get("/health", summary="Health check for performance module")
def health_check(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Health check endpoint to verify performance module is working.
    """
    return controller.health_check(current_user)


# ===== PERFORMANCE METRICS =====
@router.get(
    "/metrics",
    response_model=PerformanceMetricsResponse,
    responses={
        400: {"model": PerformanceErrorResponse},
        500: {"model": PerformanceErrorResponse}
    },
    summary="Get performance metrics"
)
def get_performance_metrics(
    period: Optional[PerformancePeriod] = Query(
        None,
        description="Time period for metrics (default: last_7_days)"
    ),
    start_date: Optional[date] = Query(
        None,
        description="Start date for custom range (format: YYYY-MM-DD)"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for custom range (format: YYYY-MM-DD)"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Get comprehensive performance metrics for the delivery person.
    
    Supports different time periods and custom date ranges.
    
    **Available periods:**
    - today: Today's metrics
    - last_7_days: Last 7 days (default)
    - last_30_days: Last 30 days
    - this_month: Current month to date
    - last_month: Previous full month
    - custom: Use start_date and end_date parameters
    """
    return controller.get_performance_metrics(
        current_user, period, start_date, end_date
    )


# ===== PERFORMANCE CHARTS =====
@router.get(
    "/charts",
    response_model=PerformanceChartsResponse,
    responses={
        400: {"model": PerformanceErrorResponse},
        500: {"model": PerformanceErrorResponse}
    },
    summary="Get performance chart data"
)
def get_performance_charts(
    period: Optional[PerformancePeriod] = Query(
        None,
        description="Time period for charts (default: last_7_days)"
    ),
    start_date: Optional[date] = Query(
        None,
        description="Start date for custom range"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for custom range"
    ),
    group_by: str = Query(
        'day',
        description="Group data by 'day', 'week', or 'month'",
        regex="^(day|week|month)$"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Get chart data for performance visualization.
    
    Returns time series data for:
    - Rating trend over time
    - Deliveries completed
    - On-time delivery rate
    - Earnings trend
    - Distance traveled
    
    Data is grouped by day, week, or month as specified.
    """
    return controller.get_performance_charts(
        current_user, period, start_date, end_date, group_by
    )


# ===== RATING HISTORY =====
@router.get(
    "/ratings",
    response_model=RatingHistoryResponse,
    responses={
        400: {"model": PerformanceErrorResponse},
        500: {"model": PerformanceErrorResponse}
    },
    summary="Get rating history and distribution"
)
def get_rating_history(
    period: Optional[PerformancePeriod] = Query(
        None,
        description="Time period for ratings"
    ),
    start_date: Optional[date] = Query(
        None,
        description="Start date for custom range"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for custom range"
    ),
    limit: int = Query(
        50,
        ge=1,
        le=100,
        description="Number of ratings to return (1-100)"
    ),
    offset: int = Query(
        0,
        ge=0,
        description="Number of ratings to skip for pagination"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Get detailed rating history with distribution.
    
    Returns:
    - List of individual ratings with customer details
    - Rating distribution (1-5 stars)
    - Average rating
    - Total number of ratings
    
    Supports pagination via limit and offset parameters.
    """
    return controller.get_rating_history(
        current_user, period, start_date, end_date, limit, offset
    )


# ===== PERFORMANCE BADGES =====
@router.get(
    "/badges",
    response_model=BadgesResponse,
    responses={
        500: {"model": PerformanceErrorResponse}
    },
    summary="Get earned performance badges"
)
def get_performance_badges(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Get performance badges earned by the delivery person.
    
    Badges are calculated dynamically based on:
    - Delivery milestones (10, 50, 100+ deliveries)
    - Rating achievements (4.0+, 4.5+, 5.0 stars)
    - Consistency badges (on-time streaks, no cancellations)
    - Speed badges (same-day deliveries, fast delivery times)
    - Earnings milestones
    
    Returns both earned badges and next achievable badges.
    """
    return controller.get_performance_badges(current_user)


# ===== TREND ANALYSIS =====
@router.get(
    "/trends",
    response_model=TrendAnalysisResponse,
    responses={
        500: {"model": PerformanceErrorResponse}
    },
    summary="Analyze performance trends"
)
def get_performance_trends(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Analyze performance trends over time.
    
    Compares current month's performance with previous month
    across key metrics:
    - On-time delivery rate
    - Average customer rating
    - Average delivery time
    - Number of deliveries completed
    - Total earnings
    
    Returns trend direction (improving/declining/stable) and insights.
    """
    return controller.get_performance_trends(current_user)


# ===== PEER COMPARISON =====
@router.get(
    "/comparison",
    response_model=ComparisonResponse,
    responses={
        400: {"model": PerformanceErrorResponse},
        500: {"model": PerformanceErrorResponse}
    },
    summary="Compare performance with peers"
)
def get_peer_comparison(
    period: Optional[PerformancePeriod] = Query(
        None,
        description="Time period for comparison"
    ),
    start_date: Optional[date] = Query(
        None,
        description="Start date for custom range"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for custom range"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Compare performance with other delivery persons.
    
    Shows how you rank against peers in:
    - On-time delivery rate (percentile)
    - Average rating (percentile)
    - Average delivery time (percentile - lower is better)
    - Deliveries completed (percentile)
    - Earnings (percentile)
    
    Returns percentile rankings and average peer values.
    """
    return controller.get_peer_comparison(
        current_user, period, start_date, end_date
    )


# ===== DETAILED DELIVERY RECORDS =====
@router.get(
    "/deliveries",
    response_model=DeliveryRecordsResponse,
    responses={
        400: {"model": PerformanceErrorResponse},
        500: {"model": PerformanceErrorResponse}
    },
    summary="Get detailed delivery records"
)
def get_detailed_delivery_records(
    period: Optional[PerformancePeriod] = Query(
        None,
        description="Time period for records"
    ),
    start_date: Optional[date] = Query(
        None,
        description="Start date for custom range"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for custom range"
    ),
    status: Optional[str] = Query(
        None,
        description="Filter by status (comma-separated: DELIVERED,CANCELLED,etc.)"
    ),
    page: int = Query(
        1,
        ge=1,
        description="Page number for pagination"
    ),
    page_size: int = Query(
        50,
        ge=1,
        le=100,
        description="Number of records per page (1-100)"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Get detailed delivery records for performance analysis.
    
    Each record includes:
    - Delivery and order details
    - Customer information
    - Delivery time and distance
    - On-time status
    - Earnings
    - Rating (if available)
    
    Supports filtering by status and pagination.
    """
    return controller.get_detailed_delivery_records(
        current_user, period, start_date, end_date, status, page, page_size
    )


# ===== PERIOD SUMMARY =====
@router.get(
    "/summary",
    response_model=PeriodSummaryResponse,
    responses={
        400: {"model": PerformanceErrorResponse},
        500: {"model": PerformanceErrorResponse}
    },
    summary="Get performance summaries for multiple periods"
)
def get_period_summary(
    period_type: str = Query(
        'monthly',
        description="Type of period: 'weekly' or 'monthly'",
        regex="^(weekly|monthly)$"
    ),
    months: int = Query(
        6,
        ge=1,
        le=24,
        description="Number of periods to include (1-24)"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Get performance summaries for multiple time periods.
    
    Useful for seeing performance trends over weeks or months.
    
    Each summary includes:
    - Total and completed deliveries
    - On-time delivery rate
    - Average rating
    - Total earnings
    - Average delivery time
    """
    return controller.get_period_summary(current_user, period_type, months)


# ===== ACHIEVEMENT MILESTONES =====
@router.get(
    "/milestones",
    response_model=MilestonesResponse,
    responses={
        500: {"model": PerformanceErrorResponse}
    },
    summary="Get achievement milestones"
)
def get_achievement_milestones(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Get achievement milestones and progress.
    
    Shows progress toward key milestones:
    - Delivery count milestones (50, 100 deliveries)
    - Rating milestones (4.5 stars)
    - Earnings milestones (₹10,000)
    - On-time rate milestones (90%)
    
    Returns current progress and next milestone to achieve.
    """
    return controller.get_achievement_milestones(current_user)


# ===== COMPLETE PERFORMANCE DATA =====
@router.get(
    "/complete",
    response_model=CompletePerformanceResponse,
    responses={
        400: {"model": PerformanceErrorResponse},
        500: {"model": PerformanceErrorResponse}
    },
    summary="Get complete performance data in one response"
)
def get_complete_performance_data(
    period: Optional[PerformancePeriod] = Query(
        None,
        description="Time period for data"
    ),
    start_date: Optional[date] = Query(
        None,
        description="Start date for custom range"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date for custom range"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Get complete performance data in a single response.
    
    Combines all performance endpoints into one for efficiency.
    Includes:
    - Performance metrics
    - Chart data
    - Earned badges
    - Rating history
    - Trend analysis
    - Peer comparison
    
    Use this endpoint when you need all data at once.
    """
    return controller.get_complete_performance_data(
        current_user, period, start_date, end_date
    )


# ===== METRICS BY CATEGORY (Alternative endpoints) =====
@router.get(
    "/metrics/on-time",
    summary="Get on-time delivery metrics specifically"
)
def get_on_time_metrics(
    period: Optional[PerformancePeriod] = Query(
        None,
        description="Time period for metrics"
    ),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Get specifically on-time delivery metrics.
    
    Returns detailed on-time performance data.
    """
    response = controller.get_performance_metrics(
        current_user, period, start_date, end_date
    )
    return {
        "on_time_deliveries": response.metrics.on_time_deliveries,
        "on_time_rate": response.metrics.on_time_rate,
        "total_deliveries": response.metrics.completed_deliveries,
        "period": response.period
    }


@router.get(
    "/metrics/ratings",
    summary="Get rating metrics specifically"
)
def get_rating_metrics(
    period: Optional[PerformancePeriod] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPerformanceController = Depends()
):
    """
    Get specifically rating-related metrics.
    
    Returns average rating and distribution.
    """
    response = controller.get_performance_metrics(
        current_user, period, start_date, end_date
    )
    rating_response = controller.get_rating_history(
        current_user, period, start_date, end_date, limit=5
    )
    
    return {
        "average_rating": response.metrics.average_rating,
        "total_ratings": response.metrics.total_rating_count,
        "rating_distribution": rating_response.distribution,
        "recent_ratings": rating_response.ratings[:5],
        "period": response.period
    }


# ===== ERROR HANDLER =====
@router.get("/error-test", include_in_schema=False)
def error_test():
    """
    Test endpoint for error responses (not included in schema).
    """
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="This is a test error response"
    )