from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.review_repository import ReviewRepository
from repositories.user_repository import UserRepository
from repositories.product_catalog.variant_repository import VariantRepository
from schemas.review_schema import ReviewCreate, ReviewResponse
from datetime import datetime
from typing import Dict, Any
from services.notification_service import NotificationService

class ReviewService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = ReviewRepository()
        self.user_repo = UserRepository()
        self.variant_repo = VariantRepository()
        self.notification_service = NotificationService(db)
    
    def get_product_reviews(self, variant_id: int, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Get product reviews with pagination - RETURN DICT FOR PAGINATION"""
        pagination_result = self.repository.get_reviews_by_variant_id(self.db, variant_id, page, per_page)
        
        # Convert items to serialized reviews
        serialized_items = [self._serialize_review(review) for review in pagination_result["items"]]
        
        return {
            "items": serialized_items,
            "total": pagination_result["total"],
            "page": pagination_result["page"],
            "per_page": pagination_result["per_page"],
        }

    def get_user_reviews(self, user_id: int, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Get reviews for a specific user"""
        pagination_result = self.repository.get_reviews_by_user_id(self.db, user_id, page, per_page)
        
        items = []
        for review in pagination_result["items"]:
            # enhance with variant info
            variant = self.variant_repo.get_variant_by_id(self.db, review.variant_id)
            review_data = self._serialize_review(review)
            
            # Add product details for the UI
            if variant:
                # Assuming variant has product reference or we need to fetch it
                # For now, let's use what we have. API usually returns variant details.
                # If variant_repo returns joined product data, we use it.
                # If not, we might need to fetch product. 
                # Let's assume basic variant data is enough or modify as needed.
                # Just adding what's available for now.
                review_data["variant_sku"] = variant.sku
                review_data["price"] = variant.price
                
                # Try to get product name if available in variant object (depends on ORM)
                if hasattr(variant, 'product') and variant.product:
                    review_data["product_name"] = variant.product.product_name
                    review_data["product_image"] = variant.images[0].url if variant.images else None
                elif hasattr(variant, 'product_name'): # Some repos flatten it
                     review_data["product_name"] = variant.product_name
            
            items.append(review_data)

        return {
            "items": items,
            "total": pagination_result["total"],
            "page": pagination_result["page"],
            "per_page": pagination_result["per_page"],
            "total_pages": pagination_result["total_pages"]
        }
    
    def create_review(self, user_id: int, review_data: ReviewCreate) -> Dict[str, Any]:
        """Create a new product review"""
        existing_review = self.repository.get_review_by_user_and_variant(self.db, user_id, review_data.variant_id)
        
        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this product"
            )
        
        # Verify variant exists
        variant = self.variant_repo.get_variant_by_id(self.db, review_data.variant_id)
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product variant not found"
            )
        
        # Map the data to match the database model
        review_dict = {
            "user_id": user_id,
            "variant_id": review_data.variant_id,
            "rating": review_data.rating,
            "title": review_data.title,
            "body": review_data.body,
            "images": review_data.images,
            "created_at": datetime.now()
        }
        
        new_review = self.repository.create_review(self.db, review_dict)
        
        # Notify Admins about new review
        try:
            admin_users = self.user_repo.get_admin_users(self.db)
            user = self.user_repo.get_user_by_id(self.db, user_id)
            user_name = f"{user.first_name} {user.last_name}"
            product_name = variant.product.product_name if variant.product else "Unknown Product"
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="⭐ New Product Review",
                    message=f"{user_name} reviewed '{product_name}'. Rating: {review_data.rating}/5. Title: {review_data.title}",
                    type="REVIEW",
                    reference_id=new_review.review_id
                )
        except Exception as e:
            print(f"⚠️ Failed to send review notification: {e}")
            
        return self._serialize_review(new_review)
    
    def update_review(self, user_id: int, review_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing review by the user"""
        review = self.repository.get_review_by_id(self.db, review_id)
        if not review or review.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        updated_review = self.repository.update_review(self.db, review_id, update_data)
        if not updated_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        return self._serialize_review(updated_review)
    
    def delete_review(self, user_id: int, review_id: int) -> Dict[str, str]:
        """Delete a review by the user"""
        review = self.repository.get_review_by_id(self.db, review_id)
        if not review or review.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        success = self.repository.delete_review(self.db, review_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        return {"message": "Review deleted successfully"}
    
    def _serialize_review(self, review) -> Dict[str, Any]:
        """Serialize review data"""
        user = self.user_repo.get_user_by_id(self.db, review.user_id)
        
        return {
            "review_id": review.review_id,
            "user_id": review.user_id,
            "variant_id": review.variant_id,
            "user_name": f"{user.first_name} {user.last_name}" if user else "Unknown User",
            "rating": review.rating,
            "title": review.title,
            "body": review.body,
            "images": review.images,
            "created_at": review.created_at
        }
        # ADMIN: Fetch all reviews
    def fetch_all_reviews(self, page: int = 1, per_page: int = 10):
        result = self.repository.fetch_all_reviews(self.db, page, per_page)
        result["items"] = [self._serialize_review(r) for r in result["items"]]
        return result


    # ADMIN: Update review status
        updated = self.repository.update_review_status(self.db, review_id, status)
        if not updated:
            raise HTTPException(status_code=404, detail="Review not found")
            
        # Notify user about status update
        try:
             review = self.repository.get_review_by_id(self.db, review_id)
             if review:
                # Determine message based on status (assuming APPROVED/REJECTED or similar)
                emoji = "✅" if status == "APPROVED" else "ℹ️"
                
                self.notification_service.send_notification(
                    user_id=review.user_id,
                    title=f"{emoji} Review Status Updated",
                    message=f"Your review for the product has been marked as {status}.",
                    type="REVIEW",
                    reference_id=review.review_id
                )
        except Exception as e:
            print(f"⚠️ Failed to send review status notification: {e}")
            
        return self._serialize_review(updated)


    # ADMIN: Add reply
    def add_admin_reply(self, admin_id: int, review_id: int, body: str):
        reply = self.repository.add_admin_reply(self.db, review_id, admin_id, body)
        
        # Notify user about reply
        try:
             review = self.repository.get_review_by_id(self.db, review_id)
             if review:
                self.notification_service.send_notification(
                    user_id=review.user_id,
                    title="💬 New Reply to Your Review",
                    message=f"Admin replied to your review: '{body[:50]}...'",
                    type="REVIEW",
                    reference_id=review.review_id
                )
        except Exception as e:
            print(f"⚠️ Failed to send review reply notification: {e}")
            
        return {
            "reply_id": reply.reply_id,
            "review_id": reply.review_id,
            "body": reply.body,
            "user_id": reply.user_id,
            "created_at": reply.created_at
        }


    # ADMIN: Delete reply
    def delete_reply(self, reply_id: int):
        success = self.repository.delete_reply(self.db, reply_id)
        if not success:
            raise HTTPException(status_code=404, detail="Reply not found")
        return {"message": "Reply deleted successfully"}


    # ADMIN: Hard delete review
    def admin_delete_review(self, review_id: int):
        success = self.repository.admin_delete_review(self.db, review_id)
        if not success:
            raise HTTPException(status_code=404, detail="Review not found")
        return {"message": "Review deleted successfully (Admin)"}
