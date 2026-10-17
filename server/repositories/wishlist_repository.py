from sqlalchemy.orm import Session, joinedload
from models.wishlist import Wishlist
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product import Product
from typing import List, Optional
from datetime import datetime

class WishlistRepository:
    
    @staticmethod
    def get_user_wishlist_items(db: Session, user_id: int) -> List[Wishlist]:
        """Get all wishlist items for a user with joined product and variant data"""
        return db.query(Wishlist)\
            .options(
                joinedload(Wishlist.variant).joinedload(ProductVariant.product)
            )\
            .filter(Wishlist.user_id == user_id)\
            .all()
    
    @staticmethod
    def get_wishlist_item(db: Session, user_id: int, variant_id: int) -> Optional[Wishlist]:
        """Get specific wishlist item"""
        return db.query(Wishlist).filter(
            Wishlist.user_id == user_id, 
            Wishlist.variant_id == variant_id
        ).first()
    
    @staticmethod
    def get_product_variant(db: Session, variant_id: int) -> Optional[ProductVariant]:
        """Get product variant with product data"""
        return db.query(ProductVariant)\
            .options(joinedload(ProductVariant.product))\
            .filter(ProductVariant.variant_id == variant_id)\
            .first()
    
    @staticmethod
    def get_product(db: Session, product_id: int) -> Optional[Product]:
        """Get product"""
        return db.query(Product).filter(Product.product_id == product_id).first()
    
    @staticmethod
    def create_wishlist_item(db: Session, wishlist_data: dict) -> Wishlist:
        """Create new wishlist item"""
        wishlist_item = Wishlist(**wishlist_data)
        db.add(wishlist_item)
        db.commit()
        db.refresh(wishlist_item)
        return wishlist_item
    
    @staticmethod
    def delete_wishlist_item(db: Session, wishlist_item: Wishlist) -> None:
        """Delete wishlist item"""
        db.delete(wishlist_item)
        db.commit()