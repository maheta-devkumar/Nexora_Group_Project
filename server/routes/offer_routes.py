from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.offer_controller import OfferController
from schemas.marketing_schema import (
    OfferCreate, OfferUpdate, OfferWrapper, OfferListWrapper, MessageWrapper
)
from models.user import User

router = APIRouter(prefix="/api/v1/marketing/offers", tags=["Marketing - Offers"])

# Admin endpoints
@router.post("", response_model=OfferWrapper)
def create_offer_route(
    offer_data: OfferCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Create a new offer (Admin only)"""
    controller = OfferController(db)
    offer = controller.create_offer(offer_data)
    return {
        "success": True,
        "message": "Offer created successfully",
        "data": offer
    }

@router.get("", response_model=OfferListWrapper)
def get_all_offers_route(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all offers (Admin only)"""
    controller = OfferController(db)
    offers = controller.get_all_offers(skip, limit)
    return {
        "success": True,
        "message": "Offers retrieved successfully",
        "data": offers
    }

@router.get("/active", response_model=OfferListWrapper)
def get_active_offers_route(
    db: Session = Depends(get_db)
):
    """Get currently active offers (Public)"""
    controller = OfferController(db)
    offers = controller.get_active_offers()
    return {
        "success": True,
        "message": "Active offers retrieved successfully",
        "data": offers
    }

@router.get("/{offer_id}", response_model=OfferWrapper)
def get_offer_route(
    offer_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Get offer by ID (Admin only)"""
    controller = OfferController(db)
    offer = controller.get_offer(offer_id)
    return {
        "success": True,
        "message": "Offer retrieved successfully",
        "data": offer
    }

@router.patch("/{offer_id}", response_model=OfferWrapper)
def update_offer_route(
    offer_id: int,
    offer_data: OfferUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Update offer details (Admin only)"""
    controller = OfferController(db)
    offer = controller.update_offer(offer_id, offer_data)
    return {
        "success": True,
        "message": "Offer updated successfully",
        "data": offer
    }

@router.patch("/{offer_id}/status", response_model=MessageWrapper)
def update_offer_status_route(
    offer_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Activate or deactivate offer (Admin only)"""
    try:
        if "is_active" not in status_update:
            raise HTTPException(status_code=400, detail="is_active field is required")
        
        controller = OfferController(db)
        result = controller.update_offer_status(offer_id, status_update["is_active"])
        return {
            "success": True,
            "message": result["message"],
            "data": {}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{offer_id}", response_model=MessageWrapper)
def delete_offer_route(
    offer_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Delete offer (Admin only)"""
    controller = OfferController(db)
    result = controller.delete_offer(offer_id)
    return {
        "success": True,
        "message": result["message"],
        "data": {}
    }