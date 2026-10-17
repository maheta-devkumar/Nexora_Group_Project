from sqlalchemy.orm import Session, joinedload
from models.cart import Cart
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product import Product
from typing import List, Optional
from datetime import datetime

class CartRepository:
    
    @staticmethod
    def get_user_cart_items(db: Session, user_id: int) -> List[Cart]:
        """Get all cart items for a user with joined product and variant data"""
        return db.query(Cart)\
            .options(
                joinedload(Cart.variant).joinedload(ProductVariant.product)
            )\
            .filter(Cart.user_id == user_id)\
            .all()
    
    @staticmethod
    def get_cart_item(db: Session, user_id: int, variant_id: int) -> Optional[Cart]:
        """Get specific cart item"""
        return db.query(Cart).filter(
            Cart.user_id == user_id, 
            Cart.variant_id == variant_id
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
    def create_cart_item(db: Session, cart_data: dict) -> Cart:
        """Create new cart item"""
        cart_item = Cart(**cart_data)
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)
        return cart_item
    
    @staticmethod
    def update_cart_item(db: Session, cart_item: Cart, update_data: dict) -> Cart:
        """Update cart item"""
        for key, value in update_data.items():
            if hasattr(cart_item, key):
                setattr(cart_item, key, value)
        
        db.commit()
        db.refresh(cart_item)
        return cart_item
    
    @staticmethod
    def delete_cart_item(db: Session, cart_item: Cart) -> None:
        """Delete cart item"""
        db.delete(cart_item)
        db.commit()
    
    @staticmethod
    def clear_user_cart(db: Session, user_id: int) -> None:
        """Clear all cart items for user"""
        db.query(Cart).filter(Cart.user_id == user_id).delete()
        db.commit()