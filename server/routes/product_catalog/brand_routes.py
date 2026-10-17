from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.product_catalog.brand_controller import BrandController
from schemas.product_catalog_schema import (
    BrandCreate, ListBrandWrapper, SingleBrandWrapper, MessageWrapper
)

router = APIRouter(prefix="/api/v1/brands", tags=["Brands"])

@router.get("/", response_model=ListBrandWrapper)
def list_brands(db: Session = Depends(get_db)):
    """Get all brands"""
    controller = BrandController(db)
    try:
        brands = controller.get_all_brands()
        return {"success": True, "message": "Brands retrieved successfully", "data": brands}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{brand_id}", response_model=SingleBrandWrapper)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    """Get brand by ID"""
    controller = BrandController(db)
    try:
        brand = controller.get_brand_by_id(brand_id)
        return {"success": True, "message": "Brand retrieved successfully", "data": brand}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=SingleBrandWrapper, status_code=201)
def add_brand(brand_data: BrandCreate, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Create brand"""
    controller = BrandController(db)
    try:
        brand = controller.create_brand(brand_data)
        return {"success": True, "message": "Brand created successfully", "data": brand}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{brand_id}", response_model=SingleBrandWrapper)
def edit_brand(brand_id: int, update_data: dict, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Update brand"""
    controller = BrandController(db)
    try:
        brand = controller.update_brand(brand_id, update_data)
        return {"success": True, "message": "Brand updated successfully", "data": brand}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{brand_id}", response_model=MessageWrapper)
def remove_brand(brand_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Delete brand"""
    controller = BrandController(db)
    try:
        result = controller.delete_brand(brand_id)
        return {"success": True, "message": result.get("message"), "data": result}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))