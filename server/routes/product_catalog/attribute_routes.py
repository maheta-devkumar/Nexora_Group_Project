from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.product_catalog.attribute_controller import AttributeController
from schemas.product_catalog_schema import (
    AttributeCreate, AttributeListWrapper, VariantAttributeListWrapper, 
    SingleAttributeWrapper, MessageWrapper
)

router = APIRouter(prefix="/api/v1/attributes", tags=["Product Attributes"])

@router.get("/", response_model=AttributeListWrapper)
def list_attributes(db: Session = Depends(get_db)):
    """Get all available attributes."""
    controller = AttributeController(db)
    attributes = controller.get_all_attributes()
    return {"success": True, "message": "Attributes retrieved successfully", "data": attributes}

@router.get("/variant/{variant_id}", response_model=VariantAttributeListWrapper)
def get_variant_attrs(variant_id: int, db: Session = Depends(get_db)):
    """Get all assigned attributes and values for a specific variant."""
    controller = AttributeController(db)
    attributes = controller.get_variant_attributes(variant_id)
    return {"success": True, "message": "Variant attributes retrieved successfully", "data": attributes}

@router.post("/", response_model=SingleAttributeWrapper, status_code=201)
def add_attribute(attribute_data: AttributeCreate, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Create a new global attribute."""
    controller = AttributeController(db)
    attribute = controller.create_attribute(attribute_data)
    return {"success": True, "message": "Attribute created successfully", "data": attribute}

@router.post("/assign", response_model=MessageWrapper)
def assign_attribute(variant_id: int, attribute_id: int, value: str, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Assign a value for a specific attribute to a variant."""
    controller = AttributeController(db)
    result = controller.assign_attribute_to_variant(variant_id, attribute_id, value)
    return {"success": True, "message": result.get("message"), "data": result}

@router.put("/{variant_id}/update/{attribute_id}", response_model=MessageWrapper)
def update_attribute_value(variant_id: int, attribute_id: int, value: str, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Update the value for an existing variant attribute."""
    controller = AttributeController(db)
    result = controller.update_variant_attribute_value(variant_id, attribute_id, value)
    return {"success": True, "message": result.get("message"), "data": result}

@router.delete("/{variant_id}/remove/{attribute_id}", response_model=MessageWrapper)
def remove_attribute(variant_id: int, attribute_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Remove a specific attribute from a variant."""
    controller = AttributeController(db)
    result = controller.remove_attribute_from_variant(variant_id, attribute_id)
    return {"success": True, "message": result.get("message"), "data": result}

# Add these routes to the router

@router.put("/{attribute_id}", response_model=SingleAttributeWrapper)
def update_attribute(attribute_id: int, attribute_data: AttributeCreate, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Update an existing attribute."""
    controller = AttributeController(db)
    attribute = controller.update_attribute(attribute_id, attribute_data)
    return {"success": True, "message": "Attribute updated successfully", "data": attribute}

@router.delete("/{attribute_id}", response_model=MessageWrapper)
def delete_attribute(attribute_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Delete an attribute."""
    controller = AttributeController(db)
    result = controller.delete_attribute(attribute_id)
    return {"success": True, "message": result.get("message"), "data": result}