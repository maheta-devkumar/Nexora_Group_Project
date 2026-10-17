from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from config.dependencies import get_db, get_current_user, is_delivery_person
from services.delivery_panel.delivery_dashboard_service import DeliveryDashboardService
from schemas.delivery_panel.delivery_dashboard_schema import (
    DashboardStats, ActiveDeliveriesResponse, EarningsOverviewResponse,
    TodayScheduleResponse, DeliveryDashboardResponse, NavigationResponse,
    PerformanceMetrics, QRVerifyRequest, IssueReportRequest, 
    PODUploadRequest, StatusUpdateRequest
)
from models.user import User
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery import Delivery

class DeliveryDashboardController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryDashboardService(db)
    
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
    
    # ===== DASHBOARD STATISTICS =====
    
    def get_dashboard_stats(self, current_user: User) -> DashboardStats:
        """Get dashboard statistics for delivery person"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_dashboard_stats(delivery_person_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get dashboard stats: {str(e)}"
            )
    
    # ===== ACTIVE DELIVERIES =====
    
    def get_active_deliveries(self, current_user: User) -> ActiveDeliveriesResponse:
        """Get active deliveries for delivery person"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_active_deliveries(delivery_person_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get active deliveries: {str(e)}"
            )
    
    # ===== EARNINGS OVERVIEW =====
    
    def get_earnings_overview(self, current_user: User) -> EarningsOverviewResponse:
        """Get earnings overview"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_earnings_overview(delivery_person_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get earnings overview: {str(e)}"
            )
    
    # ===== TODAY'S SCHEDULE =====
    
    def get_today_schedule(self, current_user: User) -> TodayScheduleResponse:
        """Get today's schedule"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_today_schedule(delivery_person_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get today's schedule: {str(e)}"
            )
    
    # ===== DELIVERY STATUS UPDATES =====
    
    def update_delivery_status(
        self, 
        delivery_id: int, 
        request: StatusUpdateRequest,
        current_user: User
    ) -> DeliveryDashboardResponse:
        """Update delivery status"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.update_delivery_status(
                delivery_person_id, delivery_id, request
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update delivery status: {str(e)}"
            )
    
    def mark_as_picked(self, order_id: int, current_user: User) -> DeliveryDashboardResponse:
        """Mark delivery as picked up"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.mark_as_picked(delivery_person_id, order_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to mark as picked: {str(e)}"
            )
    
    def mark_as_delivered(self, order_id: int, current_user: User) -> DeliveryDashboardResponse:
        """Mark delivery as delivered"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.mark_as_delivered(delivery_person_id, order_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to mark as delivered: {str(e)}"
            )
    
    def update_delivery_progress(
        self, 
        delivery_id: int, 
        progress: int,
        current_user: User
    ) -> DeliveryDashboardResponse:
        """Update delivery progress percentage"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.update_delivery_progress(
                delivery_person_id, delivery_id, progress
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update delivery progress: {str(e)}"
            )
    
    # ===== QUICK ACTIONS =====
    
    def verify_qr_code(
        self, 
        request: QRVerifyRequest,
        current_user: User
    ) -> DeliveryDashboardResponse:
        """Verify QR code"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.verify_qr_code(delivery_person_id, request)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to verify QR code: {str(e)}"
            )
    
    def report_issue(
        self, 
        request: IssueReportRequest,
        current_user: User
    ) -> DeliveryDashboardResponse:
        """Report delivery issue"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.report_issue(delivery_person_id, request)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to report issue: {str(e)}"
            )
    
    def upload_pod(
        self, 
        request: PODUploadRequest,
        current_user: User
    ) -> DeliveryDashboardResponse:
        """Upload Proof of Delivery"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.upload_pod(delivery_person_id, request)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload POD: {str(e)}"
            )
    
    # ===== NAVIGATION =====
    
    def get_navigation_details(
        self, 
        order_id: int,
        current_user: User
    ) -> DeliveryDashboardResponse:
        """Get navigation details for delivery"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_navigation_details(delivery_person_id, order_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get navigation details: {str(e)}"
            )
    
    # ===== PERFORMANCE METRICS =====
    
    def get_performance_metrics(self, current_user: User) -> DeliveryDashboardResponse:
        """Get performance metrics"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_performance_metrics(delivery_person_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get performance metrics: {str(e)}"
            )
    
    # ===== INITIATE CALL =====
    
    def initiate_call(
        self, 
        order_id: int,
        current_user: User
    ) -> DeliveryDashboardResponse:
        """Initiate call to customer"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.initiate_call(delivery_person_id, order_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to initiate call: {str(e)}"
            )