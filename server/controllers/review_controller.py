from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.review_service import ReviewService
from schemas.review_schema import ReviewCreate
from typing import Dict, Any

class ReviewController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = ReviewService(db)
    
    def get_product_reviews(self, variant_id: int, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Get product reviews with pagination - RETURN DICT FOR PAGINATION"""
        try:
            return self.service.get_product_reviews(variant_id, page, per_page)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_user_reviews(self, user_id: int, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Get reviews by user"""
        try:
            return self.service.get_user_reviews(user_id, page, per_page)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_review(self, user_id: int, review_data: ReviewCreate) -> Dict[str, Any]:
        """Create a new product review"""
        try:
            return self.service.create_review(user_id, review_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_review(self, user_id: int, review_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing review"""
        try:
            return self.service.update_review(user_id, review_id, update_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_review(self, user_id: int, review_id: int) -> Dict[str, str]:
        """Delete a review"""
        try:
            return self.service.delete_review(user_id, review_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        # ADMIN: Fetch all reviews
    def fetch_all_reviews(self, page: int = 1, per_page: int = 10):
        return self.service.fetch_all_reviews(page, per_page)


    # ADMIN: Update review status
    def update_review_status(self, review_id: int, status: str):
        return self.service.update_review_status(review_id, status)


    # ADMIN: Add reply
    def add_admin_reply(self, admin_id: int, review_id: int, body: str):
        return self.service.add_admin_reply(admin_id, review_id, body)


    # ADMIN: Delete reply
    def delete_reply(self, reply_id: int):
        return self.service.delete_reply(reply_id)


    # ADMIN: Delete review forcefully
    def admin_delete_review(self, review_id: int):
        return self.service.admin_delete_review(review_id)
