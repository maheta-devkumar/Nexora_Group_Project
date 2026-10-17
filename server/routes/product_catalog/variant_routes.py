from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.product_catalog.variant_controller import VariantController
from schemas.product_schema import (
    VariantCreate, VariantUpdate, SingleVariantWrapper, MessageWrapper, VariantVideoListWrapper, VariantImageListWrapper
)
from schemas.product_schema import PaginatedProductsWrapper
from decimal import Decimal

router = APIRouter(prefix="/api/v1/variants", tags=["Variants"])

@router.get("/", response_model=PaginatedProductsWrapper)
def list_variants(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    product_id: int = Query(None, description="Filter by product ID"),
    db: Session = Depends(get_db)
):
    """Get all variants with optional product filter (Paginated)"""
    controller = VariantController(db)
    try:
        variants = controller.get_all_variants(page, per_page, product_id)
        return {"success": True, "message": "Variants retrieved successfully", "data": variants}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{variant_id}", response_model=SingleVariantWrapper)
def get_variant(variant_id: int, db: Session = Depends(get_db)):
    """Get variant details"""
    controller = VariantController(db)
    try:
        variant = controller.get_variant_by_id(variant_id)
        return {"success": True, "message": "Variant retrieved successfully", "data": variant}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=SingleVariantWrapper, status_code=201)
def add_variant(
    variant_data: VariantCreate, 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Create new variant"""
    controller = VariantController(db)
    try:
        variant = controller.create_variant(variant_data)
        return {"success": True, "message": "Variant created successfully", "data": variant}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{variant_id}", response_model=SingleVariantWrapper)
def edit_variant(
    variant_id: int, 
    update_data: VariantUpdate, 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Update variant"""
    controller = VariantController(db)
    try:
        variant = controller.update_variant(variant_id, update_data)
        return {"success": True, "message": "Variant updated successfully", "data": variant}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{variant_id}", response_model=MessageWrapper)
def remove_variant(
    variant_id: int, 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Delete variant"""
    controller = VariantController(db)
    try:
        result = controller.delete_variant(variant_id)
        return {"success": True, "message": result.get("message"), "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{variant_id}/stock", response_model=SingleVariantWrapper)
def update_stock(
    variant_id: int,
    quantity: int = Query(..., description="New stock quantity"),
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Update stock quantity"""
    controller = VariantController(db)
    try:
        variant = controller.update_variant_stock(variant_id, quantity)
        return {"success": True, "message": "Stock updated successfully", "data": variant}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{variant_id}/price", response_model=SingleVariantWrapper)
def update_price(
    variant_id: int,
    price: Decimal = Query(..., description="New price"),
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Update price"""
    controller = VariantController(db)
    try:
        variant = controller.update_variant_price(variant_id, price)
        return {"success": True, "message": "Price updated successfully", "data": variant}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{variant_id}/discount", response_model=SingleVariantWrapper)
def set_discount(
    variant_id: int,
    discount_type: str = Query(..., description="PERCENT, FLAT, or NONE"),
    discount_value: Decimal = Query(Decimal("0.00"), description="Discount value"),
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Set discount"""
    controller = VariantController(db)
    try:
        variant = controller.set_variant_discount(variant_id, discount_type, discount_value)
        return {"success": True, "message": "Discount updated successfully", "data": variant}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{variant_id}/status", response_model=SingleVariantWrapper)
def update_status(
    variant_id: int,
    status: str = Query(..., description="ACTIVE, INACTIVE, or OUT_OF_STOCK"),
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Update status"""
    controller = VariantController(db)
    try:
        variant = controller.update_variant_status(variant_id, status)
        return {"success": True, "message": "Status updated successfully", "data": variant}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/product/{product_id}/default/{variant_id}", response_model=MessageWrapper)
def set_default(
    product_id: int,
    variant_id: int,
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Set default variant for product"""
    controller = VariantController(db)
    try:
        result = controller.set_default_variant(product_id, variant_id)
        return {"success": True, "message": result.get("message"), "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/images/{variant_id}", response_model=VariantImageListWrapper)
async def get_variant_images(
    variant_id: int,
    db: Session = Depends(get_db)
):
    controller = VariantController(db)
    images = await controller.get_variant_images(variant_id)
    return {
        "success": True,
        "message": "Images fetched successfully",
        "data": images
    }


@router.get("/videos/{variant_id}", response_model=VariantVideoListWrapper)
async def get_variant_videos(
    variant_id: int,
    db: Session = Depends(get_db)
):
    controller = VariantController(db)
    videos = await controller.get_variant_videos(variant_id)
    return {
        "success": True,
        "message": "Videos fetched successfully",
        "data": videos
    }
