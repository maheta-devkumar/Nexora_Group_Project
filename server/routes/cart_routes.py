# routes/cart.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user
from controllers.cart_controller import CartController
from schemas.cart_schema import CartSummaryWrapper, CartItemWrapper, CartMessageWrapper

router = APIRouter(prefix="/api/v1/cart", tags=["Cart"])

@router.get("/", response_model=CartSummaryWrapper)
def get_cart(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all items in the current user's cart with calculated totals."""
    controller = CartController(db)
    cart = controller.get_user_cart(current_user.user_id)
    return {"success": True, "message": "Cart retrieved successfully", "data": cart}

@router.post("/add", response_model=CartItemWrapper, status_code=201)
def add_item(
    variant_id: int, 
    quantity: int = Query(1, ge=1), 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Add an item to the cart or increment quantity."""
    controller = CartController(db)
    result = controller.add_to_cart(current_user.user_id, variant_id, quantity)
    return {"success": True, "message": "Item added/updated in cart", "data": result}

@router.put("/update", response_model=CartItemWrapper)
def update_item(
    variant_id: int, 
    quantity: int = Query(..., ge=1, description="New quantity for the item"), 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Set the quantity of a specific item in the cart."""
    controller = CartController(db)
    result = controller.update_cart_item(current_user.user_id, variant_id, quantity)
    return {"success": True, "message": "Cart updated", "data": result}

@router.delete("/remove/{variant_id}", response_model=CartMessageWrapper)
def remove_item(variant_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove a specific item from the cart."""
    controller = CartController(db)
    result = controller.remove_from_cart(current_user.user_id, variant_id)
    return {"success": True, "message": result.get("message"), "data": result}

@router.delete("/clear", response_model=CartMessageWrapper)
def clear_cart_items(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Clear all items from the cart."""
    controller = CartController(db)
    result = controller.clear_cart(current_user.user_id)
    return {"success": True, "message": result["message"], "data": result}