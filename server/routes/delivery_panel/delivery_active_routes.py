# delivery_panel/active_deliveries/delivery_active_routes.py
from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List
from datetime import datetime

from config.dependencies import get_current_user, is_delivery_person
from controllers.delivery_panel.delivery_active_controller import DeliveryActiveController
from schemas.delivery_panel.delivery_active_schema import (
    ActiveDeliveriesListResponse, DeliveryResponse, StatusUpdateRequest,
    LocationUpdateResponse, CustomerCallResponse, NavigationDataResponse,
    SuccessResponse, DeliveryStatistics, StatusTransitionResponse,
    ProgressUpdateRequest, DeliveryStatus, PaymentType, PriorityLevel,
    DeliveryOTPRequestResponse, DeliveryOTPConfirmRequest, DeliveryOTPConfirmResponse
)
from models.user import User

router = APIRouter(
    prefix="/api/v1/delivery_panel/active",
    tags=["Active Deliveries"]
)


# ===== HEALTH CHECK =====

@router.get("/health", response_model=SuccessResponse)
def health_check(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Health check for active deliveries module
    
    Verifies that the module is working correctly
    """
    return controller.health_check(current_user)


# ===== STATISTICS ENDPOINT (MUST COME BEFORE DYNAMIC ROUTES) =====

@router.get("/statistics", response_model=DeliveryStatistics)
def get_delivery_statistics(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Get delivery statistics for active deliveries
    
    Includes counts by status, today's completed deliveries, earnings, etc.
    """
    return controller.get_delivery_statistics(current_user)


# ===== BULK OPERATIONS (Optional) =====

@router.put("/bulk/status", response_model=SuccessResponse)
def bulk_update_delivery_status(
    delivery_ids: List[int] = Query(..., description="List of delivery IDs"),
    status: str = Query(..., description="New status for all deliveries"),
    notes: Optional[str] = Query(None, description="Optional notes for all updates"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Update status for multiple deliveries at once
    
    Note: This is a simplified implementation. In production,
    you might want to add transaction handling and better error reporting.
    """
    # Validate status
    valid_statuses = [s.value for s in DeliveryStatus]
    if status.upper() not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    success_count = 0
    failed_count = 0
    failed_ids = []
    
    temp_controller = DeliveryActiveController(controller.db)
    
    for delivery_id in delivery_ids:
        try:
            request = StatusUpdateRequest(
                status=DeliveryStatus(status.upper()),
                notes=notes
            )
            result = temp_controller.update_delivery_status(
                delivery_id, request, current_user
            )
            if result.success:
                success_count += 1
            else:
                failed_count += 1
                failed_ids.append(delivery_id)
        except Exception:
            failed_count += 1
            failed_ids.append(delivery_id)
    
    if failed_count == 0:
        return SuccessResponse(
            success=True,
            message=f"Successfully updated {success_count} deliveries",
            timestamp=datetime.now()
        )
    else:
        return SuccessResponse(
            success=False,
            message=f"Updated {success_count} deliveries, failed {failed_count} (IDs: {failed_ids})",
            timestamp=datetime.now()
        )


# ===== REFRESH ENDPOINT =====

@router.get("/refresh", response_model=ActiveDeliveriesListResponse)
def refresh_deliveries(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Refresh active deliveries list
    
    Same as GET / but explicitly for refreshing data in frontend
    """
    return controller.get_active_deliveries(current_user)

# ===== ACTIVE DELIVERIES ENDPOINTS =====

@router.get("/", response_model=ActiveDeliveriesListResponse)
def get_active_deliveries(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Get all active deliveries for delivery person
    
    Returns list of deliveries with status: ASSIGNED, PICKED_UP, or OUT_FOR_DELIVERY
    """
    return controller.get_active_deliveries(current_user)


@router.get("/today", response_model=ActiveDeliveriesListResponse)
def get_todays_deliveries(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Get all deliveries assigned today for delivery person
    """
    return controller.get_todays_deliveries(current_user)


@router.get("/status/{status}", response_model=ActiveDeliveriesListResponse)
def get_deliveries_by_status(
    status: str,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Get deliveries by specific status
    
    Status options: ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY
    """
    # Validate status
    valid_statuses = ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"]
    if status.upper() not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    return controller.get_deliveries_by_status(status.upper(), current_user)


# ===== SPECIFIC DELIVERY ENDPOINTS =====

@router.get("/{delivery_id}", response_model=DeliveryResponse)
def get_delivery_by_id(
    delivery_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Get specific delivery by ID
    
    Returns detailed information about a single delivery
    """
    return controller.get_delivery_by_id(delivery_id, current_user)


# ===== DELIVERY STATUS UPDATES =====

@router.put("/{delivery_id}/status", response_model=DeliveryResponse)
def update_delivery_status(
    delivery_id: int,
    request: StatusUpdateRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Update delivery status
    
    Allowed status transitions:
    - ASSIGNED → PICKED_UP or CANCELLED
    - PICKED_UP → OUT_FOR_DELIVERY, DELIVERED, or FAILED
    - OUT_FOR_DELIVERY → DELIVERED or FAILED
    """
    return controller.update_delivery_status(delivery_id, request, current_user)


@router.patch("/{delivery_id}/mark-delivered", response_model=DeliveryResponse)
def mark_delivery_delivered(
    delivery_id: int,
    request: StatusUpdateRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Mark delivery as delivered (Completed)
    
    Requirements:
    - Delivery must exist and belong to user
    - Current status MUST be OUT_FOR_DELIVERY
    - Marks as DELIVERED, sets timestamps, and triggers earnings
    """
    return controller.mark_delivery_delivered(delivery_id, request, current_user)



# ===== OTP DELIVERY COMPLETION =====

@router.post("/{delivery_id}/request-otp", response_model=DeliveryOTPRequestResponse)
def request_delivery_otp(
    delivery_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """Request OTP for delivery completion"""
    return controller.request_delivery_otp(delivery_id, current_user)

@router.post("/{delivery_id}/confirm-delivery", response_model=DeliveryOTPConfirmResponse)
def confirm_delivery(
    delivery_id: int,
    request: DeliveryOTPConfirmRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """Confirm delivery using OTP"""
    return controller.confirm_delivery(delivery_id, request, current_user)

@router.get("/{delivery_id}/validate-status/{target_status}", response_model=StatusTransitionResponse)
def validate_status_transition(
    delivery_id: int,
    target_status: str,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Validate if status transition is allowed
    
    Checks if delivery can transition from current status to target status
    """
    return controller.validate_status_transition(delivery_id, target_status, current_user)


@router.put("/{delivery_id}/progress", response_model=DeliveryResponse)
def update_delivery_progress(
    delivery_id: int,
    request: ProgressUpdateRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Update delivery progress percentage
    
    Progress range: 0-100
    Automatically updates status based on progress:
    - 0-49%: ASSIGNED/PICKED_UP
    - 50-74%: PICKED_UP
    - 75-100%: OUT_FOR_DELIVERY
    """
    if not 0 <= request.progress_percentage <= 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Progress percentage must be between 0 and 100"
        )
    
    return controller.update_delivery_progress(delivery_id, request, current_user)


# ===== LOCATION UPDATES =====

@router.put("/location", response_model=LocationUpdateResponse)
def update_delivery_person_location(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    accuracy: Optional[float] = Query(None, description="Location accuracy in meters"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Update delivery person's current location
    
    Updates the delivery person's live location for tracking
    """
    # Validate coordinates
    if not -90 <= latitude <= 90:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90"
        )
    
    if not -180 <= longitude <= 180:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180 and 180"
        )
    
    return controller.update_delivery_person_location(
        latitude, longitude, accuracy, current_user
    )


# ===== CUSTOMER CALL =====

@router.get("/{delivery_id}/call", response_model=CustomerCallResponse)
def get_customer_contact_info(
    delivery_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Get customer contact information for calling
    
    Returns customer name and phone number
    Frontend should use tel: link for actual calling
    """
    return controller.get_customer_contact_info(delivery_id, current_user)


# ===== NAVIGATION =====

@router.get("/{delivery_id}/navigation", response_model=NavigationDataResponse)
def get_delivery_navigation_data(
    delivery_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Get navigation data for delivery
    
    Returns address, map URLs, and customer information for navigation
    """
    return controller.get_delivery_navigation_data(delivery_id, current_user)


# ===== FILTER ENDPOINTS (Optional) =====

@router.get("/filter/payment/{payment_type}", response_model=ActiveDeliveriesListResponse)
def get_deliveries_by_payment_type(
    payment_type: str,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Get deliveries by payment type
    
    Payment type options: COD, PREPAID, WALLET, ONLINE
    """
    # Validate payment type
    valid_payment_types = [pt.value for pt in PaymentType]
    if payment_type.upper() not in valid_payment_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment type. Must be one of: {', '.join(valid_payment_types)}"
        )
    
    # Note: This endpoint would require additional service/repository method
    # For now, we'll return all active deliveries
    return controller.get_active_deliveries(current_user)


@router.get("/filter/priority/{priority}", response_model=ActiveDeliveriesListResponse)
def get_deliveries_by_priority(
    priority: str,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryActiveController = Depends()
):
    """
    Get deliveries by priority level
    
    Priority options: URGENT, HIGH, NORMAL
    """
    # Validate priority
    valid_priorities = [p.value for p in PriorityLevel]
    if priority.upper() not in valid_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority. Must be one of: {', '.join(valid_priorities)}"
        )
    
    # Note: This endpoint would require additional service/repository method
    # For now, we'll return all active deliveries
    return controller.get_active_deliveries(current_user)

