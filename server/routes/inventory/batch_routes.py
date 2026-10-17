from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.inventory.batch_controller import BatchController
from schemas.inventory_schema import (
    ProductBatchCreate, ProductBatchUpdate, ProductBatchWrapper, 
    ProductBatchListWrapper, MessageWrapper
)
from models.user import User

router = APIRouter(prefix="/api/v1/inventory/batches", tags=["Inventory - Batches"])

# Admin endpoints
@router.post("", response_model=ProductBatchWrapper)
def create_batch_route(
    batch_data: ProductBatchCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Create a new product batch"""
    controller = BatchController(db)
    batch = controller.create_batch(batch_data)
    return {
        "success": True,
        "message": "Batch created successfully",
        "data": batch
    }

@router.get("", response_model=ProductBatchListWrapper)
def get_all_batches_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all batches"""
    controller = BatchController(db)
    batches = controller.get_all_batches(skip, limit)
    return {
        "success": True,
        "message": "Batches retrieved successfully",
        "data": batches
    }

@router.get("/{batch_id}", response_model=ProductBatchWrapper)
def get_batch_route(
    batch_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Get batch by ID"""
    controller = BatchController(db)
    batch = controller.get_batch(batch_id)
    return {
        "success": True,
        "message": "Batch retrieved successfully",
        "data": batch
    }

@router.patch("/{batch_id}", response_model=ProductBatchWrapper)
def update_batch_route(
    batch_id: int,
    batch_data: ProductBatchUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Update batch information"""
    controller = BatchController(db)
    batch = controller.update_batch(batch_id, batch_data)
    return {
        "success": True,
        "message": "Batch updated successfully",
        "data": batch
    }