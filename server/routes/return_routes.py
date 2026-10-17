from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.return_controller import ReturnController
from schemas.delivery_schema import (
    ReturnRequestWrapper, ReturnWithItemsWrapper, ReturnListWrapper, 
    MessageWrapper, ReturnRequestCreate, ReturnRequestUpdate
)
from models.user import User

router = APIRouter(prefix="/api/v1/returns", tags=["Returns"])

# Customer endpoints
@router.post("/request", response_model=ReturnRequestWrapper)
def create_return(
    return_data: ReturnRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer: Create a return request"""
    controller = ReturnController(db)
    return_req = controller.create_return_request(
        order_id=return_data.order_id, 
        user_id=current_user.user_id, 
        return_data=return_data.model_dump()
    )
    return {
        "success": True,
        "message": "Return request created successfully",
        "data": return_req
    }

@router.get("/my-returns", response_model=ReturnListWrapper)
def get_my_returns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Customer: Get my return requests"""
    controller = ReturnController(db)
    returns = controller.get_user_returns(current_user.user_id, page, per_page)
    return {
        "success": True,
        "message": "Return requests retrieved successfully",
        "data": returns["returns"]
    }

@router.get("/{return_id}", response_model=ReturnWithItemsWrapper)
def get_return_detail(
    return_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer: Get return request details"""
    controller = ReturnController(db)
    return_detail = controller.get_return_details(return_id, current_user.user_id)
    return {
        "success": True,
        "message": "Return details retrieved successfully",
        "data": return_detail
    }

# Admin endpoints
@router.patch("/{return_id}/status", response_model=MessageWrapper)
def update_return_status_admin(
    return_id: int,
    status_update: ReturnRequestUpdate,
    admin = Depends(is_admin),
    db: Session = Depends(get_db)
):
    """Admin: Update return status"""
    controller = ReturnController(db)
    result = controller.update_return_status(return_id, status_update.status)
    return {
        "success": True,
        "message": result["message"],
        "data": {}
    }

@router.get("/admin/all", response_model=ReturnListWrapper)
def get_all_returns_admin_route(
    admin = Depends(is_admin),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str = Query(None)
):
    """Admin: Get all return requests"""
    controller = ReturnController(db)
    returns = controller.get_all_returns_admin(page, per_page, status)
    return {
        "success": True,
        "message": "Returns retrieved successfully",
        "data": returns["returns"]
    }