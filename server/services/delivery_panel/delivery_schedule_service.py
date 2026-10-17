# delivery_panel/schedule/delivery_schedule_service.py
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date, time
from typing import List, Optional, Dict, Any
import calendar

# Import repository and schemas
from repositories.delivery_panel.delivery_schedule_repository import DeliveryScheduleRepository
from schemas.delivery_panel.delivery_schedule_schema import (
    TodayShiftResponse, ShiftItem, ShiftTime, ShiftLocation,
    UpcomingShiftsResponse, UpcomingShift,
    ScheduleCalendarResponse, CalendarWeek, CalendarDay,
    ScheduleListResponse, ScheduleSummary, ScheduleSummaryResponse,
    WorkPreference, WorkPreferencesResponse,
    ShiftDetail, ShiftDetailResponse, ShiftDetail as ShiftDetailSchema,
    CompleteScheduleResponse, ShiftStatus,
    ShiftFilters
)


class DeliveryScheduleService:
    """Service layer for schedule operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryScheduleRepository()
    
    # ===== TODAY'S SHIFT =====
    
    def get_todays_shift(
        self,
        delivery_person_id: int
    ) -> TodayShiftResponse:
        """Get today's shift with current status"""
        
        shift_data = self.repository.get_todays_shift(
            self.db, delivery_person_id
        )
        
        current_time = datetime.now()
        
        if not shift_data:
            # No shift today
            return TodayShiftResponse(
                has_shift=False,
                shift=None,
                current_time=current_time.strftime("%H:%M"),
                next_shift_start=None,
                time_until_shift=None
            )
        
        # Create shift item
        shift_item = ShiftItem(
            shift_id=shift_data["shift_id"],
            date=shift_data["date"],
            day_name=shift_data["day_name"],
            time=ShiftTime(**shift_data["time"]),
            location=ShiftLocation(**shift_data["location"]),
            status=ShiftStatus(shift_data["status"]),
            is_today=shift_data["is_today"],
            is_current=shift_data["is_current"],
            deliveries_assigned=shift_data["deliveries_assigned"],
            deliveries_completed=shift_data["deliveries_completed"],
            estimated_earnings=shift_data["estimated_earnings"]
        )
        
        # Calculate next shift start time if not currently active
        next_shift_start = None
        time_until_shift = None
        
        if shift_data["status"] != "active":
            # Parse shift start time
            shift_start_str = shift_data["time"]["start"]
            try:
                shift_start_hour, shift_start_minute = map(int, shift_start_str.split(":"))
                shift_start_time = current_time.replace(
                    hour=shift_start_hour,
                    minute=shift_start_minute,
                    second=0,
                    microsecond=0
                )
                
                next_shift_start = shift_start_str
                
                # Calculate time until shift
                if shift_start_time > current_time:
                    time_diff = shift_start_time - current_time
                    hours = time_diff.seconds // 3600
                    minutes = (time_diff.seconds % 3600) // 60
                    
                    if hours > 0:
                        time_until_shift = f"{hours} hours, {minutes} minutes"
                    else:
                        time_until_shift = f"{minutes} minutes"
                else:
                    time_until_shift = "Shift started"
            except:
                pass
        
        return TodayShiftResponse(
            has_shift=True,
            shift=shift_item,
            current_time=current_time.strftime("%H:%M"),
            next_shift_start=next_shift_start,
            time_until_shift=time_until_shift
        )
    
    # ===== UPCOMING SHIFTS =====
    
    def get_upcoming_shifts(
        self,
        delivery_person_id: int,
        days_ahead: int = 30
    ) -> UpcomingShiftsResponse:
        """Get upcoming shifts for next N days"""
        
        shifts_data = self.repository.get_upcoming_shifts(
            self.db, delivery_person_id, days_ahead
        )
        
        # Convert to UpcomingShift objects
        upcoming_shifts = []
        for shift in shifts_data:
            upcoming_shift = UpcomingShift(
                shift_id=shift["shift_id"],
                date=shift["date"],
                day_name=shift["day_name"],
                time=ShiftTime(**shift["time"]),
                location=ShiftLocation(**shift["location"]),
                status=ShiftStatus(shift["status"]),
                days_until=shift["days_until"],
                estimated_deliveries=shift["estimated_deliveries"],
                estimated_earnings=shift["estimated_earnings"],
                notes=shift.get("notes")
            )
            upcoming_shifts.append(upcoming_shift)
        
        # Sort by date (closest first)
        upcoming_shifts.sort(key=lambda x: x.date)
        
        # Get next shift (closest upcoming)
        next_shift = upcoming_shifts[0] if upcoming_shifts else None
        
        # Count shifts in next week and month
        today = date.today()
        next_week_end = today + timedelta(days=7)
        next_month_end = today + timedelta(days=30)
        
        next_week_shifts = len([s for s in upcoming_shifts if s.date <= next_week_end])
        next_month_shifts = len([s for s in upcoming_shifts if s.date <= next_month_end])
        
        return UpcomingShiftsResponse(
            upcoming_shifts=upcoming_shifts,
            total_upcoming=len(upcoming_shifts),
            next_shift=next_shift,
            next_week_shifts=next_week_shifts,
            next_month_shifts=next_month_shifts
        )
    
    # ===== ALL SHIFTS (CALENDAR VIEW) =====
    
    def get_schedule_calendar(
        self,
        delivery_person_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> ScheduleCalendarResponse:
        """Get schedule calendar for specific month"""
        
        # Use current month if not specified
        today = date.today()
        if not year:
            year = today.year
        if not month:
            month = today.month
        
        # Get calendar data from repository
        calendar_data = self.repository.get_calendar_data(
            self.db, delivery_person_id, year, month
        )
        
        # Convert weeks data
        weeks = []
        for week_data in calendar_data["weeks"]:
            days = []
            for day_data in week_data["days"]:
                # Convert shifts in each day
                day_shifts = []
                for shift_data in day_data["shifts"]:
                    shift_item = ShiftItem(
                        shift_id=shift_data["shift_id"],
                        date=shift_data["date"],
                        day_name=shift_data["day_name"],
                        time=ShiftTime(**shift_data["time"]),
                        location=ShiftLocation(**shift_data["location"]),
                        status=ShiftStatus(shift_data["status"]),
                        is_today=shift_data["is_today"],
                        is_current=shift_data["is_current"],
                        deliveries_assigned=shift_data["deliveries_assigned"],
                        deliveries_completed=shift_data["deliveries_completed"],
                        estimated_earnings=shift_data["estimated_earnings"]
                    )
                    day_shifts.append(shift_item)
                
                day = CalendarDay(
                    date=day_data["date"],
                    day_name=day_data["day_name"],
                    day_number=day_data["day_number"],
                    has_shift=day_data["has_shift"],
                    shift_count=day_data["shift_count"],
                    shifts=day_shifts
                )
                days.append(day)
            
            week = CalendarWeek(
                week_number=week_data["week_number"],
                start_date=week_data["start_date"],
                end_date=week_data["end_date"],
                days=days
            )
            weeks.append(week)
        
        return ScheduleCalendarResponse(
            current_month=calendar_data["current_month"],
            weeks=weeks,
            total_shifts=calendar_data["total_shifts"],
            completed_shifts=calendar_data["completed_shifts"],
            upcoming_shifts=calendar_data["upcoming_shifts"],
            previous_month=calendar_data.get("previous_month"),
            next_month=calendar_data.get("next_month")
        )
    
    # ===== ALL SHIFTS (LIST VIEW) =====
    
    def get_schedule_list(
        self,
        delivery_person_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status_filter: Optional[List[ShiftStatus]] = None,
        page: int = 1,
        page_size: int = 50
    ) -> ScheduleListResponse:
        """Get schedule as a list with pagination"""
        
        # Convert status filter to strings if provided
        status_strings = None
        if status_filter:
            status_strings = [s.value for s in status_filter]
        
        # Get all shifts
        shifts_data = self.repository.get_all_shifts(
            self.db, delivery_person_id, start_date, end_date, True
        )
        
        # Apply status filter if provided
        if status_strings:
            shifts_data = [s for s in shifts_data if s["status"] in status_strings]
        
        # Calculate pagination
        total_shifts = len(shifts_data)
        total_pages = (total_shifts + page_size - 1) // page_size if page_size > 0 else 1
        
        # Ensure page is within bounds
        if page < 1:
            page = 1
        elif page > total_pages:
            page = total_pages
        
        # Apply pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_data = shifts_data[start_idx:end_idx]
        
        # Convert to ShiftItem objects
        shifts = []
        for shift_data in paginated_data:
            shift_item = ShiftItem(
                shift_id=shift_data["shift_id"],
                date=shift_data["date"],
                day_name=shift_data["day_name"],
                time=ShiftTime(**shift_data["time"]),
                location=ShiftLocation(**shift_data["location"]),
                status=ShiftStatus(shift_data["status"]),
                is_today=shift_data["is_today"],
                is_current=shift_data["is_current"],
                deliveries_assigned=shift_data["deliveries_assigned"],
                deliveries_completed=shift_data["deliveries_completed"],
                estimated_earnings=shift_data["estimated_earnings"]
            )
            shifts.append(shift_item)
        
        # Format date filter for response
        date_filter_str = None
        if start_date and end_date:
            date_filter_str = f"{start_date} to {end_date}"
        elif start_date:
            date_filter_str = f"From {start_date}"
        elif end_date:
            date_filter_str = f"Until {end_date}"
        
        return ScheduleListResponse(
            shifts=shifts,
            total_shifts=total_shifts,
            current_page=page,
            total_pages=total_pages,
            items_per_page=page_size,
            date_filter=date_filter_str,
            status_filter=status_filter
        )
    
    # ===== SCHEDULE SUMMARY =====
    
    def get_schedule_summary(
        self,
        delivery_person_id: int
    ) -> ScheduleSummaryResponse:
        """Get overall schedule summary"""
        
        summary_data = self.repository.get_schedule_summary(
            self.db, delivery_person_id
        )
        
        summary = ScheduleSummary(
            total_assigned_shifts=summary_data["total_assigned_shifts"],
            completed_shifts=summary_data["completed_shifts"],
            upcoming_shifts=summary_data["upcoming_shifts"],
            cancelled_shifts=summary_data["cancelled_shifts"],
            this_week_shifts=summary_data["this_week_shifts"],
            next_week_shifts=summary_data["next_week_shifts"],
            this_month_shifts=summary_data["this_month_shifts"],
            average_shift_hours=summary_data["average_shift_hours"],
            preferred_working_days=summary_data["preferred_working_days"]
        )
        
        return ScheduleSummaryResponse(
            summary=summary,
            last_updated=datetime.now()
        )
    
    # ===== WORK PREFERENCES =====
    
    def get_work_preferences(
        self,
        delivery_person_id: int
    ) -> WorkPreferencesResponse:
        """Get work preferences"""
        
        preferences_data = self.repository.get_work_preferences(
            self.db, delivery_person_id
        )
        
        preferences = WorkPreference(
            preferred_days=preferences_data["preferred_days"],
            preferred_start_time=preferences_data["preferred_start_time"],
            preferred_end_time=preferences_data["preferred_end_time"],
            max_hours_per_day=preferences_data["max_hours_per_day"],
            max_days_per_week=preferences_data["max_days_per_week"],
            preferred_zones=preferences_data["preferred_zones"],
            unavailable_dates=preferences_data["unavailable_dates"]
        )
        
        return WorkPreferencesResponse(
            preferences=preferences,
            last_updated=preferences_data.get("last_updated")
        )
    
    # ===== SHIFT DETAILS =====
    
    def get_shift_details(
        self,
        delivery_person_id: int,
        shift_date: date
    ) -> ShiftDetailResponse:
        """Get detailed information for a specific shift"""
        
        shift_data = self.repository.get_shift_details(
            self.db, delivery_person_id, shift_date
        )
        
        if not shift_data:
            # Return empty response
            return ShiftDetailResponse(
                shift=None,
                related_shifts=[]
            )
        
        # Create ShiftDetail object
        shift_detail = ShiftDetail(
            shift_id=shift_data["shift_id"],
            date=shift_date,
            time=ShiftTime(**shift_data["time"]),
            location=ShiftLocation(**shift_data["location"]),
            status=ShiftStatus(shift_data["status"]),
            assigned_at=shift_data["assigned_at"],
            deliveries_assigned=shift_data["deliveries_assigned"],
            deliveries_completed=shift_data["deliveries_completed"],
            deliveries_pending=shift_data["deliveries_pending"],
            base_pay=shift_data["base_pay"],
            estimated_earnings=shift_data["estimated_earnings"],
            actual_earnings=shift_data["actual_earnings"],
            clock_in_time=shift_data["clock_in_time"],
            clock_out_time=shift_data["clock_out_time"],
            total_hours=shift_data["total_hours"],
            break_duration=shift_data["break_duration"],
            on_time_deliveries=shift_data["on_time_deliveries"],
            customer_rating=shift_data["customer_rating"]
        )
        
        # Get related shifts (same week)
        week_start = shift_date - timedelta(days=shift_date.weekday())
        week_end = week_start + timedelta(days=6)
        
        related_shifts_data = self.repository.get_all_shifts(
            self.db, delivery_person_id, week_start, week_end, True
        )
        
        # Filter out the current shift
        related_shifts_data = [s for s in related_shifts_data 
                              if s["date"] != shift_date]
        
        # Convert to ShiftItem objects (limit to 3)
        related_shifts = []
        for shift in related_shifts_data[:3]:
            shift_item = ShiftItem(
                shift_id=shift["shift_id"],
                date=shift["date"],
                day_name=shift["day_name"],
                time=ShiftTime(**shift["time"]),
                location=ShiftLocation(**shift["location"]),
                status=ShiftStatus(shift["status"]),
                is_today=shift["is_today"],
                is_current=shift["is_current"],
                deliveries_assigned=shift["deliveries_assigned"],
                deliveries_completed=shift["deliveries_completed"],
                estimated_earnings=shift["estimated_earnings"]
            )
            related_shifts.append(shift_item)
        
        return ShiftDetailResponse(
            shift=shift_detail,
            related_shifts=related_shifts
        )
    
    # ===== COMPLETE SCHEDULE DATA =====
    
    def get_complete_schedule(
        self,
        delivery_person_id: int,
        include_preferences: bool = True
    ) -> CompleteScheduleResponse:
        """Get complete schedule data in one response"""
        
        # Get all components
        today_shift = self.get_todays_shift(delivery_person_id)
        upcoming_shifts = self.get_upcoming_shifts(delivery_person_id, 30)
        
        # Get current month calendar
        today = date.today()
        calendar_data = self.get_schedule_calendar(
            delivery_person_id, today.year, today.month
        )
        
        # Get summary
        summary_response = self.get_schedule_summary(delivery_person_id)
        summary = summary_response.summary
        
        # Get preferences if requested
        preferences = None
        if include_preferences:
            preferences_response = self.get_work_preferences(delivery_person_id)
            preferences = preferences_response.preferences
        
        return CompleteScheduleResponse(
            today_shift=today_shift,
            upcoming_shifts=upcoming_shifts,
            calendar=calendar_data,
            summary=summary,
            preferences=preferences
        )
    
    # ===== UTILITY METHODS =====
    
    def get_shift_status(
        self,
        shift_date: date,
        shift_start: datetime,
        shift_end: datetime
    ) -> ShiftStatus:
        """Determine shift status based on dates"""
        
        today = date.today()
        current_time = datetime.now()
        
        if shift_date < today:
            return ShiftStatus.COMPLETED
        
        if shift_date > today:
            return ShiftStatus.UPCOMING
        
        # Today's shift
        if current_time < shift_start:
            return ShiftStatus.ASSIGNED
        elif shift_start <= current_time <= shift_end:
            return ShiftStatus.ACTIVE
        else:
            return ShiftStatus.COMPLETED
    
    def format_time_until_shift(
        self,
        shift_date: date,
        shift_start_time: str
    ) -> Optional[str]:
        """Format time until shift starts"""
        
        try:
            today = date.today()
            current_time = datetime.now()
            
            # Parse shift start time
            hour, minute = map(int, shift_start_time.split(":"))
            shift_start = datetime.combine(shift_date, time(hour, minute))
            
            # Calculate difference
            if shift_start > current_time:
                time_diff = shift_start - current_time
                
                days = time_diff.days
                hours = time_diff.seconds // 3600
                minutes = (time_diff.seconds % 3600) // 60
                
                if days > 0:
                    return f"{days} days, {hours} hours"
                elif hours > 0:
                    return f"{hours} hours, {minutes} minutes"
                else:
                    return f"{minutes} minutes"
            else:
                return "Shift started"
                
        except:
            return None
    
    def get_month_summary(
        self,
        delivery_person_id: int,
        year: int,
        month: int
    ) -> Dict[str, Any]:
        """Get summary for specific month"""
        
        # Calculate date range
        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(year, month + 1, 1) - timedelta(days=1)
        
        # Get shifts for the month
        shifts = self.repository.get_all_shifts(
            self.db, delivery_person_id, month_start, month_end, True
        )
        
        # Calculate statistics
        total_shifts = len(shifts)
        completed_shifts = len([s for s in shifts if s["status"] == "completed"])
        upcoming_shifts = len([s for s in shifts if s["status"] in ["upcoming", "assigned", "active"]])
        
        # Calculate total earnings
        total_earnings = sum(s.get("estimated_earnings", 0) for s in shifts)
        
        # Calculate busiest day
        day_counts = {}
        for shift in shifts:
            day_name = shift["day_name"]
            day_counts[day_name] = day_counts.get(day_name, 0) + 1
        
        busiest_day = max(day_counts.items(), key=lambda x: x[1])[0] if day_counts else "No shifts"
        
        return {
            "month": month_start.strftime("%B %Y"),
            "total_shifts": total_shifts,
            "completed_shifts": completed_shifts,
            "upcoming_shifts": upcoming_shifts,
            "total_earnings": total_earnings,
            "busiest_day": busiest_day,
            "shift_days": list(day_counts.keys())
        }
    
    def get_week_summary(
        self,
        delivery_person_id: int,
        start_date: date
    ) -> Dict[str, Any]:
        """Get summary for specific week"""
        
        week_end = start_date + timedelta(days=6)
        
        # Get shifts for the week
        shifts = self.repository.get_all_shifts(
            self.db, delivery_person_id, start_date, week_end, True
        )
        
        # Organize by day
        shifts_by_day = {}
        for shift in shifts:
            day_name = shift["day_name"]
            if day_name not in shifts_by_day:
                shifts_by_day[day_name] = []
            shifts_by_day[day_name].append(shift)
        
        # Calculate daily summaries
        daily_summaries = []
        for day_name in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
            day_shifts = shifts_by_day.get(day_name, [])
            
            if day_shifts:
                # Find the day date
                day_date = day_shifts[0]["date"] if day_shifts else None
                
                summary = {
                    "day": day_name,
                    "date": day_date,
                    "shift_count": len(day_shifts),
                    "has_shift": True,
                    "start_time": day_shifts[0]["time"]["start"] if day_shifts else None,
                    "end_time": day_shifts[0]["time"]["end"] if day_shifts else None
                }
            else:
                summary = {
                    "day": day_name,
                    "date": None,
                    "shift_count": 0,
                    "has_shift": False,
                    "start_time": None,
                    "end_time": None
                }
            
            daily_summaries.append(summary)
        
        # Calculate totals
        total_shifts = len(shifts)
        total_hours = sum(8 for _ in shifts)  # Assume 8 hours per shift
        total_earnings = sum(s.get("estimated_earnings", 0) for s in shifts)
        
        return {
            "week_start": start_date.strftime("%Y-%m-%d"),
            "week_end": week_end.strftime("%Y-%m-%d"),
            "total_shifts": total_shifts,
            "total_hours": total_hours,
            "total_earnings": total_earnings,
            "daily_summaries": daily_summaries
        }