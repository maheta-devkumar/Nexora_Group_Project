# routes/wishlist.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user
from controllers.wishlist_controller import WishlistController
from schemas.wishlist_schema import WishlistListWrapper, WishlistItemWrapper, MessageWrapper

router = APIRouter(prefix="/api/v1/wishlist", tags=["Wishlist"])

@router.get("/", response_model=WishlistListWrapper)
def get_wishlist(
    page: int = Query(1, ge=1), 
    per_page: int = Query(20, ge=1, le=100), 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Get all items in the current user's wishlist."""
    controller = WishlistController(db)
    wishlist = controller.get_user_wishlist(current_user.user_id)
    return {"success": True, "message": "Wishlist retrieved successfully", "data": wishlist}

@router.post("/add", response_model=WishlistItemWrapper, status_code=201)
def add_item(variant_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Add an item to the wishlist."""
    controller = WishlistController(db)
    result = controller.add_to_wishlist(current_user.user_id, variant_id)
    return {"success": True, "message": "Item added to wishlist", "data": result}

@router.delete("/remove/{variant_id}", response_model=MessageWrapper)
def remove_item(variant_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove an item from the wishlist."""
    controller = WishlistController(db)
    result = controller.remove_from_wishlist(current_user.user_id, variant_id)
    return {"success": True, "message": result.get("message"), "data": result}