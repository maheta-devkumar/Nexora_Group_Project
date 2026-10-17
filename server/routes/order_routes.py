from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.order_controller import OrderController
from schemas.order_schema import (
    OrderCreate, OrderUpdate, OrderWrapper, OrderListWrapper,
    OrderReturnCreate, OrderReturnWrapper, MessageWrapper
)
from models.user import User
from typing import Optional

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])

# Customer endpoints
@router.post("/", response_model=OrderWrapper)
def place_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Place a new order from cart"""
    try:
        
        controller = OrderController(db)
        order = controller.create_order(order_data, current_user.user_id)
        
        return {
            "success": True,
            "message": "Order placed successfully",
            "data": order
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/my", response_model=OrderListWrapper)
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None)
):
    """Get all orders for current user"""
    try:
        
        controller = OrderController(db)
        orders = controller.get_user_orders(current_user.user_id, page, per_page)
        
        
        return {
            "success": True,
            "message": "Orders retrieved successfully",
            "data": orders["orders"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delivery endpoints - MUST COME BEFORE PARAMETERIZED ROUTES
@router.get("/assigned", response_model=OrderListWrapper)
def get_assigned_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delivery: Get assigned orders (placeholder - will be implemented in delivery module)"""
    # This would require checking if user is a delivery person
    # For now, return empty list
    return {
        "success": True,
        "message": "Assigned orders retrieved successfully",
        "data": []
    }

# PARAMETERIZED ROUTES SHOULD COME LAST
@router.get("/{order_id}", response_model=OrderWrapper)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order details"""
    controller = OrderController(db)
    order = controller.get_order_by_id(order_id, current_user.user_id)
    return {
        "success": True,
        "message": "Order retrieved successfully",
        "data": order
    }

@router.patch("/{order_id}/cancel", response_model=MessageWrapper)
def cancel_user_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an order"""
    controller = OrderController(db)
    result = controller.cancel_order(order_id, current_user.user_id)
    return {
        "success": True,
        "message": result["message"],
        "data": result
    }

@router.post("/{order_id}/return", response_model=OrderReturnWrapper)
def request_order_return(
    order_id: int,
    return_data: OrderReturnCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request return for an order"""
    controller = OrderController(db)
    # Convert Pydantic model to dict and call with correct parameters
    return_request = controller.create_return_request(
        order_id=order_id,
        user_id=current_user.user_id,
        return_data=return_data.model_dump()
    )
    return {
        "success": True,
        "message": "Return request submitted successfully",
        "data": return_request
    }

@router.get("/{order_id}/invoice")
def download_invoice(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download order invoice"""
    controller = OrderController(db)
    pdf_buffer = controller.generate_invoice(order_id, current_user.user_id)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{order_id}.pdf"}
    )

# Admin endpoints
@router.get("/", response_model=OrderListWrapper)
def list_all_orders(
    db: Session = Depends(get_db),
    admin = Depends(is_admin),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None)
):
    """Admin: Get all orders"""
    controller = OrderController(db)
    orders = controller.get_all_orders(page, per_page, status)
    return {
        "success": True,
        "message": "Orders retrieved successfully",
        "data": orders["orders"]
    }

@router.patch("/{order_id}/status", response_model=OrderWrapper)
def update_order_status_admin(
    order_id: int,
    status_update: OrderUpdate,
    db: Session = Depends(get_db),
    admin = Depends(is_admin),
    current_user: User = Depends(get_current_user)
):
    """Admin: Update order status"""
    if not status_update.order_status:
        raise HTTPException(status_code=400, detail="Order status is required")
    
    controller = OrderController(db)
    order = controller.update_order_status(order_id, status_update.order_status, current_user.user_id)
    return {
        "success": True,
        "message": "Order status updated successfully",
        "data": order
    }