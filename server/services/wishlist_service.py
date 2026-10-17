from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.wishlist_repository import WishlistRepository
from typing import List, Dict, Any
from datetime import datetime

class WishlistService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = WishlistRepository()
    
    def get_user_wishlist(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all items in user's wishlist"""
        wishlist_items = self.repository.get_user_wishlist_items(self.db, user_id)
        
        wishlist_data = []
        for item in wishlist_items:
            variant = item.variant
            
            if variant:
                product = variant.product if hasattr(variant, 'product') else None
                
                wishlist_data.append({
                    "variant_id": item.variant_id,
                    "product_id": product.product_id if product else None,
                    "product_name": product.product_name if product else "Unknown Product",
                    "variant_name": variant.variant_name if variant.variant_name else "Default",
                    "price": float(variant.price) if variant.price else 0.0,
                    "added_at": item.added_at
                })
        
        return wishlist_data
    
    def add_to_wishlist(self, user_id: int, variant_id: int) -> Dict[str, Any]:
        """Add item to wishlist"""
        # Check if variant exists
        variant = self.repository.get_product_variant(self.db, variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Product variant not found")
        
        # Check if already in wishlist
        existing = self.repository.get_wishlist_item(self.db, user_id, variant_id)
        if existing:
            raise HTTPException(status_code=400, detail="Item already in wishlist")
        
        # Create wishlist item
        wishlist_item = self.repository.create_wishlist_item(self.db, {
            "user_id": user_id,
            "variant_id": variant_id,
            "added_at": datetime.now()
        })
        
        return {
            "user_id": wishlist_item.user_id,
            "variant_id": wishlist_item.variant_id,
            "added_at": wishlist_item.added_at
        }
    
    def remove_from_wishlist(self, user_id: int, variant_id: int) -> Dict[str, str]:
        """Remove item from wishlist"""
        wishlist_item = self.repository.get_wishlist_item(self.db, user_id, variant_id)
        if not wishlist_item:
            # Return success even if not found (idempotent delete)
            return {"message": "Item removed from wishlist"}
        
        self.repository.delete_wishlist_item(self.db, wishlist_item)
        return {"message": "Item removed from wishlist"}