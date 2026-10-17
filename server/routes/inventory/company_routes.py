from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.inventory.company_controller import CompanyController
from schemas.inventory_schema import (
    CompanyCreate, CompanyUpdate, CompanyWrapper, 
    CompanyListWrapper, MessageWrapper, AreaListWrapper
)
from models.user import User

router = APIRouter(prefix="/api/v1/inventory/companies", tags=["Inventory - Companies"])

# Admin endpoints
@router.post("", response_model=CompanyWrapper)
def create_company_route(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Create a new company"""
    controller = CompanyController(db)
    company = controller.create_company(company_data)
    return {
        "success": True,
        "message": "Company created successfully",
        "data": company
    }

@router.get("", response_model=CompanyListWrapper)
def get_all_companies_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all companies"""
    controller = CompanyController(db)
    companies = controller.get_all_companies(skip, limit)
    return {
        "success": True,
        "message": "Companies retrieved successfully",
        "data": companies
    }
@router.get("/areas", response_model=AreaListWrapper)
def get_all_areas_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all areas"""
    controller = CompanyController(db)
    areas = controller.get_all_areas(skip, limit)
    return {
        "success": True,
        "message": "Areas retrieved successfully",
        "data": areas
    }

@router.get("/{company_id}", response_model=CompanyWrapper)
def get_company_route(
    company_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Get company by ID"""
    controller = CompanyController(db)
    company = controller.get_company(company_id)
    return {
        "success": True,
        "message": "Company retrieved successfully",
        "data": company
    }

@router.patch("/{company_id}", response_model=CompanyWrapper)
def update_company_route(
    company_id: int,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Update company"""
    controller = CompanyController(db)
    company = controller.update_company(company_id, company_data)
    return {
        "success": True,
        "message": "Company updated successfully",
        "data": company
    }

@router.delete("/{company_id}", response_model=MessageWrapper)
def delete_company_route(
    company_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Delete company"""
    controller = CompanyController(db)
    result = controller.delete_company(company_id)
    return {
        "success": True,
        "message": result["message"],
        "data": {}
    }