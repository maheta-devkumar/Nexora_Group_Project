from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.product_catalog.product_controller import ProductController
from schemas.product_schema import (
    ProductCreate, ProductUpdate, PaginatedProductsWrapper, 
    SingleProductWrapper, MessageWrapper, ProductSingleCreationWrapper,
    SingleVariantWrapper,
    NewArrivalsWrapper, CategoryProductsWrapper, TrendingProductsWrapper  # Add these
)
from models.product_catalog.product_brand import ProductBrand
from models.product_catalog.category import Category
from typing import Optional

router = APIRouter(tags=["Products"], prefix="/api/v1/products")

@router.get("/", response_model=PaginatedProductsWrapper)
def list_products(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    sub_category_id: Optional[int] = Query(None, description="Filter by subcategory ID"),
    brand_ids: Optional[str] = Query(None, description="Filter by Brand IDs (comma-separated list)"), 
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    sort_by: str = Query("newest", description="Sort by: newest, price_low, price_high, name_asc, name_desc"),
    status: str = Query("ACTIVE", description="Filter by status: ACTIVE, INACTIVE, OUT_OF_STOCK"),
    brand: Optional[str] = Query(None, description="Brand name (friendly)"),
    type: Optional[str] = Query(None, description="Category name (friendly)"),
    price_range: Optional[str] = Query(None, description="Price range like '0-1000' or '10000+'"),
    rating: Optional[int] = Query(None, description="Rating filter (not implemented server-side)"),
    search: Optional[str] = Query(None, description="Search products by keyword"),
    has_discount: Optional[bool] = Query(None, description="Filter products with discounts"),
    min_discount_percentage: Optional[float] = Query(None, ge=0, le=100, description="Minimum discount percentage"),
    discount_type: Optional[str] = Query(None, description="Discount type: PERCENT, FLAT")
):
    """Get all products with advanced filters (Paginated)."""
    
    # Handle friendly filters
    if brand and not brand_ids:
        brand_obj = db.query(ProductBrand).filter(ProductBrand.brand_name.ilike(brand)).first()
        if brand_obj:
            brand_ids = str(brand_obj.brand_id)
        
    if type and not category_id:
        cat = db.query(Category).filter(Category.category_name.ilike(type)).first()
        if cat:
            category_id = cat.category_id

    # Handle price range
    if price_range:
        price_range = price_range.strip()
        if '+' in price_range:
            try:
                min_price = float(price_range.replace('+', '').strip())
                max_price = None
            except ValueError:
                min_price = None
                max_price = None
        elif '-' in price_range:
            parts = price_range.split('-')
            try:
                min_price = float(parts[0].strip())
                max_price = float(parts[1].strip())
            except (ValueError, IndexError):
                min_price = None
                max_price = None
        else:
            try:
                min_price = float(price_range)
                max_price = float(price_range)
            except ValueError:
                min_price = None
                max_price = None

    controller = ProductController(db)
    products = controller.get_all_products(
        page=page,
        per_page=per_page,
        category_id=category_id,
        sub_category_id=sub_category_id,
        brand_ids=brand_ids,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        status=status,
        search=search,
        has_discount=has_discount,
        min_discount_percentage=min_discount_percentage,
        discount_type=discount_type
    )
    
    return {"success": True, "message": "Products retrieved successfully", "data": products}

@router.get("/suggestions")
def get_suggestions_endpoint(
    query: str = Query("", description="Search query for suggestions"),
    db: Session = Depends(get_db)
):
    """Get product name suggestions for autocomplete."""
    if not query or not query.strip():
        return {"success": True, "message": "Empty query", "data": []}
        
    controller = ProductController(db)
    try:
        result = controller.get_product_suggestions(query_text=query, limit=10)
        return {"success": True, "message": "Suggestions retrieved successfully", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch suggestions")

@router.get("/{product_id}", response_model=SingleProductWrapper)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product details with all variants"""
    controller = ProductController(db)
    try:
        product = controller.get_product_by_id(product_id)
        return {"success": True, "message": "Product retrieved successfully", "data": product}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/variant/{variant_id}", response_model=SingleVariantWrapper)
def get_variant(variant_id: int, db: Session = Depends(get_db)):
    """Get specific variant details"""
    from controllers.product_catalog.variant_controller import VariantController
    controller = VariantController(db)
    try:
        variant = controller.get_variant_by_id(variant_id)
        return {"success": True, "message": "Variant retrieved successfully", "data": variant}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ProductSingleCreationWrapper)
def add_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Create new product"""
    controller = ProductController(db)
    try:
        product = controller.create_product(product_data)
        return {"success": True, "message": "Product created successfully", "data": product}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{product_id}", response_model=ProductSingleCreationWrapper)
def edit_product(
    product_id: int,
    update_data: ProductUpdate,
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Update product information"""
    controller = ProductController(db)
    try:
        product = controller.update_product(product_id, update_data.model_dump(exclude_unset=True))
        return {"success": True, "message": "Product updated successfully", "data": product}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{product_id}", response_model=MessageWrapper)
def remove_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Delete product"""
    controller = ProductController(db)
    try:
        result = controller.delete_product(product_id)
        return {"success": True, "message": result.get("message"), "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deals", response_model=PaginatedProductsWrapper)
def get_deals(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    min_discount_percentage: Optional[float] = Query(None, ge=0, le=100, description="Minimum discount percentage"),
    discount_type: Optional[str] = Query(None, description="Discount type: PERCENT, FLAT"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    sort_by: str = Query("discount_desc", description="Sort by: discount_desc, newest, price_low, price_high")
):
    """Get discounted products (for Deals/Sale page)"""
    controller = ProductController(db)
    
    # Always filter by has_discount=True for this endpoint
    products = controller.get_all_products(
        page=page,
        per_page=per_page,
        category_id=category_id,
        min_discount_percentage=min_discount_percentage,
        discount_type=discount_type,
        sort_by=sort_by,
        status="ACTIVE",  # Only active products for deals
        has_discount=True  # Always true for deals page
    )
    
    return {"success": True, "message": "Deals retrieved successfully", "data": products}
    # Add to your existing product routes

@router.get("/new-arrivals", response_model=NewArrivalsWrapper)
def get_new_arrivals(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(24, ge=1, le=100, description="Items per page"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    sort_by: str = Query("newest", description="Sort by: newest, price_low, price_high")
):
    """Get newly added products"""
    controller = ProductController(db)
    try:
        products = controller.get_new_arrivals(
            days=7,  # Fixed: hardcode days or make optional
            page=page,
            per_page=per_page,
            category_id=category_id,
            sort_by=sort_by
        )
        return {
            "success": True,
            "message": "New arrivals retrieved successfully",
            "data": products
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/trending", response_model=TrendingProductsWrapper)
def get_trending_products(
    db: Session = Depends(get_db),
    limit: int = Query(6, ge=1, le=20, description="Number of trending products")
):
    """Get trending products"""
    controller = ProductController(db)
    try:
        products = controller.get_trending_products(limit)
        return {
            "success": True,
            "message": "Trending products retrieved successfully",
            "data": {
                "items": products,
                "total": len(products)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/category/{category_name}", response_model=CategoryProductsWrapper)
def get_products_by_category(
    category_name: str,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(24, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("newest", description="Sort by: newest, price_low, price_high")
):
    """Get products by category name"""
    controller = ProductController(db)
    try:
        products = controller.get_products_by_category_name(
            category_name=category_name,
            page=page,
            per_page=per_page,
            sort_by=sort_by
        )
        return {
            "success": True,
            "message": f"Products in {category_name} retrieved successfully",
            "data": products
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

