from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.delivery_person_controller import DeliveryPersonController
from schemas.delivery_schema import (
    DeliveryPersonCreate, DeliveryPersonUpdate, DeliveryPersonWrapper,
    DeliveryPersonListWrapper, MessageWrapper
)
from models.user import User
from typing import Optional

router = APIRouter(prefix="/api/v1/delivery-persons", tags=["Delivery Persons"])

# Public endpoint - User can apply to become delivery person
@router.post("/register", response_model=DeliveryPersonWrapper)
def register_as_delivery_person(
    delivery_data: DeliveryPersonCreate,
    db: Session = Depends(get_db)
):
    """Register as a delivery person (requires admin approval)"""
    controller = DeliveryPersonController(db)
    delivery_person = controller.register_delivery_person(delivery_data)
    return {
        "success": True,
        "message": "Delivery person registration submitted successfully. Waiting for admin approval.",
        "data": delivery_person
    }

# User endpoint - Get own delivery profile
@router.get("/my-profile", response_model=DeliveryPersonWrapper)
def get_my_delivery_profile_route(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's delivery profile"""
    controller = DeliveryPersonController(db)
    profile = controller.get_my_delivery_profile(current_user.user_id)
    return {
        "success": True,
        "message": "Delivery profile retrieved successfully",
        "data": profile
    }

# Admin endpoints
@router.get("/", response_model=DeliveryPersonListWrapper)
def list_all_delivery_persons(
    db: Session = Depends(get_db),
    admin = Depends(is_admin),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None)
):
    """Admin: Get all delivery persons"""
    controller = DeliveryPersonController(db)
    delivery_persons = controller.get_all_delivery_persons(page, per_page, status)
    return {
        "success": True,
        "message": "Delivery persons retrieved successfully",
        "data": delivery_persons["delivery_persons"]
    }

@router.get("/{delivery_person_id}", response_model=DeliveryPersonWrapper)
def get_delivery_person(
    delivery_person_id: int,
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Get delivery person details"""
    controller = DeliveryPersonController(db)
    delivery_person = controller.get_delivery_person_by_id(delivery_person_id)
    return {
        "success": True,
        "message": "Delivery person details retrieved successfully",
        "data": delivery_person
    }

@router.patch("/{delivery_person_id}/status", response_model=DeliveryPersonWrapper)
def update_delivery_person_status_route(
    delivery_person_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Update delivery person status"""
    if "status" not in status_update:
        raise HTTPException(status_code=400, detail="Status is required")
    
    controller = DeliveryPersonController(db)
    delivery_person = controller.update_delivery_person_status(delivery_person_id, status_update["status"])
    return {
        "success": True,
        "message": "Delivery person status updated successfully",
        "data": delivery_person
    }

@router.patch("/{delivery_person_id}/rating", response_model=DeliveryPersonWrapper)
def update_delivery_person_rating_route(
    delivery_person_id: int,
    rating_update: dict,
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Update delivery person rating"""
    if "rating" not in rating_update:
        raise HTTPException(status_code=400, detail="Rating is required")
    
    controller = DeliveryPersonController(db)
    delivery_person = controller.update_delivery_person_rating(delivery_person_id, rating_update["rating"])
    return {
        "success": True,
        "message": "Delivery person rating updated successfully",
        "data": delivery_person
    }

# User self-service endpoints
@router.post("/apply", response_model=DeliveryPersonWrapper)
def apply_as_delivery_person(
    application_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Current user applies to become a delivery person"""
    delivery_data = DeliveryPersonCreate(
        user_id=current_user.user_id,
        license_number=application_data.get("license_number")
    )
    
    controller = DeliveryPersonController(db)
    delivery_person = controller.register_delivery_person(delivery_data)
    return {
        "success": True,
        "message": "Application submitted successfully. Waiting for admin approval.",
        "data": delivery_person
    }