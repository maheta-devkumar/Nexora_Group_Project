# delivery_panel/schedule/delivery_schedule_schema.py
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime, time
from typing import List, Optional, Dict, Any
from enum import Enum


# ===== ENUMS =====
class ShiftStatus(str, Enum):
    """Shift status based on HTML"""
    ASSIGNED = "assigned"
    COMPLETED = "completed"
    UPCOMING = "upcoming"
    ACTIVE = "active"  # For today's current shift
    CANCELLED = "cancelled"


class DayOfWeek(str, Enum):
    """Days of the week"""
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"


# ===== BASE MODELS =====
class ShiftTime(BaseModel):
    """Time range for a shift"""
    start: str  # Format: "HH:MM" (e.g., "09:00")
    end: str    # Format: "HH:MM" (e.g., "18:00")
    
    model_config = ConfigDict(from_attributes=True)


class ShiftLocation(BaseModel):
    """Shift location information"""
    name: str
    address: Optional[str] = None
    zone: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None  # {lat: xx, lng: xx}
    
    model_config = ConfigDict(from_attributes=True)


# ===== SHIFT RESPONSES =====
class ShiftItem(BaseModel):
    """Individual shift item for schedule"""
    shift_id: int
    date: date
    day_name: str  # e.g., "Monday"
    time: ShiftTime
    location: ShiftLocation
    status: ShiftStatus
    is_today: bool = False
    is_current: bool = False  # Currently active shift
    
    # Delivery metrics for completed shifts
    deliveries_assigned: Optional[int] = 0
    deliveries_completed: Optional[int] = 0
    estimated_earnings: Optional[float] = 0.0
    
    model_config = ConfigDict(from_attributes=True)


class TodayShiftResponse(BaseModel):
    """Response for today's shift"""
    has_shift: bool
    shift: Optional[ShiftItem] = None
    current_time: str  # Current server time for reference
    
    # Today's schedule summary
    next_shift_start: Optional[str] = None  # Next shift start time if not currently active
    time_until_shift: Optional[str] = None  # e.g., "2 hours", "30 minutes"
    
    model_config = ConfigDict(from_attributes=True)


class UpcomingShift(BaseModel):
    """Upcoming shift with additional info"""
    shift_id: int
    date: date
    day_name: str
    time: ShiftTime
    location: ShiftLocation
    status: ShiftStatus
    days_until: int  # Days until this shift
    
    # Additional info for upcoming shifts
    estimated_deliveries: Optional[int] = 0
    estimated_earnings: Optional[float] = 0.0
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class UpcomingShiftsResponse(BaseModel):
    """Response for upcoming shifts"""
    upcoming_shifts: List[UpcomingShift]
    total_upcoming: int
    next_shift: Optional[UpcomingShift] = None
    
    # Summary
    next_week_shifts: int = 0
    next_month_shifts: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class CalendarDay(BaseModel):
    """Single day in calendar view"""
    date: date
    day_name: str
    day_number: int
    has_shift: bool
    shift_count: int = 0
    shifts: List[ShiftItem] = []
    
    model_config = ConfigDict(from_attributes=True)


class CalendarWeek(BaseModel):
    """Week in calendar view"""
    week_number: int
    start_date: date
    end_date: date
    days: List[CalendarDay]
    
    model_config = ConfigDict(from_attributes=True)


class ScheduleCalendarResponse(BaseModel):
    """Full schedule calendar response"""
    current_month: str  # e.g., "October 2025"
    weeks: List[CalendarWeek]
    total_shifts: int
    completed_shifts: int
    upcoming_shifts: int
    
    # Navigation
    previous_month: Optional[str] = None
    next_month: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ScheduleListResponse(BaseModel):
    """List view of schedule (alternative to calendar)"""
    shifts: List[ShiftItem]
    total_shifts: int
    current_page: int = 1
    total_pages: int = 1
    items_per_page: int = 50
    
    # Filters applied
    date_filter: Optional[str] = None
    status_filter: Optional[List[ShiftStatus]] = None
    
    model_config = ConfigDict(from_attributes=True)


