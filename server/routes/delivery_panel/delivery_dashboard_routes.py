from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional
from config.dependencies import get_current_user, is_delivery_person
from controllers.delivery_panel.delivery_dashboard_controller import DeliveryDashboardController
from schemas.delivery_panel.delivery_dashboard_schema import (
    DashboardStats, ActiveDeliveriesResponse, EarningsOverviewResponse,
    TodayScheduleResponse, DeliveryDashboardResponse, QRVerifyRequest,
    IssueReportRequest, PODUploadRequest, StatusUpdateRequest
)
from models.user import User

router = APIRouter(prefix="/api/v1/delivery_panel/delivery_dashboard", tags=["Delivery Dashboard"])


# ===== DASHBOARD ENDPOINTS =====

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Get dashboard statistics for delivery person
    """
    return controller.get_dashboard_stats(current_user)


@router.get("/deliveries/active", response_model=ActiveDeliveriesResponse)
def get_active_deliveries(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Get active deliveries for delivery person
    """
    return controller.get_active_deliveries(current_user)


@router.get("/earnings/overview", response_model=EarningsOverviewResponse)
def get_earnings_overview(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Get earnings overview for different periods
    """
    return controller.get_earnings_overview(current_user)


@router.get("/schedule/today", response_model=TodayScheduleResponse)
def get_today_schedule(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Get today's schedule including shifts and next delivery
    """
    return controller.get_today_schedule(current_user)


# ===== DELIVERY STATUS UPDATES =====

@router.post("/deliveries/{delivery_id}/update-status", response_model=DeliveryDashboardResponse)
def update_delivery_status(
    delivery_id: int,
    request: StatusUpdateRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Update delivery status
    """
    return controller.update_delivery_status(delivery_id, request, current_user)


@router.post("/orders/{order_id}/mark-picked", response_model=DeliveryDashboardResponse)
def mark_as_picked(
    order_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Mark delivery as picked up
    """
    return controller.mark_as_picked(order_id, current_user)


@router.post("/orders/{order_id}/mark-delivered", response_model=DeliveryDashboardResponse)
def mark_as_delivered(
    order_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Mark delivery as delivered
    """
    return controller.mark_as_delivered(order_id, current_user)


@router.post("/deliveries/{delivery_id}/update-progress", response_model=DeliveryDashboardResponse)
def update_delivery_progress(
    delivery_id: int,
    progress: int = Query(..., ge=0, le=100, description="Progress percentage (0-100)"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Update delivery progress percentage
    """
    return controller.update_delivery_progress(delivery_id, progress, current_user)


# ===== QUICK ACTIONS =====

@router.post("/qr/verify", response_model=DeliveryDashboardResponse)
def verify_qr_code(
    request: QRVerifyRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Verify QR code for order pickup/delivery
    """
    return controller.verify_qr_code(request, current_user)


@router.post("/issues/report", response_model=DeliveryDashboardResponse)
def report_issue(
    request: IssueReportRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Report delivery issue
    """
    return controller.report_issue(request, current_user)


@router.post("/pod/upload", response_model=DeliveryDashboardResponse)
def upload_pod(
    request: PODUploadRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Upload Proof of Delivery (POD)
    """
    return controller.upload_pod(request, current_user)


# ===== UTILITY ENDPOINTS =====

@router.get("/orders/{order_id}/navigation", response_model=DeliveryDashboardResponse)
def get_navigation_details(
    order_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Get navigation details for delivery location
    """
    return controller.get_navigation_details(order_id, current_user)


@router.post("/orders/{order_id}/initiate-call", response_model=DeliveryDashboardResponse)
def initiate_call(
    order_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Initiate call to customer (logs the action)
    """
    return controller.initiate_call(order_id, current_user)


@router.get("/performance", response_model=DeliveryDashboardResponse)
def get_performance_metrics(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Get delivery person performance metrics
    """
    return controller.get_performance_metrics(current_user)


# ===== HEALTH CHECK =====

@router.get("/health")
def health_check(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryDashboardController = Depends()
):
    """
    Health check for delivery dashboard
    """
    try:
        # Try to get dashboard stats to verify everything works
        stats = controller.get_dashboard_stats(current_user)
        return {
            "status": "healthy",
            "message": "Delivery dashboard is working correctly",
            "user_id": current_user.user_id,
            "data_available": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Delivery dashboard health check failed: {str(e)}"
        )