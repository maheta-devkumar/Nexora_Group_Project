from sqlalchemy.orm import Session
from models.product_catalog.product_brand import ProductBrand
from models.product_catalog.product import Product
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product_image import ProductImage
from models.product_catalog.product_video import ProductVideo
from models.product_catalog.attribute_variant import AttributeVariant
from models.product_catalog.product_review import ProductReview
from models.product_catalog.review_reply import ReviewReply
from models.analytics.product_analytics import ProductAnalytics
from models.analytics.recently_viewed import RecentlyViewed
from models.analytics.review_vote import ReviewVote
from models.marketing.coupon_variant import CouponVariant
from models.marketing.offer_variant import OfferVariant
from models.inventory.batch_item import BatchItem
from models.inventory.stock_movement import StockMovement
from models.order.order_item import OrderItem
from models.order.return_product import ReturnProduct
from models.cart import Cart
from models.wishlist import Wishlist
from typing import List, Optional

class BrandRepository:
    
    @staticmethod
    def get_all_brands(db: Session) -> List[ProductBrand]:
        """Get all brands"""
        return db.query(ProductBrand).all()
    
    @staticmethod
    def get_brand_by_id(db: Session, brand_id: int) -> Optional[ProductBrand]:
        """Get brand by ID"""
        return db.query(ProductBrand).filter(ProductBrand.brand_id == brand_id).first()
    
    @staticmethod
    def get_brand_by_name(db: Session, brand_name: str) -> Optional[ProductBrand]:
        """Get brand by name"""
        return db.query(ProductBrand).filter(ProductBrand.brand_name == brand_name).first()
    
    @staticmethod
    def create_brand(db: Session, brand_data: dict) -> ProductBrand:
        """Create new brand"""
        new_brand = ProductBrand(**brand_data)
        db.add(new_brand)
        db.commit()
        db.refresh(new_brand)
        return new_brand
    
    @staticmethod
    def update_brand(db: Session, brand: ProductBrand, update_data: dict) -> ProductBrand:
        """Update brand"""
        for key, value in update_data.items():
            if hasattr(brand, key):
                setattr(brand, key, value)
        
        db.commit()
        db.refresh(brand)
        return brand
    
    @staticmethod
    def delete_brand(db: Session, brand: ProductBrand) -> None:
        """Delete brand with all related products and their records"""
        brand_id = brand.brand_id
        
        try:
            # Get all products of this brand
            products = db.query(Product).filter(Product.brand_id == brand_id).all()
            
            for product in products:
                product_id = product.product_id
                
                # Get all variants of this product
                variants = db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()
                
                for variant in variants:
                    variant_id = variant.variant_id
                    
                    # Delete analytics records for variant
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
                
                # Delete all variants of the product
                db.query(ProductVariant).filter(ProductVariant.product_id == product_id).delete()
            
            # Delete all products of the brand
            db.query(Product).filter(Product.brand_id == brand_id).delete()
            
            # Finally delete the brand
            db.delete(brand)
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error deleting brand: {str(e)}")