# ===== SCHEDULE SUMMARY =====
class ScheduleSummary(BaseModel):
    """Overall schedule summary"""
    total_assigned_shifts: int
    completed_shifts: int
    upcoming_shifts: int
    cancelled_shifts: int
    
    # Time period stats
    this_week_shifts: int
    next_week_shifts: int
    this_month_shifts: int
    
    # Performance metrics
    average_shift_hours: float
    preferred_working_days: List[str]  # e.g., ["Monday", "Tuesday", "Friday"]
    
    model_config = ConfigDict(from_attributes=True)


class ScheduleSummaryResponse(BaseModel):
    """Response with schedule summary"""
    summary: ScheduleSummary
    last_updated: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ===== WORK PREFERENCES =====
class WorkPreference(BaseModel):
    """Work preference settings (read-only from HTML)"""
    preferred_days: List[str]  # e.g., ["Monday", "Tuesday", "Wednesday"]
    preferred_start_time: str  # e.g., "09:00"
    preferred_end_time: str    # e.g., "18:00"
    max_hours_per_day: int = 8
    max_days_per_week: int = 6
    preferred_zones: List[str] = []
    unavailable_dates: List[date] = []
    
    model_config = ConfigDict(from_attributes=True)


class WorkPreferencesResponse(BaseModel):
    """Response with work preferences"""
    preferences: WorkPreference
    last_updated: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ===== SHIFT DETAILS =====
class ShiftDetail(BaseModel):
    """Detailed shift information"""
    shift_id: int
    date: date
    time: ShiftTime
    location: ShiftLocation
    status: ShiftStatus
    
    # Assignment details
    assigned_at: datetime
    assigned_by: Optional[str] = None  # Admin/manager name
    assignment_notes: Optional[str] = None
    
    # Delivery details (for completed/active shifts)
    deliveries_assigned: int = 0
    deliveries_completed: int = 0
    deliveries_pending: int = 0
    
    # Earnings
    base_pay: float = 0.0
    estimated_earnings: float = 0.0
    actual_earnings: Optional[float] = None
    
    # Time tracking
    clock_in_time: Optional[datetime] = None
    clock_out_time: Optional[datetime] = None
    total_hours: Optional[float] = None
    break_duration: Optional[float] = None  # in minutes
    
    # Performance metrics
    on_time_deliveries: Optional[int] = None
    customer_rating: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class ShiftDetailResponse(BaseModel):
    """Response with shift details"""
    shift: ShiftDetail
    related_shifts: List[ShiftItem] = []  # Shifts on same day or nearby
    
    model_config = ConfigDict(from_attributes=True)


# ===== AVAILABILITY =====
class AvailabilitySlot(BaseModel):
    """Time slot availability"""
    day_of_week: str
    start_time: str
    end_time: str
    is_available: bool = True
    priority: int = 1  # 1=low, 2=medium, 3=high
    
    model_config = ConfigDict(from_attributes=True)


class AvailabilityResponse(BaseModel):
    """Response with availability information"""
    slots: List[AvailabilitySlot]
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ===== COMPREHENSIVE RESPONSE =====
class CompleteScheduleResponse(BaseModel):
    """Complete schedule data in one response"""
    today_shift: TodayShiftResponse
    upcoming_shifts: UpcomingShiftsResponse
    calendar: ScheduleCalendarResponse
    summary: ScheduleSummary
    preferences: Optional[WorkPreference] = None
    
    model_config = ConfigDict(from_attributes=True)


# ===== REQUEST SCHEMAS (if HTML has forms) =====
class DateRangeFilter(BaseModel):
    """Filter schedule by date range"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[List[ShiftStatus]] = None
    
    model_config = ConfigDict(from_attributes=True)


class AvailabilityUpdateRequest(BaseModel):
    """Update availability (if HTML has form)"""
    day_of_week: str
    start_time: str
    end_time: str
    is_available: bool = True
    
    model_config = ConfigDict(from_attributes=True)


# ===== ERROR RESPONSES =====
class ScheduleErrorResponse(BaseModel):
    """Error response for schedule endpoints"""
    error: bool = True
    message: str
    detail: Optional[str] = None
    code: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# ===== HELPER MODELS =====
class ShiftFilters(BaseModel):
    """Internal filters for shift queries"""
    delivery_person_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[List[str]] = None
    include_completed: bool = True
    include_upcoming: bool = True
    
    model_config = ConfigDict(from_attributes=True)