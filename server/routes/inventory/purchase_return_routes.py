from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.inventory.purchase_return_controller import PurchaseReturnController
from schemas.inventory_schema import (
    PurchaseReturnCreate, PurchaseReturnWrapper, 
    PurchaseReturnListWrapper, MessageWrapper, ReturnStatus
)
from models.user import User

router = APIRouter(prefix="/api/v1/inventory/returns", tags=["Inventory - Returns"])

# Admin endpoints
@router.post("", response_model=PurchaseReturnWrapper)
def create_purchase_return_route(
    return_data: PurchaseReturnCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Create a new purchase return"""
    controller = PurchaseReturnController(db)
    purchase_return = controller.create_purchase_return(return_data)
    return {
        "success": True,
        "message": "Purchase return created successfully",
        "data": purchase_return
    }

@router.get("", response_model=PurchaseReturnListWrapper)
def get_all_purchase_returns_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all purchase returns"""
    controller = PurchaseReturnController(db)
    returns = controller.get_all_purchase_returns(skip, limit)
    return {
        "success": True,
        "message": "Purchase returns retrieved successfully",
        "data": returns
    }

@router.get("/{return_id}", response_model=PurchaseReturnWrapper)
def get_purchase_return_route(
    return_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Get purchase return by ID"""
    controller = PurchaseReturnController(db)
    purchase_return = controller.get_purchase_return(return_id)
    return {
        "success": True,
        "message": "Purchase return retrieved successfully",
        "data": purchase_return
    }

@router.patch("/{return_id}/status", response_model=MessageWrapper)
def update_purchase_return_status_route(
    return_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Update purchase return status"""
    try:
        if "status" not in status_update:
            raise HTTPException(status_code=400, detail="Status is required")
        
        # Validate status against enum
        try:
            status_enum = ReturnStatus(status_update["status"])
        except ValueError:
            valid_statuses = [s.value for s in ReturnStatus]
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        controller = PurchaseReturnController(db)
        result = controller.update_purchase_return_status(return_id, status_enum.value)
        return {
            "success": True,
            "message": result["message"],
            "data": {}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))