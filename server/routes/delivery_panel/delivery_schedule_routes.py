# delivery_panel/schedule/delivery_schedule_routes.py
from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List
from datetime import date

# Import dependencies and controller
from config.dependencies import get_current_user, is_delivery_person
from controllers.delivery_panel.delivery_schedule_controller import DeliveryScheduleController
from schemas.delivery_panel.delivery_schedule_schema import (
    TodayShiftResponse, UpcomingShiftsResponse, ScheduleCalendarResponse,
    ScheduleListResponse, ScheduleSummaryResponse, WorkPreferencesResponse,
    ShiftDetailResponse, CompleteScheduleResponse, ShiftStatus,
    ScheduleErrorResponse
)
from models.user import User

# Create router
router = APIRouter(
    prefix="/api/v1/delivery_panel/schedule",
    tags=["Delivery Schedule"]
)


# ===== HEALTH CHECK =====
@router.get(
    "/health",
    summary="Health check for schedule module",
    responses={
        503: {"model": ScheduleErrorResponse}
    }
)
def health_check(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Health check endpoint to verify schedule module is working.
    """
    return controller.health_check(current_user)


# ===== TODAY'S SHIFT =====
@router.get(
    "/today",
    response_model=TodayShiftResponse,
    responses={
        500: {"model": ScheduleErrorResponse}
    },
    summary="Get today's shift"
)
def get_todays_shift(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get today's shift information for the delivery person.
    
    Returns:
    - Current shift details if assigned today
    - Shift status (active, assigned, completed)
    - Time tracking information
    - Next shift timing if applicable
    """
    return controller.get_todays_shift(current_user)


# ===== UPCOMING SHIFTS =====
@router.get(
    "/upcoming",
    response_model=UpcomingShiftsResponse,
    responses={
        400: {"model": ScheduleErrorResponse},
        500: {"model": ScheduleErrorResponse}
    },
    summary="Get upcoming shifts"
)
def get_upcoming_shifts(
    days_ahead: int = Query(
        30,
        ge=1,
        le=365,
        description="Number of days to look ahead for shifts (1-365)"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get upcoming shifts for the next N days.
    
    Returns:
    - List of upcoming shifts sorted by date
    - Next closest shift
    - Count of shifts in next week and month
    - Shift details including time, location, and estimated metrics
    """
    return controller.get_upcoming_shifts(current_user, days_ahead)


# ===== SCHEDULE CALENDAR =====
@router.get(
    "/calendar",
    response_model=ScheduleCalendarResponse,
    responses={
        400: {"model": ScheduleErrorResponse},
        500: {"model": ScheduleErrorResponse}
    },
    summary="Get schedule calendar for specific month"
)
def get_schedule_calendar(
    year: Optional[int] = Query(
        None,
        ge=2000,
        le=2100,
        description="Year for calendar (default: current year)"
    ),
    month: Optional[int] = Query(
        None,
        ge=1,
        le=12,
        description="Month for calendar (1-12, default: current month)"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get schedule organized as a calendar for a specific month.
    
    Returns:
    - Calendar weeks with days
    - Shift indicators for each day
    - Monthly statistics
    - Navigation for previous/next months
    """
    return controller.get_schedule_calendar(current_user, year, month)


# ===== SCHEDULE LIST =====
@router.get(
    "/list",
    response_model=ScheduleListResponse,
    responses={
        400: {"model": ScheduleErrorResponse},
        500: {"model": ScheduleErrorResponse}
    },
    summary="Get schedule as a filtered list"
)
def get_schedule_list(
    start_date: Optional[str] = Query(
        None,
        description="Start date for filtering (YYYY-MM-DD format)"
    ),
    end_date: Optional[str] = Query(
        None,
        description="End date for filtering (YYYY-MM-DD format)"
    ),
    status: Optional[str] = Query(
        None,
        description="Filter by status (comma-separated: assigned,active,completed,upcoming)"
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
        description="Number of items per page (1-100)"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get schedule as a list with filtering and pagination.
    
    Supports:
    - Date range filtering
    - Status filtering
    - Pagination
    
    Returns:
    - List of shift items
    - Pagination metadata
    - Applied filters
    """
    return controller.get_schedule_list(
        current_user, start_date, end_date, status, page, page_size
    )


# ===== SCHEDULE SUMMARY =====
@router.get(
    "/summary",
    response_model=ScheduleSummaryResponse,
    responses={
        500: {"model": ScheduleErrorResponse}
    },
    summary="Get schedule summary and statistics"
)
def get_schedule_summary(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get overall schedule summary and statistics.
    
    Returns:
    - Total, completed, upcoming, and cancelled shifts
    - This week/month shift counts
    - Average shift hours
    - Preferred working days
    """
    return controller.get_schedule_summary(current_user)


# ===== WORK PREFERENCES =====
@router.get(
    "/preferences",
    response_model=WorkPreferencesResponse,
    responses={
        500: {"model": ScheduleErrorResponse}
    },
    summary="Get work preferences"
)
def get_work_preferences(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get work preferences derived from delivery patterns.
    
    Returns:
    - Preferred working days
    - Preferred shift timings
    - Maximum hours/days preferences
    - Preferred delivery zones
    - Unavailable dates
    """
    return controller.get_work_preferences(current_user)

@router.get(
    "/shifts/next",
    summary="Get next shift only"
)
def get_next_shift(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get only the next upcoming shift.
    
    Returns minimal information about the next shift.
    Useful for notifications or quick views.
    """
    response = controller.get_upcoming_shifts(current_user, days_ahead=30)
    
    if response.next_shift:
        return {
            "has_next_shift": True,
            "date": response.next_shift.date,
            "day_name": response.next_shift.day_name,
            "time": response.next_shift.time,
            "days_until": response.next_shift.days_until,
            "location": response.next_shift.location.name
        }
    else:
        return {
            "has_next_shift": False,
            "message": "No upcoming shifts"
        }

# ===== SHIFT DETAILS =====
@router.get(
    "/shifts/{shift_date}",
    response_model=ShiftDetailResponse,
    responses={
        400: {"model": ScheduleErrorResponse},
        404: {"model": ScheduleErrorResponse},
        500: {"model": ScheduleErrorResponse}
    },
    summary="Get detailed information for a specific shift"
)
def get_shift_details(
    shift_date: str,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get detailed information for a specific shift date.
    
    Parameters:
    - shift_date: Date in YYYY-MM-DD format
    
    Returns:
    - Complete shift details
    - Delivery statistics
    - Earnings information
    - Time tracking data
    - Performance metrics (for completed shifts)
    - Related shifts in the same week
    """
    return controller.get_shift_details(current_user, shift_date)


# ===== COMPLETE SCHEDULE =====
@router.get(
    "/complete",
    response_model=CompleteScheduleResponse,
    responses={
        500: {"model": ScheduleErrorResponse}
    },
    summary="Get complete schedule data in one response"
)
def get_complete_schedule(
    include_preferences: bool = Query(
        True,
        description="Include work preferences in response"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get complete schedule data in a single response for efficiency.
    
    Combines:
    - Today's shift
    - Upcoming shifts
    - Calendar view
    - Schedule summary
    - Work preferences (optional)
    
    Use this endpoint when you need all schedule data at once.
    """
    return controller.get_complete_schedule(current_user, include_preferences)


# ===== MONTH SUMMARY =====
@router.get(
    "/month-summary",
    summary="Get summary for specific month",
    responses={
        400: {"model": ScheduleErrorResponse},
        500: {"model": ScheduleErrorResponse}
    }
)
def get_month_summary(
    year: Optional[int] = Query(
        None,
        ge=2000,
        le=2100,
        description="Year for summary (default: current year)"
    ),
    month: Optional[int] = Query(
        None,
        ge=1,
        le=12,
        description="Month for summary (1-12, default: current month)"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get summary statistics for a specific month.
    
    Returns:
    - Month name and period
    - Total, completed, and upcoming shifts
    - Total estimated earnings
    - Busiest day of the week
    - Days with shifts
    """
    return controller.get_month_summary(current_user, year, month)


# ===== WEEK SUMMARY =====
@router.get(
    "/week-summary",
    summary="Get summary for specific week",
    responses={
        400: {"model": ScheduleErrorResponse},
        500: {"model": ScheduleErrorResponse}
    }
)
def get_week_summary(
    start_date: Optional[str] = Query(
        None,
        description="Week start date (YYYY-MM-DD, default: current week)"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get summary statistics for a specific week.
    
    Returns:
    - Week start and end dates
    - Total shifts and hours
    - Total estimated earnings
    - Daily summaries for each day of the week
    """
    return controller.get_week_summary(current_user, start_date)


# ===== ALTERNATIVE ENDPOINTS (HTML-friendly) =====
@router.get(
    "/",
    response_model=CompleteScheduleResponse,
    include_in_schema=True,
    summary="Main schedule endpoint (returns complete data)"
)
def get_schedule_main(
    include_preferences: bool = Query(
        False,
        description="Include work preferences in response"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Main schedule endpoint - returns complete schedule data.
    
    This is the primary endpoint for the schedule page.
    Returns all schedule information needed for display.
    """
    return controller.get_complete_schedule(current_user, include_preferences)


@router.get(
    "/shifts/today/status",
    summary="Get today's shift status only"
)
def get_todays_shift_status(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Get only today's shift status (lightweight endpoint).
    
    Returns minimal information about today's shift status.
    Useful for quick status checks without full details.
    """
    response = controller.get_todays_shift(current_user)
    return {
        "has_shift": response.has_shift,
        "status": response.shift.status if response.shift else None,
        "is_current": response.shift.is_current if response.shift else None,
        "current_time": response.current_time
    }




# ===== STATUS ENUM VALUES =====
@router.get(
    "/status-values",
    summary="Get available shift status values"
)
def get_status_values():
    """
    Get all available shift status values.
    
    Returns the possible values for shift status filtering.
    """
    return {
        "status_values": [status.value for status in ShiftStatus],
        "descriptions": {
            "assigned": "Shift is assigned but not yet started",
            "active": "Shift is currently in progress",
            "completed": "Shift has been completed",
            "upcoming": "Shift is scheduled for the future",
            "cancelled": "Shift has been cancelled"
        }
    }


# ===== ERROR TEST ENDPOINT (for development) =====
@router.get(
    "/error-test",
    include_in_schema=False
)
def error_test():
    """
    Test endpoint for error responses (not included in production schema).
    """
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="This is a test error response for schedule module"
    )


# ===== ROOT SCHEDULE ENDPOINT ALIAS =====
@router.get(
    "",
    response_model=CompleteScheduleResponse,
    include_in_schema=False  # Already have / endpoint
)
def get_schedule_root(
    include_preferences: bool = Query(False),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryScheduleController = Depends()
):
    """
    Alias for the main schedule endpoint.
    """
    return controller.get_complete_schedule(current_user, include_preferences)