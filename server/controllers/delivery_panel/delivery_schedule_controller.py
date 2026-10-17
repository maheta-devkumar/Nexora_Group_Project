# delivery_panel/schedule/delivery_schedule_controller.py
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date, datetime, timedelta

# Import dependencies, services, and schemas
from config.dependencies import get_db, get_current_user, is_delivery_person
from services.delivery_panel.delivery_schedule_service import DeliveryScheduleService
from schemas.delivery_panel.delivery_schedule_schema import (
    TodayShiftResponse, UpcomingShiftsResponse, ScheduleCalendarResponse,
    ScheduleListResponse, ScheduleSummaryResponse, WorkPreferencesResponse,
    ShiftDetailResponse, CompleteScheduleResponse, ShiftStatus,
    DateRangeFilter
)
from models.user import User
from models.delivery.delivery_person import DeliveryPerson


class DeliveryScheduleController:
    """Controller layer for schedule endpoints"""
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryScheduleService(db)
    
    # ===== HELPER METHODS =====
    
    def _get_delivery_person_id(self, current_user: User) -> int:
        """Get delivery person ID from user"""
        delivery_person = self.db.query(DeliveryPerson).filter(
            DeliveryPerson.user_id == current_user.user_id
        ).first()
        
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a delivery person"
            )
        
        return delivery_person.delivery_person_id
    
    def _validate_date(self, date_str: Optional[str] = None) -> Optional[date]:
        """Validate and parse date string"""
        if not date_str:
            return None
        if date_str.lower() == "next":
            # Returns tomorrow's date as a starting point for "next"
            return date.today() + timedelta(days=1)
                
        try:
            return date.fromisoformat(date_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: {date_str}. Use YYYY-MM-DD format."
            )
    
    def _validate_year_month(
        self,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Tuple[int, int]:
        """Validate year and month parameters"""
        today = date.today()
        
        if year is None:
            year = today.year
        if month is None:
            month = today.month
        
        # Validate ranges
        if year < 2000 or year > 2100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Year must be between 2000 and 2100"
            )
        
        if month < 1 or month > 12:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Month must be between 1 and 12"
            )
        
        return year, month
    
    # ===== TODAY'S SHIFT =====
    
    def get_todays_shift(
        self,
        current_user: User
    ) -> TodayShiftResponse:
        """Get today's shift for delivery person"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_todays_shift(delivery_person_id)
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get today's shift: {str(e)}"
            )
    
    # ===== UPCOMING SHIFTS =====
    
    def get_upcoming_shifts(
        self,
        current_user: User,
        days_ahead: int = 30
    ) -> UpcomingShiftsResponse:
        """Get upcoming shifts for next N days"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Validate days_ahead parameter
            if days_ahead < 1 or days_ahead > 365:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="days_ahead must be between 1 and 365"
                )
            
            return self.service.get_upcoming_shifts(delivery_person_id, days_ahead)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get upcoming shifts: {str(e)}"
            )
    
    # ===== SCHEDULE CALENDAR =====
    
    def get_schedule_calendar(
        self,
        current_user: User,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> ScheduleCalendarResponse:
        """Get schedule calendar for specific month"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Validate year and month
            year, month = self._validate_year_month(year, month)
            
            return self.service.get_schedule_calendar(
                delivery_person_id, year, month
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get schedule calendar: {str(e)}"
            )
    
    # ===== SCHEDULE LIST =====
    
    def get_schedule_list(
        self,
        current_user: User,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> ScheduleListResponse:
        """Get schedule as a list with filtering and pagination"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Parse dates
            start_date_obj = self._validate_date(start_date)
            end_date_obj = self._validate_date(end_date)
            
            # Validate date range
            if start_date_obj and end_date_obj and start_date_obj > end_date_obj:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Start date cannot be after end date"
                )
            
            # Parse status filter
            status_filter = None
            if status:
                status_list = [s.strip() for s in status.split(',')]
                try:
                    status_filter = [ShiftStatus(s) for s in status_list]
                except ValueError as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid status value: {str(e)}"
                    )
            
            # Validate pagination parameters
            if page < 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Page must be at least 1"
                )
            
            if page_size < 1 or page_size > 100:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Page size must be between 1 and 100"
                )
            
            return self.service.get_schedule_list(
                delivery_person_id=delivery_person_id,
                start_date=start_date_obj,
                end_date=end_date_obj,
                status_filter=status_filter,
                page=page,
                page_size=page_size
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get schedule list: {str(e)}"
            )
    
    # ===== SCHEDULE SUMMARY =====
    
    def get_schedule_summary(
        self,
        current_user: User
    ) -> ScheduleSummaryResponse:
        """Get overall schedule summary"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_schedule_summary(delivery_person_id)
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get schedule summary: {str(e)}"
            )
    
    # ===== WORK PREFERENCES =====
    
    def get_work_preferences(
        self,
        current_user: User
    ) -> WorkPreferencesResponse:
        """Get work preferences for delivery person"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_work_preferences(delivery_person_id)
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get work preferences: {str(e)}"
            )
    
    # ===== SHIFT DETAILS =====
    
    def get_shift_details(
        self,
        current_user: User,
        shift_date: str
    ) -> ShiftDetailResponse:
        """Get detailed information for a specific shift date"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Parse and validate date
            try:
                shift_date_obj = date.fromisoformat(shift_date)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid date format: {shift_date}. Use YYYY-MM-DD format."
                )
            
            # Validate date is not in the future (beyond reasonable scheduling)
            today = date.today()
            max_future_date = today + timedelta(days=365)  # 1 year max
            
            if shift_date_obj > max_future_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Date cannot be more than 1 year in the future"
                )
            
            return self.service.get_shift_details(delivery_person_id, shift_date_obj)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get shift details: {str(e)}"
            )
    
    # ===== COMPLETE SCHEDULE =====
    
    def get_complete_schedule(
        self,
        current_user: User,
        include_preferences: bool = True
    ) -> CompleteScheduleResponse:
        """Get complete schedule data in one response"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_complete_schedule(
                delivery_person_id, include_preferences
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get complete schedule: {str(e)}"
            )
    
    # ===== MONTH SUMMARY =====
    
    def get_month_summary(
        self,
        current_user: User,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> dict:
        """Get summary for specific month"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Validate year and month
            year, month = self._validate_year_month(year, month)
            
            return self.service.get_month_summary(delivery_person_id, year, month)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get month summary: {str(e)}"
            )
    
    # ===== WEEK SUMMARY =====
    
    def get_week_summary(
        self,
        current_user: User,
        start_date: Optional[str] = None
    ) -> dict:
        """Get summary for specific week"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Parse start date or use current week
            if start_date:
                try:
                    start_date_obj = date.fromisoformat(start_date)
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid date format: {start_date}. Use YYYY-MM-DD format."
                    )
            else:
                # Default to current week
                today = date.today()
                start_date_obj = today - timedelta(days=today.weekday())
            
            return self.service.get_week_summary(delivery_person_id, start_date_obj)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get week summary: {str(e)}"
            )
    
    # ===== HEALTH CHECK =====
    
    def health_check(
        self,
        current_user: User
    ) -> dict:
        """Health check for schedule module"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Try to get today's shift to verify everything works
            today_shift = self.service.get_todays_shift(delivery_person_id)
            
            return {
                "status": "healthy",
                "module": "delivery_schedule",
                "user_id": current_user.user_id,
                "delivery_person_id": delivery_person_id,
                "has_today_shift": today_shift.has_shift,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Schedule module health check failed: {str(e)}"
            )