from sqlalchemy.orm import Session
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product import Product
from models.product_catalog.product_image import ProductImage
from models.product_catalog.product_video import ProductVideo
from models.product_catalog.attribute_variant import AttributeVariant
from models.product_catalog.product_attribute import ProductAttribute
from models.analytics.product_analytics import ProductAnalytics
from models.analytics.recently_viewed import RecentlyViewed
from models.marketing.coupon_variant import CouponVariant
from models.marketing.offer_variant import OfferVariant
from models.product_catalog.product_review import ProductReview
from models.product_catalog.review_reply import ReviewReply
from models.analytics.review_vote import ReviewVote
from models.inventory.batch_item import BatchItem
from models.inventory.stock_movement import StockMovement
from models.order.order_item import OrderItem
from models.order.return_product import ReturnProduct
from models.cart import Cart
from models.wishlist import Wishlist
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
import math

class VariantRepository:
    
    @staticmethod
    def get_all_variants_query(db: Session, product_id: Optional[int] = None):
        """Base query for variants"""
        query = db.query(ProductVariant)
        if product_id:
            query = query.filter(ProductVariant.product_id == product_id)
        return query
    
    @staticmethod
    def get_variant_by_id(db: Session, variant_id: int) -> Optional[ProductVariant]:
        """Get variant by ID"""
        return db.query(ProductVariant).filter(ProductVariant.variant_id == variant_id).first()
    
    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
        """Get product by ID"""
        return db.query(Product).filter(Product.product_id == product_id).first()
    
    @staticmethod
    def get_variant_images(db: Session, variant_id: int) -> List[ProductImage]:
        """Get images for variant"""
        return db.query(ProductImage).filter(ProductImage.variant_id == variant_id).all()
    
    @staticmethod
    def get_variant_attributes(db: Session, variant_id: int) -> List:
        """Get attributes for variant"""
        return db.query(ProductAttribute, AttributeVariant.value).join(
            AttributeVariant,
            ProductAttribute.attribute_id == AttributeVariant.attribute_id
        ).filter(AttributeVariant.variant_id == variant_id).all()
    
    @staticmethod
    def count_product_variants(db: Session, product_id: int) -> int:
        """Count variants for a product"""
        return db.query(ProductVariant).filter(ProductVariant.product_id == product_id).count()
    
    @staticmethod
    def create_variant(db: Session, variant_data: dict) -> ProductVariant:
        """Create new variant"""
        new_variant = ProductVariant(**variant_data)
        db.add(new_variant)
        db.commit()
        db.refresh(new_variant)
        return new_variant
    
    @staticmethod
    def update_variant(db: Session, variant: ProductVariant, update_data: dict) -> ProductVariant:
        """Update variant"""
        for key, value in update_data.items():
            if hasattr(variant, key):
                setattr(variant, key, value)
        
        variant.updated_at = datetime.now()
        db.commit()
        db.refresh(variant)
        return variant
    
    @staticmethod
    def delete_variant(db: Session, variant: ProductVariant) -> None:
        """Delete variant with all related records"""
        variant_id = variant.variant_id
        
        try:
            # Delete analytics records
            db.query(ProductAnalytics).filter(ProductAnalytics.variant_id == variant_id).delete()
            
            # Delete recently viewed records
            db.query(RecentlyViewed).filter(RecentlyViewed.variant_id == variant_id).delete()
            
            # Delete marketing associations
            db.query(CouponVariant).filter(CouponVariant.variant_id == variant_id).delete()
            db.query(OfferVariant).filter(OfferVariant.variant_id == variant_id).delete()
            
            # Delete review votes and replies
            reviews = db.query(ProductReview).filter(ProductReview.variant_id == variant_id).all()
            for review in reviews:
                # Delete review votes
                db.query(ReviewVote).filter(ReviewVote.review_id == review.review_id).delete()
                # Delete review replies
                db.query(ReviewReply).filter(ReviewReply.review_id == review.review_id).delete()
            
            # Delete reviews
            db.query(ProductReview).filter(ProductReview.variant_id == variant_id).delete()
            
            # Delete inventory records
            db.query(BatchItem).filter(BatchItem.variant_id == variant_id).delete()
            db.query(StockMovement).filter(StockMovement.variant_id == variant_id).delete()
            
            # Delete order-related records
            db.query(OrderItem).filter(OrderItem.variant_id == variant_id).delete()
            db.query(ReturnProduct).filter(ReturnProduct.variant_id == variant_id).delete()
            
            # Delete shopping records
            db.query(Cart).filter(Cart.variant_id == variant_id).delete()
            db.query(Wishlist).filter(Wishlist.variant_id == variant_id).delete()
            
            # Delete images and videos
            db.query(ProductImage).filter(ProductImage.variant_id == variant_id).delete()
            db.query(ProductVideo).filter(ProductVideo.variant_id == variant_id).delete()
            
            # Delete attributes
            db.query(AttributeVariant).filter(AttributeVariant.variant_id == variant_id).delete()
            
            # Finally delete the variant
            db.delete(variant)
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error deleting variant: {str(e)}")
    
    @staticmethod
    def update_variant_default_status(db: Session, product_id: int, is_default: bool = False) -> None:
        """Update default status for all variants of a product"""
        db.query(ProductVariant).filter(
            ProductVariant.product_id == product_id
        ).update({"is_default": is_default})
        db.commit()
    
    @staticmethod
    def get_another_variant(db: Session, product_id: int, exclude_variant_id: int) -> Optional[ProductVariant]:
        """Get another variant for the same product"""
        return db.query(ProductVariant).filter(
            ProductVariant.product_id == product_id,
            ProductVariant.variant_id != exclude_variant_id
        ).first()
    
    @staticmethod
    def get_all_images_by_variant(db: Session, variant_id: int):
        return (
            db.query(ProductImage)
            .filter(ProductImage.variant_id == variant_id)
            .order_by(ProductImage.is_default.desc())
            .all()
        )
    
    @staticmethod
    def get_all_videos_by_variant(db: Session, variant_id: int):
        return (
            db.query(ProductVideo)
            .filter(ProductVideo.variant_id == variant_id)
            .all()
        )