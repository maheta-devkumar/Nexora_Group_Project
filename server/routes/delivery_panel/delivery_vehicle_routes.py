# delivery_panel/vehicle/delivery_vehicle_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from config.dependencies import get_current_user, is_delivery_person
from controllers.delivery_panel.delivery_vehicle_controller import DeliveryVehicleController
from schemas.delivery_panel.delivery_vehicle_schema import (
    VehicleDetailsResponse, VehicleDocumentsResponse, InsuranceResponse,
    ServiceHistoryResponse, VehicleComprehensiveResponse, VehicleSuccessResponse
)
from models.user import User

router = APIRouter(prefix="/api/v1/delivery_panel/vehicle", tags=["Delivery Vehicle"])


@router.get("/", response_model=VehicleComprehensiveResponse)
def get_vehicle_comprehensive_info(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryVehicleController = Depends()
):
    """
    Get comprehensive vehicle information
    
    Note: Returns 404 if no vehicle information exists
    """
    return controller.get_comprehensive_vehicle_info(current_user)


@router.get("/basic", response_model=VehicleDetailsResponse)
def get_vehicle_basic_info(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryVehicleController = Depends()
):
    """
    Get basic vehicle information
    
    Returns 404 if no vehicle information exists
    """
    return controller.get_vehicle_info(current_user)


@router.get("/documents", response_model=VehicleDocumentsResponse)
def get_vehicle_documents(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryVehicleController = Depends()
):
    """
    Get all vehicle documents
    
    Returns empty list if no documents exist
    """
    return controller.get_vehicle_documents(current_user)


@router.get("/insurance", response_model=InsuranceResponse)
def get_insurance_details(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryVehicleController = Depends()
):
    """
    Get vehicle insurance details
    
    Returns empty insurance details if no information exists
    Always returns 200 OK
    """
    return controller.get_insurance_details(current_user)

@router.get("/service-history", response_model=ServiceHistoryResponse)
def get_service_history(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryVehicleController = Depends()
):
    """
    Get vehicle service history
    
    Note: Service history is not currently stored in the system
    Always returns empty list
    """
    return controller.get_service_history(current_user)


# Add a simpler endpoint that doesn't fail
@router.get("/info")
def get_vehicle_info_safe(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryVehicleController = Depends()
):
    """
    Get vehicle information (safe version)
    
    Returns empty data if no vehicle information exists
    Does not return 404
    """
    try:
        return controller.get_comprehensive_vehicle_info(current_user)
    except:
        # Return empty response without error
        return {
            "success": True,
            "message": "No vehicle information available",
            "data": None
        }