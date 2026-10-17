from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from repositories.delivery_panel.delivery_dashboard_repository import DeliveryDashboardRepository
from schemas.delivery_panel.delivery_dashboard_schema import (
    DashboardStats, ActiveDeliveriesResponse, DeliveryOrder,
    EarningsOverviewResponse, EarningsPeriod, TodayScheduleResponse,
    Shift, NextDelivery, NavigationResponse, PerformanceMetrics,
    DeliveryDashboardResponse, DeliveryStatus, QRVerifyRequest,
    IssueReportRequest, PODUploadRequest, StatusUpdateRequest
)
from datetime import datetime
import json

from models.delivery.delivery import Delivery
from models.order.order import Order

class DeliveryDashboardService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryDashboardRepository()
    
    # ===== DASHBOARD STATISTICS =====
    
    def get_dashboard_stats(self, delivery_person_id: int) -> DashboardStats:
        """Get dashboard statistics"""
        stats_data = self.repository.get_dashboard_stats(self.db, delivery_person_id)
        return DashboardStats(**stats_data)
    
    # ===== ACTIVE DELIVERIES =====
    
    def get_active_deliveries(self, delivery_person_id: int) -> ActiveDeliveriesResponse:
        """Get active deliveries"""
        orders_data = self.repository.get_active_deliveries(self.db, delivery_person_id)
        orders = [DeliveryOrder(**order) for order in orders_data]
        return ActiveDeliveriesResponse(active_orders=orders)
    
    # ===== EARNINGS OVERVIEW =====
    
    def get_earnings_overview(self, delivery_person_id: int) -> EarningsOverviewResponse:
        """Get earnings overview"""
        earnings_data = self.repository.get_earnings_overview(self.db, delivery_person_id)
        periods = [EarningsPeriod(**period) for period in earnings_data["periods"]]
        return EarningsOverviewResponse(
            periods=periods,
            pending_settlement=earnings_data["pending_settlement"]
        )
    
    # ===== TODAY'S SCHEDULE =====
    
    def get_today_schedule(self, delivery_person_id: int) -> TodayScheduleResponse:
        """Get today's schedule"""
        schedule_data = self.repository.get_today_schedule(self.db, delivery_person_id)
        
        shifts = [Shift(**shift) for shift in schedule_data["upcoming_shifts"]]
        next_delivery = NextDelivery(**schedule_data["next_delivery"])
        
        return TodayScheduleResponse(
            date=schedule_data["date"],
            upcoming_shifts=shifts,
            next_delivery=next_delivery
        )
    
    # ===== DELIVERY STATUS UPDATES =====
    
    def update_delivery_status(
        self, 
        delivery_person_id: int, 
        delivery_id: int, 
        request: StatusUpdateRequest
    ) -> DeliveryDashboardResponse:
        """Update delivery status"""
        success = self.repository.update_delivery_status(
            self.db, delivery_id, request.status, delivery_person_id, request.notes
        )
        
        if success:
            return DeliveryDashboardResponse(
                success=True,
                message=f"Delivery status updated to {request.status}"
            )
        else:
            return DeliveryDashboardResponse(
                success=False,
                message="Failed to update delivery status"
            )
    
    def mark_as_picked(self, delivery_person_id: int, order_id: int) -> DeliveryDashboardResponse:
        """Mark delivery as picked up"""
        # Find delivery ID from order ID
        delivery = self.db.query(Delivery).filter(
            Delivery.order_id == order_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return DeliveryDashboardResponse(
                success=False,
                message="Delivery not found"
            )
        
        success = self.repository.update_delivery_status(
            self.db, delivery.delivery_id, DeliveryStatus.PICKED_UP, delivery_person_id
        )
        
        if success:
            return DeliveryDashboardResponse(
                success=True,
                message="Delivery marked as picked up"
            )
        else:
            return DeliveryDashboardResponse(
                success=False,
                message="Failed to mark as picked up"
            )
    
    def mark_as_delivered(self, delivery_person_id: int, order_id: int) -> DeliveryDashboardResponse:
        """Mark delivery as delivered"""
        # Find delivery ID from order ID
        delivery = self.db.query(Delivery).filter(
            Delivery.order_id == order_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return DeliveryDashboardResponse(
                success=False,
                message="Delivery not found"
            )
        
        success = self.repository.update_delivery_status(
            self.db, delivery.delivery_id, DeliveryStatus.DELIVERED, delivery_person_id
        )
        
        if success:
            return DeliveryDashboardResponse(
                success=True,
                message="Delivery marked as delivered"
            )
        else:
            return DeliveryDashboardResponse(
                success=False,
                message="Failed to mark as delivered"
            )
    
    def update_delivery_progress(
        self, 
        delivery_person_id: int, 
        delivery_id: int, 
        progress: int
    ) -> DeliveryDashboardResponse:
        """Update delivery progress"""
        success = self.repository.update_delivery_progress(self.db, delivery_id, progress)
        
        if success:
            return DeliveryDashboardResponse(
                success=True,
                message=f"Delivery progress updated to {progress}%"
            )
        else:
            return DeliveryDashboardResponse(
                success=False,
                message="Failed to update delivery progress"
            )
    
    # ===== QUICK ACTIONS =====
    
    def verify_qr_code(
        self, 
        delivery_person_id: int, 
        request: QRVerifyRequest
    ) -> DeliveryDashboardResponse:
        """Verify QR code"""
        result = self.repository.verify_qr_code(
            self.db, request.qr_data, delivery_person_id
        )
        
        if result["valid"]:
            return DeliveryDashboardResponse(
                success=True,
                message=result["message"],
                data=result
            )
        else:
            return DeliveryDashboardResponse(
                success=False,
                message=result["message"]
            )
    
    def report_issue(
        self, 
        delivery_person_id: int, 
        request: IssueReportRequest
    ) -> DeliveryDashboardResponse:
        """Report delivery issue"""
        success = self.repository.report_issue(
            self.db, delivery_person_id, request.order_id, 
            request.issue_type, request.description, request.priority
        )
        
        if success:
            return DeliveryDashboardResponse(
                success=True,
                message="Issue reported successfully"
            )
        else:
            return DeliveryDashboardResponse(
                success=False,
                message="Failed to report issue"
            )
    
    def upload_pod(
        self, 
        delivery_person_id: int, 
        request: PODUploadRequest
    ) -> DeliveryDashboardResponse:
        """Upload Proof of Delivery"""
        success = self.repository.upload_pod(
            self.db, delivery_person_id, request.order_id, 
            request.image_url, request.signature_url, request.notes
        )
        
        if success:
            return DeliveryDashboardResponse(
                success=True,
                message="POD uploaded successfully"
            )
        else:
            return DeliveryDashboardResponse(
                success=False,
                message="Failed to upload POD"
            )
    
    # ===== NAVIGATION =====
    
    def get_navigation_details(
        self, 
        delivery_person_id: int, 
        order_id: int
    ) -> DeliveryDashboardResponse:
        """Get navigation details for delivery"""
        nav_data = self.repository.get_navigation_details(
            self.db, order_id, delivery_person_id
        )
        
        if nav_data:
            return DeliveryDashboardResponse(
                success=True,
                message="Navigation details retrieved",
                data=nav_data
            )
        else:
            return DeliveryDashboardResponse(
                success=False,
                message="Failed to get navigation details"
            )
    
    # ===== PERFORMANCE METRICS =====
    
    def get_performance_metrics(self, delivery_person_id: int) -> DeliveryDashboardResponse:
        """Get performance metrics"""
        metrics_data = self.repository.get_performance_metrics(self.db, delivery_person_id)
        metrics = PerformanceMetrics(**metrics_data)
        
        return DeliveryDashboardResponse(
            success=True,
            message="Performance metrics retrieved",
            data=metrics.dict()
        )
    
    # ===== INITIATE CALL (Logging) =====
    
    def initiate_call(
        self, 
        delivery_person_id: int, 
        order_id: int
    ) -> DeliveryDashboardResponse:
        """Log call initiation"""
        # In a real application, this would integrate with a telephony service
        # For now, we'll just log it
        
        # Get order details
        order = self.db.query(Order).filter(Order.order_id == order_id).first()
        if not order:
            return DeliveryDashboardResponse(
                success=False,
                message="Order not found"
            )
        
        # Log the call (you might want to create a call_logs table)
        call_log = {
            "delivery_person_id": delivery_person_id,
            "order_id": order_id,
            "customer_id": order.user_id,
            "timestamp": datetime.now().isoformat(),
            "action": "call_initiated"
        }
        
        # You might want to save this to a database table
        # For now, we'll just return success
        
        return DeliveryDashboardResponse(
            success=True,
            message="Call initiation logged",
            data=call_log
        )