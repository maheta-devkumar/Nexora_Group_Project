from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.coupon_controller import CouponController
from schemas.marketing_schema import (
    CouponCreate, CouponUpdate, CouponWrapper, CouponListWrapper,
    CouponValidationRequest, CouponValidationWrapper, MessageWrapper
)
from models.user import User

router = APIRouter(prefix="/api/v1/marketing/coupons", tags=["Marketing - Coupons"])

# Admin endpoints
@router.post("", response_model=CouponWrapper)
def create_coupon_route(
    coupon_data: CouponCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Create a new coupon (Admin only)"""
    controller = CouponController(db)
    coupon = controller.create_coupon(coupon_data)
    return {
        "success": True,
        "message": "Coupon created successfully",
        "data": coupon
    }

@router.get("", response_model=CouponListWrapper)
def get_all_coupons_route(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all coupons (Admin only)"""
    controller = CouponController(db)
    coupons = controller.get_all_coupons(skip, limit)
    return {
        "success": True,
        "message": "Coupons retrieved successfully",
        "data": coupons
    }

@router.get("/active", response_model=CouponListWrapper)
def get_active_coupons_route(
    db: Session = Depends(get_db)
):
    """Get currently active coupons (Public)"""
    controller = CouponController(db)
    coupons = controller.get_active_coupons()
    return {
        "success": True,
        "message": "Active coupons retrieved successfully",
        "data": coupons
    }

@router.post("/validate", response_model=CouponValidationWrapper)
def validate_coupon_route(
    validation_data: CouponValidationRequest,
    db: Session = Depends(get_db)
):
    """Validate coupon during checkout (Public)"""
    controller = CouponController(db)
    # Extract the correct fields from the request
    result = controller.validate_coupon(
        validation_data.coupon_code,  # Use coupon_code from request
        validation_data.variant_ids,  # Use variant_ids from request
        validation_data.order_total,  # Use order_total from request
    )
    return {
        "success": True,
        "message": "Coupon validation completed",
        "data": result
    }

@router.get("/{coupon_id}", response_model=CouponWrapper)
def get_coupon_route(
    coupon_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Get coupon by ID (Admin only)"""
    controller = CouponController(db)
    coupon = controller.get_coupon(coupon_id)
    return {
        "success": True,
        "message": "Coupon retrieved successfully",
        "data": coupon
    }

@router.patch("/{coupon_id}", response_model=CouponWrapper)
def update_coupon_route(
    coupon_id: int,
    coupon_data: CouponUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Update coupon details (Admin only)"""
    controller = CouponController(db)
    coupon = controller.update_coupon(coupon_id, coupon_data)
    return {
        "success": True,
        "message": "Coupon updated successfully",
        "data": coupon
    }

@router.patch("/{coupon_id}/status", response_model=MessageWrapper)
def update_coupon_status_route(
    coupon_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Activate or deactivate coupon (Admin only)"""
    try:
        if "is_active" not in status_update:
            raise HTTPException(status_code=400, detail="is_active field is required")
        
        controller = CouponController(db)
        result = controller.update_coupon_status(coupon_id, status_update["is_active"])
        return {
            "success": True,
            "message": result["message"],
            "data": {}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{coupon_id}", response_model=MessageWrapper)
def delete_coupon_route(
    coupon_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Delete coupon (Admin only)"""
    controller = CouponController(db)
    result = controller.delete_coupon(coupon_id)
    return {
        "success": True,
        "message": result["message"],
        "data": {}
    }