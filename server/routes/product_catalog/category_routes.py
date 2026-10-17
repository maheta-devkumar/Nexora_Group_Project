from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.product_catalog.category_controller import CategoryController
from schemas.product_catalog_schema import (
    CategoryCreate, SubCategoryCreate, CategoryWithSubcategoriesWrapper,
    SubCategoryDetailWrapper, ListCategoryWrapper, SingleCategoryWrapper,
    NestedCategoryWrapper, SingleSubCategoryWrapper, MessageWrapper,
    ListWrapper, ListSubCategoryWrapper, SubCategoryDetail,
    SingleSubCategoryDetailWrapper
)

router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])


# ----------------------------------------------------
# CATEGORY ROUTES
# ----------------------------------------------------

@router.get("/", response_model=ListCategoryWrapper)
def list_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    controller = CategoryController(db)
    categories = controller.get_all_categories()
    return {"success": True, "message": "Categories retrieved successfully", "data": categories}


@router.post("/", response_model=SingleCategoryWrapper, status_code=201)
def add_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    admin=Depends(is_admin)
):
    """Admin: Create category"""
    controller = CategoryController(db)
    category = controller.create_category(category_data)
    return {"success": True, "message": "Category created successfully", "data": category}


@router.put("/edit/{category_id}", response_model=SingleCategoryWrapper)
def edit_category(
    category_id: int,
    update_data: dict,
    db: Session = Depends(get_db),
    admin=Depends(is_admin)
):
    """Admin: Update category"""
    controller = CategoryController(db)
    category = controller.update_category(category_id, update_data)
    return {"success": True, "message": "Category updated successfully", "data": category}


@router.delete("/delete/{category_id}", response_model=MessageWrapper)
def remove_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin=Depends(is_admin)
):
    """Admin: Delete category"""
    controller = CategoryController(db)
    result = controller.delete_category(category_id)
    return {"success": True, "message": result.get("message"), "data": result}


# ----------------------------------------------------
# SUBCATEGORY ROUTES
# ----------------------------------------------------

@router.get("/subcategories", response_model=ListSubCategoryWrapper)
def list_all_subcategories(db: Session = Depends(get_db)):
    """Get ALL subcategories"""
    controller = CategoryController(db)
    subcategories = controller.get_all_subcategories()

    return {
        "success": True,
        "message": f"Retrieved {len(subcategories)} subcategories",
        "data": subcategories
    }


@router.post("/subcategory", response_model=SingleSubCategoryWrapper, status_code=201)
def add_subcategory(
    subcategory_data: SubCategoryCreate,
    db: Session = Depends(get_db),
    admin=Depends(is_admin)
):
    """Admin: Create subcategory"""
    controller = CategoryController(db)
    subcategory = controller.create_subcategory(subcategory_data)
    return {"success": True, "message": "Subcategory created successfully", "data": subcategory}


@router.put("/subcategory/edit/{subcategory_id}", response_model=SingleSubCategoryWrapper)
def edit_subcategory(
    subcategory_id: int,
    update_data: dict,
    db: Session = Depends(get_db),
    admin=Depends(is_admin)
):
    """Admin: Update subcategory"""
    controller = CategoryController(db)
    subcategory = controller.update_subcategory(subcategory_id, update_data)
    return {"success": True, "message": "Subcategory updated successfully", "data": subcategory}


@router.delete("/subcategory/delete/{subcategory_id}", response_model=MessageWrapper)
def remove_subcategory(
    subcategory_id: int,
    db: Session = Depends(get_db),
    admin=Depends(is_admin)
):
    """Admin: Delete subcategory"""
    controller = CategoryController(db)
    result = controller.delete_subcategory(subcategory_id)
    return {"success": True, "message": result.get("message"), "data": result}


@router.get("/subcategory/{subcategory_id}", response_model=SingleSubCategoryDetailWrapper)
def get_subcategory(subcategory_id: int, db: Session = Depends(get_db)):
    """Get single subcategory"""
    controller = CategoryController(db)
    subcategory = controller.get_subcategory_by_id(subcategory_id)
    return {
        "success": True,
        "message": "Subcategory retrieved successfully",
        "data": subcategory
    }


# ----------------------------------------------------
# CATEGORY-SUBCATEGORY RELATION ROUTE
# ----------------------------------------------------

@router.get("/{category_id}/subcategories", response_model=CategoryWithSubcategoriesWrapper)
def get_category_subs(category_id: int, db: Session = Depends(get_db)):
    """Get category with its subcategories"""
    controller = CategoryController(db)
    result = controller.get_category_with_subcategories(category_id)

    return {
        "success": True,
        "message": "Category with subcategories retrieved successfully",
        "data": result
    }


# ----------------------------------------------------
# LAST: DYNAMIC CATEGORY ROUTE
# (Dynamic routes MUST be last to avoid collisions)
# ----------------------------------------------------

@router.get("/{category_id}", response_model=SingleCategoryWrapper)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get category by ID"""
    controller = CategoryController(db)
    category = controller.get_category_by_id(category_id)
    return {"success": True, "message": "Category retrieved successfully", "data": category}
