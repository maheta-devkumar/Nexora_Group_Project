from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

# Import dependencies
from config.dependencies import get_db, get_current_user, is_delivery_person

# Import service
from services.delivery_panel.delivery_completed_service import DeliveryCompletedService

# Import schemas
from schemas.delivery_panel.delivery_completed_schema import (
    CompletedDeliveriesResponse, CompletedDeliveryResponse, PODResponse,
    CompletedDeliveriesFilter, DateFilterRequest, PaginationRequest,
    DeliveryStatus, ErrorResponse
)

# Import models
from models.user import User
from models.delivery.delivery_person import DeliveryPerson


class DeliveryCompletedController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryCompletedService(db)
    
    # ===== HELPER METHOD =====
    
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
    
    # ===== COMPLETED DELIVERIES LIST =====
    
    def get_completed_deliveries(
        self,
        current_user: User,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: Optional[str] = None,
        status: Optional[DeliveryStatus] = None,
        min_earning: Optional[float] = None,
        max_earning: Optional[float] = None,
        page: int = 1,
        per_page: int = 20
    ) -> CompletedDeliveriesResponse:
        """Get completed deliveries with optional filters"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Build date filter
            date_filter = None
            if start_date or end_date or period:
                date_filter = DateFilterRequest(
                    start_date=start_date,
                    end_date=end_date,
                    period=period
                )
            
            # Build pagination
            pagination = PaginationRequest(
                page=page,
                per_page=per_page
            )
            
            # Build complete filters
            filters = CompletedDeliveriesFilter(
                date_filter=date_filter,
                pagination=pagination,
                status=status,
                min_earning=min_earning,
                max_earning=max_earning
            )
            
            return self.service.get_completed_deliveries(delivery_person_id, filters)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get completed deliveries: {str(e)}"
            )
    
    # ===== SINGLE COMPLETED DELIVERY =====
    
    def get_completed_delivery_detail(
        self,
        delivery_id: int,
        current_user: User
    ) -> CompletedDeliveryResponse:
        """Get detailed information for a specific completed delivery"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_completed_delivery_detail(delivery_person_id, delivery_id)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get delivery details: {str(e)}"
            )
    
    # ===== PROOF OF DELIVERY =====
    
    def get_proof_of_delivery(
        self,
        delivery_id: int,
        current_user: User
    ) -> PODResponse:
        """Get Proof of Delivery for a completed delivery"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_proof_of_delivery(delivery_person_id, delivery_id)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get Proof of Delivery: {str(e)}"
            )
    
    # ===== SUMMARY STATISTICS =====
    
    def get_summary_statistics(
        self,
        current_user: User,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get summary statistics for completed deliveries"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Build date filter
            date_filter = None
            if start_date or end_date or period:
                date_filter = DateFilterRequest(
                    start_date=start_date,
                    end_date=end_date,
                    period=period
                )
            
            return self.service.get_summary_statistics(delivery_person_id, date_filter)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get summary statistics: {str(e)}"
            )
    
    # ===== DATE FILTERED DELIVERIES =====
    
    def get_deliveries_by_date_range(
        self,
        current_user: User,
        start_date: str,
        end_date: str
    ) -> CompletedDeliveriesResponse:
        """Get completed deliveries within a date range"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            date_filter = DateFilterRequest(
                start_date=start_date,
                end_date=end_date
            )
            
            return self.service.apply_date_filters(delivery_person_id, date_filter)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get date-filtered deliveries: {str(e)}"
            )
    
    # ===== TODAY'S COMPLETED DELIVERIES =====
    
    def get_today_completed_deliveries(
        self,
        current_user: User
    ) -> CompletedDeliveriesResponse:
        """Get today's completed deliveries"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            date_filter = DateFilterRequest(
                period="today"
            )
            
            return self.service.apply_date_filters(delivery_person_id, date_filter)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get today's completed deliveries: {str(e)}"
            )
    
    # ===== THIS WEEK'S COMPLETED DELIVERIES =====
    
    def get_week_completed_deliveries(
        self,
        current_user: User
    ) -> CompletedDeliveriesResponse:
        """Get this week's completed deliveries"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            date_filter = DateFilterRequest(
                period="week"
            )
            
            return self.service.apply_date_filters(delivery_person_id, date_filter)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get week's completed deliveries: {str(e)}"
            )
    
    # ===== THIS MONTH'S COMPLETED DELIVERIES =====
    
    def get_month_completed_deliveries(
        self,
        current_user: User
    ) -> CompletedDeliveriesResponse:
        """Get this month's completed deliveries"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            date_filter = DateFilterRequest(
                period="month"
            )
            
            return self.service.apply_date_filters(delivery_person_id, date_filter)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get month's completed deliveries: {str(e)}"
            )