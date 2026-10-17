from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.inventory.purchase_controller import PurchaseController
from schemas.inventory_schema import (
    PurchaseCreate, PurchaseWrapper, PurchaseListWrapper, 
    MessageWrapper, PurchaseStatus
)
from models.user import User

router = APIRouter(prefix="/api/v1/inventory/purchases", tags=["Inventory - Purchases"])

# Admin endpoints
@router.post("", response_model=PurchaseWrapper)
def create_purchase_route(
    purchase_data: PurchaseCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Create a new purchase"""
    controller = PurchaseController(db)
    purchase = controller.create_purchase(purchase_data)
    return {
        "success": True,
        "message": "Purchase created successfully",
        "data": purchase
    }

@router.get("", response_model=PurchaseListWrapper)
def get_all_purchases_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all purchases"""
    controller = PurchaseController(db)
    purchases = controller.get_all_purchases(skip, limit)
    return {
        "success": True,
        "message": "Purchases retrieved successfully",
        "data": purchases
    }

@router.get("/{purchase_id}", response_model=PurchaseWrapper)
def get_purchase_route(
    purchase_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Get purchase by ID"""
    controller = PurchaseController(db)
    purchase = controller.get_purchase(purchase_id)
    return {
        "success": True,
        "message": "Purchase retrieved successfully",
        "data": purchase
    }

@router.patch("/{purchase_id}/status", response_model=MessageWrapper)
def update_purchase_status_route(
    purchase_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Update purchase status"""
    try:
        if "status" not in status_update:
            raise HTTPException(status_code=400, detail="Status is required")
        
        controller = PurchaseController(db)
        result = controller.update_purchase_status(purchase_id, status_update["status"])
        return {
            "success": True,
            "message": result["message"],
            "data": {}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))