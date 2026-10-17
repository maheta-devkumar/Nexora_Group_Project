from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.payment_controller import PaymentController
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1/admin/payments", tags=["Admin Payments"])

@router.get("/summary", response_model=dict)
def get_payment_summary_admin(
    db: Session = Depends(get_db),
    admin = Depends(is_admin)  # Strict admin check
):
    """Admin: Get payment summary metrics"""
    controller = PaymentController(db)
    summary = controller.get_payment_summary()
    return {
        "success": True,
        "message": "Payment metrics retrieved",
        "data": summary
    }

@router.get("/", response_model=dict)
def list_payments_admin(
    db: Session = Depends(get_db),
    admin = Depends(is_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100, alias="per_page"), # Supporting 'limit' as per request, aliasing to per_page
    status: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
    fromDate: Optional[str] = Query(None, alias="from_date"), # Frontend sends fromDate
    toDate: Optional[str] = Query(None, alias="to_date")      # Frontend sends toDate
):
    """Admin: Get paginated list of payments with filters"""
    controller = PaymentController(db)
    
    # helper to parse date strings
    def parse_date(date_str):
        if not date_str: return None
        try:
            # Handle frontend ISO string or simple date YYYY-MM-DD
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            try:
                 return datetime.strptime(date_str, "%Y-%m-%d")
            except:
                 return None

    f_date = parse_date(fromDate)
    t_date = parse_date(toDate)

    result = controller.get_all_payments(page, limit, status, method, f_date, t_date)
    return {
        "success": True,
        "message": "Payments retrieved successfully",
        "data": result["payments"],
        "pagination": {
            "total": result["total_payments"],
            "pages": result["total_pages"],
            "page": page,
            "limit": limit
        }
    }

@router.get("/{payment_id}", response_model=dict)
def get_payment_details_admin(
    payment_id: int,
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Get full payment details"""
    controller = PaymentController(db)
    # user_id=0 because admin overrides access check
    payment = controller.get_payment_by_id(payment_id, user_id=0, is_admin=True) 
    return {
        "success": True,
        "message": "Payment details retrieved",
        "data": payment
    }
