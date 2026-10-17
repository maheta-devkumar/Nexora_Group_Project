from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List, Dict, Any

# Import dependencies
from config.dependencies import get_current_user, is_delivery_person

# Import controller
from controllers.delivery_panel.delivery_completed_controller import DeliveryCompletedController

# Import schemas
from schemas.delivery_panel.delivery_completed_schema import (
    CompletedDeliveriesResponse, CompletedDeliveryResponse, PODResponse,
    DeliveryStatus
)

# Import models
from models.user import User

# Create router with prefix
router = APIRouter(prefix="/api/v1/delivery_panel", tags=["Delivery - Completed"])

# ===== ROUTES (IN SAFE ORDER) =====

# 1. STATIC ROUTES FIRST
@router.get("/completed", response_model=CompletedDeliveriesResponse)
def get_completed_deliveries(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    period: Optional[str] = Query(None, description="Period: today, week, month"),
    status: Optional[DeliveryStatus] = Query(None, description="Filter by status"),
    min_earning: Optional[float] = Query(None, ge=0, description="Minimum earnings"),
    max_earning: Optional[float] = Query(None, ge=0, description="Maximum earnings"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryCompletedController = Depends()
):
    """
    Get completed deliveries with optional filters
    
    - **start_date**: Filter deliveries from this date
    - **end_date**: Filter deliveries until this date
    - **period**: Quick filter for today, week, or month
    - **status**: Filter by delivery status
    - **min_earning**: Minimum earnings amount
    - **max_earning**: Maximum earnings amount
    - **page**: Page number for pagination
    - **per_page**: Number of items per page
    """
    return controller.get_completed_deliveries(
        current_user,
        start_date,
        end_date,
        period,
        status,
        min_earning,
        max_earning,
        page,
        per_page
    )


@router.get("/completed/summary", response_model=Dict[str, Any])
def get_summary_statistics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    period: Optional[str] = Query(None, description="Period: today, week, month"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryCompletedController = Depends()
):
    """
    Get summary statistics for completed deliveries
    
    - **start_date**: Start date for statistics
    - **end_date**: End date for statistics
    - **period**: Quick period filter
    """
    return controller.get_summary_statistics(
        current_user,
        start_date,
        end_date,
        period
    )


@router.get("/completed/today", response_model=CompletedDeliveriesResponse)
def get_today_completed_deliveries(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryCompletedController = Depends()
):
    """
    Get today's completed deliveries
    """
    return controller.get_today_completed_deliveries(current_user)


@router.get("/completed/week", response_model=CompletedDeliveriesResponse)
def get_week_completed_deliveries(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryCompletedController = Depends()
):
    """
    Get this week's completed deliveries
    """
    return controller.get_week_completed_deliveries(current_user)


@router.get("/completed/month", response_model=CompletedDeliveriesResponse)
def get_month_completed_deliveries(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryCompletedController = Depends()
):
    """
    Get this month's completed deliveries
    """
    return controller.get_month_completed_deliveries(current_user)


@router.get("/completed/date-range", response_model=CompletedDeliveriesResponse)
def get_deliveries_by_date_range(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryCompletedController = Depends()
):
    """
    Get completed deliveries within a date range
    
    - **start_date**: Required start date
    - **end_date**: Required end date
    """
    return controller.get_deliveries_by_date_range(current_user, start_date, end_date)


# 2. DYNAMIC ROUTES AFTER STATIC ROUTES (SAFE ORDER)
@router.get("/completed/{delivery_id}", response_model=CompletedDeliveryResponse)
def get_completed_delivery_detail(
    delivery_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryCompletedController = Depends()
):
    """
    Get detailed information for a specific completed delivery
    
    - **delivery_id**: ID of the delivery to retrieve
    """
    return controller.get_completed_delivery_detail(delivery_id, current_user)


@router.get("/completed/{delivery_id}/pod", response_model=PODResponse)
def get_proof_of_delivery(
    delivery_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryCompletedController = Depends()
):
    """
    Get Proof of Delivery for a completed delivery
    
    - **delivery_id**: ID of the delivery
    """
    return controller.get_proof_of_delivery(delivery_id, current_user)

