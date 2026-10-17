from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List

from config.dependencies import get_current_user, is_delivery_person
from controllers.delivery_panel.delivery_pickup_controller import DeliveryPickupController
from schemas.delivery_panel.delivery_pickup_schema import (
    PendingPickupsResponse, PickupDetailsResponse, ConfirmPickupRequest, ConfirmPickupResponse,
    NavigationResponse, VendorContactResponse, DeliveryPickupResponse,
    PickupFilters
)
from models.user import User

router = APIRouter(prefix="/api/v1/delivery_panel/pickups", tags=["Delivery Pickups"])


# ===== STATIC ROUTES FIRST (Prevent conflicts) =====

@router.get("/pending", response_model=PendingPickupsResponse)
def get_pending_pickups(
    vendor_type: Optional[str] = Query(None, description="Filter by vendor type"),
    sort_by: str = Query("nearest", description="Sort by: nearest, time, priority"),
    pickup_location_id: Optional[int] = Query(None, description="Filter by specific pickup location"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPickupController = Depends()
):
    """
    Get all pending pickups for delivery person
    
    Returns list of pickups grouped by location with statistics
    """
    return controller.get_pending_pickups(
        current_user, vendor_type, sort_by, pickup_location_id
    )


@router.get("/optimize/route", response_model=DeliveryPickupResponse)
def get_optimized_route(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPickupController = Depends()
):
    """
    Get optimized route for all pending pickups
    
    Sorts pickups by distance for efficient routing
    """
    return controller.get_optimized_route(current_user)


@router.get("/statistics/summary", response_model=DeliveryPickupResponse)
def get_pickup_statistics(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPickupController = Depends()
):
    """
    Get statistics for pending pickups
    
    Returns counts by type, urgency, and location groups
    """
    return controller.get_pickup_statistics(current_user)


@router.get("/health")
def health_check(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPickupController = Depends()
):
    """
    Health check for delivery pickups module
    
    Verifies the module is working correctly
    """
    try:
        # Try to get pending pickups to verify everything works
        response = controller.get_pending_pickups(current_user)
        return {
            "status": "healthy",
            "message": "Delivery pickups module is working correctly",
            "user_id": current_user.user_id,
            "pending_count": response.total_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Delivery pickups health check failed: {str(e)}"
        )


# ===== DYNAMIC ROUTES AFTER STATIC ROUTES =====

@router.get("/{delivery_id}", response_model=PickupDetailsResponse)
def get_pickup_details(
    delivery_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPickupController = Depends()
):
    """
    Get detailed information for specific pickup
    
    Includes vendor details, items, and pickup instructions
    """
    return controller.get_pickup_details(delivery_id, current_user)





@router.post("/{delivery_id}/confirm", response_model=ConfirmPickupResponse)
def confirm_pickup(
    delivery_id: int,
    request: ConfirmPickupRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPickupController = Depends()
):
    """
    Confirm pickup after QR verification
    
    Updates delivery status to PICKED_UP
    """
    # Ensure delivery_id in request matches URL
    if request.delivery_id != delivery_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery ID in request doesn't match URL"
        )
    
    return controller.confirm_pickup(request, current_user)


@router.get("/{delivery_id}/call", response_model=VendorContactResponse)
def get_vendor_contact(
    delivery_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPickupController = Depends()
):
    """
    Get vendor contact information for calling
    
    Returns phone number and contact person details
    Frontend handles the actual call via tel: link
    """
    return controller.get_vendor_contact(delivery_id, current_user)


@router.get("/{delivery_id}/navigation", response_model=NavigationResponse)
def get_pickup_navigation(
    delivery_id: int,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryPickupController = Depends()
):
    """
    Get navigation details for pickup location
    
    Returns coordinates and map URLs for frontend navigation
    """
    return controller.get_navigation_details(delivery_id, current_user)