from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.inventory.supplier_controller import SupplierController
from schemas.inventory_schema import (
    SupplierCreate, SupplierUpdate, SupplierWrapper, 
    SupplierListWrapper, MessageWrapper
)
from models.user import User

router = APIRouter(prefix="/api/v1/inventory/suppliers", tags=["Inventory - Suppliers"])

# Admin endpoints
@router.post("", response_model=SupplierWrapper)
def create_supplier_route(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Create a new supplier"""
    controller = SupplierController(db)
    supplier = controller.create_supplier(supplier_data)
    return {
        "success": True,
        "message": "Supplier created successfully",
        "data": supplier
    }

@router.get("", response_model=SupplierListWrapper)
def get_all_suppliers_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all suppliers"""
    controller = SupplierController(db)
    suppliers = controller.get_all_suppliers(skip, limit)
    return {
        "success": True,
        "message": "Suppliers retrieved successfully",
        "data": suppliers
    }

@router.get("/{supplier_id}", response_model=SupplierWrapper)
def get_supplier_route(
    supplier_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Get supplier by ID"""
    controller = SupplierController(db)
    supplier = controller.get_supplier(supplier_id)
    return {
        "success": True,
        "message": "Supplier retrieved successfully",
        "data": supplier
    }

@router.patch("/{supplier_id}", response_model=SupplierWrapper)
def update_supplier_route(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Update supplier"""
    controller = SupplierController(db)
    supplier = controller.update_supplier(supplier_id, supplier_data)
    return {
        "success": True,
        "message": "Supplier updated successfully",
        "data": supplier
    }

@router.delete("/{supplier_id}", response_model=MessageWrapper)
def delete_supplier_route(
    supplier_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Delete supplier"""
    controller = SupplierController(db)
    result = controller.delete_supplier(supplier_id)
    return {
        "success": True,
        "message": result["message"],
        "data": {}
    }