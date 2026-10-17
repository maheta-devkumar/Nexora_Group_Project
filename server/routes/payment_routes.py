from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.payment_controller import PaymentController
from schemas.payment_schema import (
    PaymentInitiateRequest, PaymentVerifyRequest, PaymentInitiateWrapper,
    PaymentWrapper, PaymentListWrapper, MessageWrapper
)
from schemas.payment_schema import PaymentConfirmRequest, PaymentStatusResponse
from models.user import User
from typing import Optional
from models.payment import Payment
from models.order.order import Order
from decimal import Decimal

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])

# ========== PUBLIC ENDPOINTS - NO AUTH REQUIRED ==========

@router.get("/methods")
def get_payment_methods():
    """Get available payment methods - PUBLIC ACCESS"""
    payment_methods = [
        {"method": "COD", "name": "Cash on Delivery", "available": True, "icon": "fa-money-bill-wave"},
        {"method": "RAZORPAY", "name": "Razorpay", "available": True, "icon": "fa-credit-card"}
    ]
    
    return {
        "success": True,
        "message": "Payment methods retrieved successfully",
        "data": payment_methods
    }

# Webhook endpoint (no authentication for webhooks)
@router.post("/webhook")
async def payment_webhook(
    webhook_data: dict,
    db: Session = Depends(get_db)
):
    """Handle payment webhook - SIMPLIFIED FOR TESTING"""
    # ... your existing webhook code remains the same

# ========== PROTECTED ENDPOINTS - AUTH REQUIRED ==========

# Customer endpoints
@router.post("/initiate", response_model=PaymentInitiateWrapper)
def initiate_payment_route(
    payment_data: PaymentInitiateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initiate payment for an order"""
    controller = PaymentController(db)
    payment_info = controller.initiate_payment(payment_data, current_user.user_id)
    return {
        "success": True,
        "message": "Payment initiated successfully",
        "data": payment_info
    }

@router.post("/verify", response_model=MessageWrapper)
def verify_payment_route(
    verify_data: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify payment completion"""
    controller = PaymentController(db)
    result = controller.verify_payment(verify_data, current_user.user_id)
    return {
        "success": True,
        "message": result["message"],
        "data": result
    }

@router.get("/history", response_model=PaymentListWrapper)
def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Get payment history for current user"""
    controller = PaymentController(db)
    payments = controller.get_user_payments(current_user.user_id, page, per_page)
    return {
        "success": True,
        "message": "Payment history retrieved successfully",
        "data": payments["payments"]
    }

# ========== PARAMETERIZED ROUTES - MUST COME LAST ==========

@router.get("/{payment_id}", response_model=PaymentWrapper)
def get_payment_details(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment details"""
    controller = PaymentController(db)
    payment = controller.get_payment_by_id(payment_id, current_user.user_id)
    return {
        "success": True,
        "message": "Payment details retrieved successfully",
        "data": payment
    }

@router.post("/{payment_id}/confirm", response_model=dict)
def confirm_payment_route(
    payment_id: str,
    req: PaymentConfirmRequest,
    db: Session = Depends(get_db)
):
    controller = PaymentController(db)
    result = controller.confirm_payment(payment_id, req.gateway_data)

    return {
        "success": True,
        "message": "Payment confirmation processed",
        "data": result
    }


@router.get("/{payment_id}/status", response_model=PaymentStatusResponse)
def get_payment_status_route(
    payment_id: str,
    db: Session = Depends(get_db)
):
    controller = PaymentController(db)
    result = controller.get_payment_status(payment_id)

    return result


@router.get("/{payment_id}/refund-status", response_model=dict)
def get_payment_refund_status_route(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get refund status for a payment"""
    try:
        # Verify user owns the payment (unless admin)
        payment = db.query(Payment).filter(
            Payment.payment_id == payment_id,
            Payment.user_id == current_user.user_id
        ).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        controller = PaymentController(db)
        refund_status = controller.get_payment_refund_status(payment_id)
        return {
            "success": True,
            "message": "Refund status retrieved successfully",
            "data": refund_status
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{payment_id}/refund", response_model=dict)
def initiate_refund_route(
    payment_id: int,
    refund_data: dict,
    admin: User = Depends(is_admin),
    db: Session = Depends(get_db)
):
    """Admin: Initiate refund for a payment"""
    if "amount" not in refund_data:
        raise HTTPException(status_code=400, detail="Refund amount is required")
    
    refund_amount = Decimal(str(refund_data["amount"]))
    controller = PaymentController(db)
    result = controller.process_refund_payment(payment_id, refund_amount)
    
    return {
        "success": True,
        "message": "Refund initiated successfully",
        "data": result
    }

# Admin endpoints
@router.get("/", response_model=PaymentListWrapper)
def list_all_payments(
    db: Session = Depends(get_db),
    admin = Depends(is_admin),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None)
):
    """Admin: Get all payments"""
    controller = PaymentController(db)
    payments = controller.get_all_payments(page, per_page, status)
    return {
        "success": True,
        "message": "Payments retrieved successfully",
        "data": payments["payments"]
    }

@router.patch("/{payment_id}/status", response_model=PaymentWrapper)
def update_payment_status_admin(
    payment_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Update payment status"""
    if "payment_status" not in status_update:
        raise HTTPException(status_code=400, detail="Payment status is required")
    
    controller = PaymentController(db)
    payment = controller.update_payment_status(payment_id, status_update["payment_status"])
    return {
        "success": True,
        "message": "Payment status updated successfully",
        "data": payment
    }