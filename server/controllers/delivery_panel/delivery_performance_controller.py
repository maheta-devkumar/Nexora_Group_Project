# delivery_panel/performance/delivery_performance_controller.py
from fastapi import HTTPException, status as http_status, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date, datetime

# Import dependencies, services, and schemas
from config.dependencies import get_db, get_current_user, is_delivery_person
from services.delivery_panel.delivery_performance_service import DeliveryPerformanceService
from schemas.delivery_panel.delivery_performance_schema import (
    PerformanceMetricsResponse, DateRangeFilter, PerformancePeriod,
    PerformanceChartsResponse, RatingHistoryResponse, BadgesResponse,
    TrendAnalysisResponse, ComparisonResponse, DeliveryRecordsResponse,
    PeriodSummaryResponse, MilestonesResponse, CompletePerformanceResponse,
    PerformanceErrorResponse
)
from models.user import User
from models.delivery.delivery_person import DeliveryPerson


class DeliveryPerformanceController:
    """Controller layer for performance endpoints"""
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryPerformanceService(db)
    
    # ===== HELPER METHODS =====
    
    def _get_delivery_person_id(self, current_user: User) -> int:
        """Get delivery person ID from user"""
        delivery_person = self.db.query(DeliveryPerson).filter(
            DeliveryPerson.user_id == current_user.user_id
        ).first()
        
        if not delivery_person:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="User is not a delivery person"
            )
        
        return delivery_person.delivery_person_id
    
    def _validate_date_range(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> DateRangeFilter:
        """Validate and create date range filter"""
        
        if start_date and end_date:
            if start_date > end_date:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Start date cannot be after end date"
                )
            
            # Check date range is reasonable (not more than 1 year)
            if (end_date - start_date).days > 365:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Date range cannot exceed 1 year"
                )
            
            return DateRangeFilter(
                period=PerformancePeriod.CUSTOM,
                start_date=start_date,
                end_date=end_date
            )
        
        return DateRangeFilter(period=PerformancePeriod.LAST_7_DAYS)
    
    # ===== PERFORMANCE METRICS =====
    
    def get_performance_metrics(
        self,
        current_user: User,
        period: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> PerformanceMetricsResponse:
        """Get performance metrics for delivery person"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Determine period filter
            if period:
                period_filter = DateRangeFilter(period=PerformancePeriod(period))
            else:
                period_filter = self._validate_date_range(start_date, end_date)
            
            return self.service.get_performance_metrics(
                delivery_person_id, period_filter
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get performance metrics: {str(e)}"
            )
    
    # ===== PERFORMANCE CHARTS =====
    
    def get_performance_charts(
        self,
        current_user: User,
        period: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        group_by: str = 'day'
    ) -> PerformanceChartsResponse:
        """Get chart data for performance visualization"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Validate group_by parameter
            if group_by not in ['day', 'week', 'month']:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="group_by must be 'day', 'week', or 'month'"
                )
            
            # Determine period filter
            if period:
                period_filter = DateRangeFilter(period=PerformancePeriod(period))
            else:
                period_filter = self._validate_date_range(start_date, end_date)
            
            return self.service.get_performance_charts(
                delivery_person_id, period_filter, group_by
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get performance charts: {str(e)}"
            )
    
    # ===== RATING HISTORY =====
    
    def get_rating_history(
        self,
        current_user: User,
        period: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 50,
        offset: int = 0
    ) -> RatingHistoryResponse:
        """Get detailed rating history"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Validate pagination parameters
            if limit < 1 or limit > 100:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Limit must be between 1 and 100"
                )
            if offset < 0:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Offset cannot be negative"
                )
            
            # Determine period filter
            if period:
                period_filter = DateRangeFilter(period=PerformancePeriod(period))
            else:
                period_filter = self._validate_date_range(start_date, end_date)
            
            return self.service.get_rating_history(
                delivery_person_id, period_filter, limit, offset
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get rating history: {str(e)}"
            )
    
    # ===== PERFORMANCE BADGES =====
    
    def get_performance_badges(
        self,
        current_user: User
    ) -> BadgesResponse:
        """Get earned performance badges"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_badges(delivery_person_id)
            
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get performance badges: {str(e)}"
            )
    
    # ===== TREND ANALYSIS =====
    
    def get_performance_trends(
        self,
        current_user: User
    ) -> TrendAnalysisResponse:
        """Analyze performance trends over time"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_performance_trends(delivery_person_id)
            
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get performance trends: {str(e)}"
            )
    
    # ===== PEER COMPARISON =====
    
    def get_peer_comparison(
        self,
        current_user: User,
        period: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> ComparisonResponse:
        """Compare performance with other delivery persons"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Determine period filter
            if period:
                period_filter = DateRangeFilter(period=PerformancePeriod(period))
            else:
                period_filter = self._validate_date_range(start_date, end_date)
            
            return self.service.get_peer_comparison(
                delivery_person_id, period_filter
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get peer comparison: {str(e)}"
            )
    
    # ===== DETAILED DELIVERY RECORDS =====
    
    def get_detailed_delivery_records(
        self,
        current_user: User,
        period: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> DeliveryRecordsResponse:
        """Get detailed delivery records for analysis"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Validate pagination parameters
            if page < 1:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Page must be at least 1"
                )
            if page_size < 1 or page_size > 100:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Page size must be between 1 and 100"
                )
            
            # Parse status filter
            status_filter = None
            if status:
                status_filter = [s.strip() for s in status.split(',')]
                # Validate status values
                valid_statuses = ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "FAILED"]
                for s in status_filter:
                    if s not in valid_statuses:
                        raise HTTPException(
                            status_code=http_status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid status: {s}"
                        )
            
            # Determine period filter
            if period:
                period_filter = DateRangeFilter(period=PerformancePeriod(period))
            else:
                period_filter = self._validate_date_range(start_date, end_date)
            
            return self.service.get_detailed_delivery_records(
                delivery_person_id, period_filter, status_filter, page, page_size
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            # Handle Pydantic validation errors specifically
            if "ValidationError" in str(type(e)):
                raise HTTPException(
                    status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Data validation error: {str(e)}"
                )
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get delivery records: {str(e)}"
            )
    
    # ===== PERIOD SUMMARY =====
    
    def get_period_summary(
        self,
        current_user: User,
        period_type: str = 'monthly',
        months: int = 6
    ) -> PeriodSummaryResponse:
        """Get performance summaries for multiple periods"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Validate parameters
            if period_type not in ['weekly', 'monthly']:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="period_type must be 'weekly' or 'monthly'"
                )
            if months < 1 or months > 24:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="months must be between 1 and 24"
                )
            
            return self.service.get_period_summary(
                delivery_person_id, period_type, months
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get period summary: {str(e)}"
            )
    
    # ===== ACHIEVEMENT MILESTONES =====
    
    def get_achievement_milestones(
        self,
        current_user: User
    ) -> MilestonesResponse:
        """Get achievement milestones"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_achievement_milestones(delivery_person_id)
            
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get achievement milestones: {str(e)}"
            )
    
    # ===== COMPLETE PERFORMANCE DATA =====
    
    def get_complete_performance_data(
        self,
        current_user: User,
        period: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> CompletePerformanceResponse:
        """Get complete performance data in one response"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Determine period filter
            if period:
                period_filter = DateRangeFilter(period=PerformancePeriod(period))
            else:
                period_filter = self._validate_date_range(start_date, end_date)
            
            return self.service.get_complete_performance_data(
                delivery_person_id, period_filter
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get complete performance data: {str(e)}"
            )
    
    # ===== HEALTH CHECK =====
    
    def health_check(
        self,
        current_user: User
    ) -> dict:
        """Health check for performance module"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Try to get basic metrics to verify everything works
            metrics = self.service.get_performance_metrics(
                delivery_person_id, DateRangeFilter(period=PerformancePeriod.LAST_7_DAYS)
            )
            
            return {
                "status": "healthy",
                "module": "delivery_performance",
                "user_id": current_user.user_id,
                "delivery_person_id": delivery_person_id,
                "data_available": metrics.metrics.total_deliveries > 0,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Performance module health check failed: {str(e)}"
            )