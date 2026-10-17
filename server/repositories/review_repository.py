from sqlalchemy.orm import Session
from models.product_catalog.product_review import ProductReview
from typing import Dict, Any, Optional
import math

class ReviewRepository:
    
    @staticmethod
    def get_reviews_by_variant_id(db: Session, variant_id: int, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Get product reviews with pagination - RETURN DICT FOR PAGINATION"""
        query = db.query(ProductReview).filter(ProductReview.variant_id == variant_id).order_by(ProductReview.created_at.desc())
        
        total = query.count()
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        
        if total == 0:
            return {
                "items": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages
            }
        
        offset = (page - 1) * per_page
        reviews = query.offset(offset).limit(per_page).all()
        
        return {
            "items": reviews,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages
        }

    @staticmethod
    def get_reviews_by_user_id(db: Session, user_id: int, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Get reviews by user ID with pagination"""
        query = db.query(ProductReview).filter(ProductReview.user_id == user_id).order_by(ProductReview.created_at.desc())
        
        total = query.count()
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        
        if total == 0:
            return {
                "items": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages
            }
        
        offset = (page - 1) * per_page
        reviews = query.offset(offset).limit(per_page).all()
        
        return {
            "items": reviews,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages
        }
    
    @staticmethod
    def get_review_by_user_and_variant(db: Session, user_id: int, variant_id: int) -> Optional[ProductReview]:
        """Get review by user and variant"""
        return db.query(ProductReview).filter(
            ProductReview.user_id == user_id,
            ProductReview.variant_id == variant_id
        ).first()
    
    @staticmethod
    def create_review(db: Session, review_data: Dict[str, Any]) -> ProductReview:
        """Create a new review"""
        review = ProductReview(**review_data)
        db.add(review)
        db.commit()
        db.refresh(review)
        return review
    
    @staticmethod
    def update_review(db: Session, review_id: int, update_data: Dict[str, Any]) -> Optional[ProductReview]:
        """Update an existing review"""
        review = db.query(ProductReview).filter(ProductReview.review_id == review_id).first()
        
        if review:
            for key, value in update_data.items():
                if hasattr(review, key) and value is not None:
                    setattr(review, key, value)
            db.commit()
            db.refresh(review)
        
        return review
    
    @staticmethod
    def delete_review(db: Session, review_id: int) -> bool:
        """Delete a review"""
        review = db.query(ProductReview).filter(ProductReview.review_id == review_id).first()
        
        if review:
            db.delete(review)
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def get_review_by_id(db: Session, review_id: int) -> Optional[ProductReview]:
        """Get review by ID"""
        return db.query(ProductReview).filter(ProductReview.review_id == review_id).first()

    # ADMIN: Fetch all reviews (pagination)
    @staticmethod
    def fetch_all_reviews(db: Session, page: int = 1, per_page: int = 10):
        query = db.query(ProductReview).order_by(ProductReview.created_at.desc())
        total = query.count()
        offset = (page - 1) * per_page
        reviews = query.offset(offset).limit(per_page).all()

        return {
            "items": reviews,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": math.ceil(total / per_page) if per_page > 0 else 0
        }


    # ADMIN: Update review status
    @staticmethod
    def update_review_status(db: Session, review_id: int, status: str):
        review = db.query(ProductReview).filter(ProductReview.review_id == review_id).first()
        if review:
            review.status = status
            db.commit()
            db.refresh(review)
        return review


    # ADMIN: Add reply
    @staticmethod
    def add_admin_reply(db: Session, review_id: int, admin_id: int, body: str):
        from models.product_catalog.review_reply import ReviewReply
        reply = ReviewReply(review_id=review_id, user_id=admin_id, body=body)
        db.add(reply)
        db.commit()
        db.refresh(reply)
        return reply


    # ADMIN: Delete reply
    @staticmethod
    def delete_reply(db: Session, reply_id: int):
        from models.product_catalog.review_reply import ReviewReply
        reply = db.query(ReviewReply).filter(ReviewReply.reply_id == reply_id).first()
        if reply:
            db.delete(reply)
            db.commit()
            return True
        return False


    # ADMIN: Delete any review (force delete)
    # ADMIN: Delete any review (force delete) - ROBUST VERSION
    @staticmethod
    def admin_delete_review(db: Session, review_id: int):
        try:
            from models.product_catalog.review_reply import ReviewReply
            from models.analytics.review_vote import ReviewVote
            
            # Get the review first
            review = db.query(ProductReview).filter(ProductReview.review_id == review_id).first()
            if not review:
                return False
            
            # Flush any pending changes
            db.flush()
            
            # Delete related records with explicit commit
            vote_count = db.query(ReviewVote).filter(ReviewVote.review_id == review_id).delete(
                synchronize_session='fetch'
            )
            
            reply_count = db.query(ReviewReply).filter(ReviewReply.review_id == review_id).delete(
                synchronize_session='fetch'
            )
            
            # Commit the deletions
            db.commit()
            
            # Refresh session state
            db.expire_all()
            
            # Now delete the review
            # Need to re-query the review since session was expired
            review = db.query(ProductReview).filter(ProductReview.review_id == review_id).first()
            if review:
                db.delete(review)
                db.commit()
            
            return True
            
        except Exception as e:
            db.rollback()
            print(f"Error deleting review {review_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
