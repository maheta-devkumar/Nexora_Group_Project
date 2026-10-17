from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, or_
from models.product_catalog.product import Product
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product_brand import ProductBrand
from models.product_catalog.sub_category import SubCategory
from models.product_catalog.category import Category
from models.product_catalog.product_image import ProductImage
from models.product_catalog.product_video import ProductVideo
from models.product_catalog.product_review import ProductReview
from models.product_catalog.review_reply import ReviewReply
from models.product_catalog.attribute_variant import AttributeVariant
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
from typing import List, Dict, Any, Optional
from decimal import Decimal
import math

class ProductRepository:
    
    @staticmethod
    def get_all_products_query(db: Session):
        """Base query for products - FIXED: No join in base query"""
        # Just get all products, we'll handle variants separately
        return db.query(Product)
    
    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
        """Get product by ID"""
        return db.query(Product).filter(Product.product_id == product_id).first()
    
    @staticmethod
    def get_product_variants(db: Session, product_id: int) -> List[ProductVariant]:
        """Get all variants of a product"""
        return db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()
    
    @staticmethod
    def get_brand_by_id(db: Session, brand_id: int) -> Optional[ProductBrand]:
        """Get brand by ID"""
        return db.query(ProductBrand).filter(ProductBrand.brand_id == brand_id).first()
    
    @staticmethod
    def get_subcategory_by_id(db: Session, subcategory_id: int) -> Optional[SubCategory]:
        """Get subcategory by ID"""
        return db.query(SubCategory).filter(SubCategory.sub_category_id == subcategory_id).first()
    
    @staticmethod
    def get_category_by_id(db: Session, category_id: int) -> Optional[Category]:
        """Get category by ID"""
        return db.query(Category).filter(Category.category_id == category_id).first()
    
    @staticmethod
    def get_variant_images(db: Session, variant_id: int) -> List[ProductImage]:
        """Get images for a variant"""
        return (
            db.query(ProductImage)
            .filter(ProductImage.variant_id == variant_id)
            .order_by(ProductImage.is_default.desc())
            .all()
        )
    
    @staticmethod
    def get_default_variant(db: Session, product_id: int) -> Optional[ProductVariant]:
        """Get default variant for a product"""
        return db.query(ProductVariant).filter(
            ProductVariant.product_id == product_id,
            ProductVariant.is_default == True
        ).first()
    
    @staticmethod
    def search_products_by_name(db: Session, search_pattern: str, limit: int = 10) -> List[str]:
        """Search products by name for suggestions"""
        return db.query(Product.product_name).filter(
            Product.product_name.ilike(search_pattern)
        ).limit(limit).all()
    
    @staticmethod
    def create_product(db: Session, product_data: dict) -> Product:
        """Create new product"""
        new_product = Product(**product_data)
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return new_product
    
    @staticmethod
    def update_product(db: Session, product: Product, update_data: dict) -> Product:
        """Update product"""
        for key, value in update_data.items():
            if hasattr(product, key):
                setattr(product, key, value)
        
        db.commit()
        db.refresh(product)
        return product
    
    @staticmethod
    def delete_product(db: Session, product: Product) -> None:
        """Delete product with all related records"""
        product_id = product.product_id
        
        try:
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
            
            # Finally delete the product
            db.delete(product)
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error deleting product: {str(e)}")

    @staticmethod
    def get_discounted_products_query(db: Session):
        """Base query for discounted products - FIXED"""
        # Get products that have discounted default variants
        return db.query(Product).join(ProductVariant).filter(
            ProductVariant.is_default == True,
            or_(
                ProductVariant.discount_type != "NONE",
                ProductVariant.discount_value > 0
            )
        )
    
    @staticmethod
    def get_new_arrivals_query(db: Session, days: int = 7):
        """Query for products added in the last N days - FIXED"""
        from datetime import datetime, timedelta
        threshold_date = datetime.now() - timedelta(days=days)
        
        return db.query(Product).filter(
            Product.created_at >= threshold_date
        )
    
    @staticmethod
    def get_trending_products_query(db: Session, limit: int = 6):
        """Query for trending products - FIXED"""
        # For simplicity, return newest products with discounts
        return db.query(Product).join(ProductVariant).filter(
            ProductVariant.is_default == True,
            or_(
                ProductVariant.discount_type != "NONE",
                ProductVariant.discount_value > 0
            )
        ).order_by(Product.created_at.desc()).limit(limit)
    
    @staticmethod
    def get_products_by_category_name(db: Session, category_name: str):
        """Get products by category name - FIXED"""
        return db.query(Product).join(SubCategory).join(Category).filter(
            Category.category_name.ilike(category_name)
        )
    
    # NEW METHOD: Get products with their default variants
    @staticmethod
    def get_products_with_default_variants(db: Session, product_ids: List[int]) -> Dict[int, ProductVariant]:
        """Get default variants for multiple products"""
        variants = db.query(ProductVariant).filter(
            ProductVariant.product_id.in_(product_ids),
            ProductVariant.is_default == True
        ).all()
        
        return {v.product_id: v for v in variants}