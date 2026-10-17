from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.review_controller import ReviewController
from schemas.review_schema import (
    ReviewCreate, ReviewWrapper, MessageWrapper, ReviewListWrapper  # ADD ReviewListWrapper
)

router = APIRouter(prefix="/api/v1/reviews", tags=["Product Reviews"])

# CHANGE THIS ENDPOINT TO USE ReviewListWrapper INSTEAD OF ListWrapper
@router.get("/{variant_id}", response_model=ReviewListWrapper)
def list_reviews(
    variant_id: int, 
    page: int = Query(1, ge=1), 
    per_page: int = Query(10, ge=1, le=100), 
    db: Session = Depends(get_db)
):
    """Get all reviews for a specific product variant (Paginated)."""
    controller = ReviewController(db)
    reviews_data = controller.get_product_reviews(variant_id, page, per_page)
    return {
        "success": True, 
        "message": "Reviews retrieved successfully", 
        "data": reviews_data
    }

@router.get("/my-reviews", response_model=ReviewListWrapper)
def get_my_reviews(
    page: int = Query(1, ge=1), 
    per_page: int = Query(10, ge=1, le=100), 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User: Get all reviews created by the current user."""
    controller = ReviewController(db)
    reviews_data = controller.get_user_reviews(current_user.user_id, page, per_page)
    return {
        "success": True, 
        "message": "My reviews retrieved successfully", 
        "data": reviews_data
    }

@router.post("/", response_model=ReviewWrapper, status_code=201)
def add_review(
    review_data: ReviewCreate, 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """User: Create a new review for a product variant."""
    controller = ReviewController(db)
    review = controller.create_review(current_user.user_id, review_data)
    return {
        "success": True, 
        "message": "Review added successfully", 
        "data": review
    }

@router.put("/{review_id}", response_model=ReviewWrapper)
def edit_review(
    review_id: int, 
    update_data: dict, 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):   
    """User: Update an existing review."""
    controller = ReviewController(db)
    review = controller.update_review(current_user.user_id, review_id, update_data)
    return {
        "success": True, 
        "message": "Review updated successfully", 
        "data": review
    }

@router.delete("/{review_id}", response_model=MessageWrapper)
def remove_review(
    review_id: int, 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """User: Delete an existing review."""
    controller = ReviewController(db)
    result = controller.delete_review(current_user.user_id, review_id)
    return {
        "success": True, 
        "message": result.get("message"), 
        "data": result
    }
    # ADMIN: Fetch all reviews
@router.get("/admin/all", dependencies=[Depends(is_admin)])
def admin_fetch_all_reviews(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    controller = ReviewController(db)
    data = controller.fetch_all_reviews(page, per_page)
    return {"success": True, "message": "All reviews fetched", "data": data}


# ADMIN: Update review status
@router.put("/admin/{review_id}/status", dependencies=[Depends(is_admin)])
def admin_update_review_status(review_id: int, status: str, db: Session = Depends(get_db)):
    controller = ReviewController(db)
    data = controller.update_review_status(review_id, status)
    return {"success": True, "message": "Status updated", "data": data}


# In your routes/review_routes.py
from pydantic import BaseModel

class ReplyRequest(BaseModel):
    body: str

@router.post("/admin/{review_id}/reply", dependencies=[Depends(is_admin)])
def admin_add_reply(
    review_id: int,
    request: ReplyRequest,  # Change to Pydantic model for JSON body
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    controller = ReviewController(db)
    data = controller.add_admin_reply(current_user.user_id, review_id, request.body)
    return {"success": True, "message": "Reply added", "data": data}

# ADMIN: Delete reply
@router.delete("/admin/reply/{reply_id}", dependencies=[Depends(is_admin)])
def admin_delete_reply(reply_id: int, db: Session = Depends(get_db)):
    controller = ReviewController(db)
    data = controller.delete_reply(reply_id)
    return {"success": True, "message": "Reply deleted", "data": data}


# ADMIN: Delete any review
@router.delete("/admin/{review_id}", dependencies=[Depends(is_admin)])
def admin_delete_review(review_id: int, db: Session = Depends(get_db)):
    controller = ReviewController(db)
    data = controller.admin_delete_review(review_id)
    return {"success": True, "message": "Review deleted", "data": data}
