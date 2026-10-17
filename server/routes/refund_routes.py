from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.refund_controller import RefundController
from schemas.delivery_schema import (
    RefundWrapper, RefundListWrapper, MessageWrapper
)
from models.user import User

router = APIRouter(prefix="/api/v1/refunds", tags=["Refunds"])

# Admin endpoints
@router.post("/process/{return_id}", response_model=RefundWrapper)
def process_refund_route(
    return_id: int,
    admin: User = Depends(is_admin),
    db: Session = Depends(get_db)
):
    """Admin: Process refund for a return"""
    controller = RefundController(db)
    refund = controller.process_refund(return_id, admin.user_id)
    return {
        "success": True,
        "message": "Refund processed successfully",
        "data": refund
    }

@router.get("/admin/all", response_model=RefundListWrapper)
def get_all_refunds_admin(
    admin = Depends(is_admin),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str = Query(None)
):
    """Admin: Get all refunds"""
    controller = RefundController(db)
    refunds = controller.get_all_refunds(page, per_page, status)
    return {
        "success": True,
        "message": "Refunds retrieved successfully",
        "data": refunds["refunds"]
    }

@router.patch("/{refund_id}/status", response_model=RefundWrapper)
def update_refund_status_route(
    refund_id: int,
    status: str,
    admin: User = Depends(is_admin),
    db: Session = Depends(get_db)
):
    """Admin: Update refund status"""
    controller = RefundController(db)
    refund = controller.update_refund_status(refund_id, status, admin.user_id)
    return {
        "success": True,
        "message": "Refund status updated successfully",
        "data": refund
    }

# Customer endpoints
@router.get("/my-refunds", response_model=RefundListWrapper)
def get_my_refunds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Customer: Get my refund history"""
    controller = RefundController(db)
    refunds = controller.get_refunds_by_user(current_user.user_id, page, per_page)
    return {
        "success": True,
        "message": "Refunds retrieved successfully",
        "data": refunds["refunds"]
    }

@router.get("/{refund_id}", response_model=RefundWrapper)
def get_refund_detail(
    refund_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer: Get refund details"""
    controller = RefundController(db)
    refund = controller.get_refund_details(refund_id, current_user.user_id)
    return {
        "success": True,
        "message": "Refund details retrieved successfully",
        "data": refund
    }