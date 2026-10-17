from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.inventory.stock_controller import StockController
from schemas.inventory_schema import (
    StockMovementListWrapper, StockSummaryListWrapper, MessageWrapper
)
from models.user import User

router = APIRouter(prefix="/api/v1/inventory/stock", tags=["Inventory - Stock"])

# Admin endpoints
@router.get("/movements", response_model=StockMovementListWrapper)
def get_stock_movements_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all stock movements"""
    controller = StockController(db)
    movements = controller.get_stock_movements(skip, limit)
    return {
        "success": True,
        "message": "Stock movements retrieved successfully",
        "data": movements
    }

@router.get("/summary", response_model=StockSummaryListWrapper)
def get_stock_summary_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Get current stock summary"""
    controller = StockController(db)
    summary = controller.get_stock_summary()
    return {
        "success": True,
        "message": "Stock summary retrieved successfully",
        "data": summary
    }

@router.post("/adjust", response_model=MessageWrapper)
def adjust_stock_route(
    adjustment_data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    current_user: User = Depends(get_current_user)
):
    """Manually adjust stock"""
    controller = StockController(db)
    result = controller.adjust_stock(adjustment_data, current_user.user_id)
    return {
        "success": True,
        "message": result["message"],
        "data": {}
    }

@router.get("/movements/variant/{variant_id}", response_model=StockMovementListWrapper)
def get_variant_movements_route(
    variant_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get stock movements for a specific variant"""
    controller = StockController(db)
    movements = controller.get_variant_movements(variant_id, skip, limit)
    return {
        "success": True,
        "message": "Variant movements retrieved successfully",
        "data": movements
    }