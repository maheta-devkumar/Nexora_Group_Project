from sqlalchemy.orm import Session
from models.product_catalog.category import Category
from models.product_catalog.sub_category import SubCategory
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
from models.inventory.purchase_item import PurchaseItem
# ADD THESE MISSING IMPORTS
from models.inventory.purchase_return import PurchaseReturnItem  # ADD THIS
from models.cart import Cart
from models.wishlist import Wishlist
from typing import List, Optional, Dict, Any

class CategoryRepository:
    
    @staticmethod
    def get_all_categories(db: Session) -> List[Category]:
        """Get all categories"""
        return db.query(Category).all()
    
    @staticmethod
    def get_category_by_id(db: Session, category_id: int) -> Optional[Category]:
        """Get category by ID"""
        return db.query(Category).filter(Category.category_id == category_id).first()
    
    @staticmethod
    def get_category_by_name(db: Session, category_name: str) -> Optional[Category]:
        """Get category by name"""
        return db.query(Category).filter(Category.category_name == category_name).first()
    
    @staticmethod
    def get_subcategories_by_category(db: Session, category_id: int) -> List[SubCategory]:
        """Get all subcategories of a category"""
        return db.query(SubCategory).filter(SubCategory.category_id == category_id).all()
    
    @staticmethod
    def get_subcategory_by_id(db: Session, subcategory_id: int) -> Optional[SubCategory]:
        """Get subcategory by ID"""
        return db.query(SubCategory).filter(SubCategory.sub_category_id == subcategory_id).first()
    
    @staticmethod
    def create_category(db: Session, category_data: dict) -> Category:
        """Create new category"""
        new_category = Category(**category_data)
        db.add(new_category)
        db.commit()
        db.refresh(new_category)
        return new_category
    
    @staticmethod
    def create_subcategory(db: Session, subcategory_data: dict) -> SubCategory:
        """Create new subcategory"""
        new_subcategory = SubCategory(**subcategory_data)
        db.add(new_subcategory)
        db.commit()
        db.refresh(new_subcategory)
        return new_subcategory
    
    @staticmethod
    def update_category(db: Session, category: Category, update_data: dict) -> Category:
        """Update category"""
        for key, value in update_data.items():
            if hasattr(category, key):
                setattr(category, key, value)
        
        db.commit()
        db.refresh(category)
        return category
    
    @staticmethod
    def update_subcategory(db: Session, subcategory: SubCategory, update_data: dict) -> SubCategory:
        """Update subcategory"""
        for key, value in update_data.items():
            if hasattr(subcategory, key):
                setattr(subcategory, key, value)
        
        db.commit()
        db.refresh(subcategory)
        return subcategory
    
    @staticmethod
    def delete_category(db: Session, category: Category) -> None:
        """Delete category with all related subcategories, products, and their records"""
        category_id = category.category_id
        
        try:
            # Get all subcategories of this category
            subcategories = db.query(SubCategory).filter(SubCategory.category_id == category_id).all()
            
            for subcategory in subcategories:
                # Delete the subcategory and all related records
                CategoryRepository.delete_subcategory(db, subcategory)
            
            # Finally delete the category
            db.delete(category)
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error deleting category: {str(e)}")
    
    @staticmethod
    def delete_subcategory(db: Session, subcategory: SubCategory) -> None:
        """Delete subcategory with all related products and their records"""
        subcategory_id = subcategory.sub_category_id
        
        try:
            # Get all products of this subcategory
            products = db.query(Product).filter(Product.sub_category_id == subcategory_id).all()
            
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
                    
                    # ADD THESE TWO LINES - Delete purchase-related records
                    db.query(PurchaseItem).filter(PurchaseItem.variant_id == variant_id).delete()
                    db.query(PurchaseReturnItem).filter(PurchaseReturnItem.variant_id == variant_id).delete()  # ADD THIS
                    
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
            
            # Delete all products of the subcategory
            db.query(Product).filter(Product.sub_category_id == subcategory_id).delete()
            
            # Finally delete the subcategory
            db.delete(subcategory)
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error deleting subcategory: {str(e)}")
        
    @staticmethod
    def get_all_subcategories(db: Session) -> List[SubCategory]:
        """Get all subcategories"""
        return db.query(SubCategory).all()
    
    @staticmethod
    def get_subcategory_with_category(db: Session, subcategory_id: int) -> Optional[Dict[str, Any]]:
        """Get subcategory by ID with category details"""
        subcategory = db.query(SubCategory).filter(SubCategory.sub_category_id == subcategory_id).first()
        if not subcategory:
            return None
        
        # Get category details
        category = None
        if subcategory.category_id:
            category = db.query(Category).filter(Category.category_id == subcategory.category_id).first()
        
        return {
            "subcategory": subcategory,
            "category": category
        }