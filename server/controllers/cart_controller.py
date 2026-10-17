from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.cart_service import CartService
from typing import Dict, Any

class CartController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = CartService(db)
    
    def get_user_cart(self, user_id: int) -> Dict[str, Any]:
        """Get user cart"""
        try:
            return self.service.get_user_cart(user_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def add_to_cart(self, user_id: int, variant_id: int, quantity: int) -> Dict[str, Any]:
        """Add to cart"""
        try:
            return self.service.add_to_cart(user_id, variant_id, quantity)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_cart_item(self, user_id: int, variant_id: int, quantity: int) -> Dict[str, Any]:
        """Update cart item"""
        try:
            return self.service.update_cart_item(user_id, variant_id, quantity)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def remove_from_cart(self, user_id: int, variant_id: int) -> Dict[str, str]:
        """Remove from cart"""
        try:
            return self.service.remove_from_cart(user_id, variant_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def clear_cart(self, user_id: int) -> Dict[str, str]:
        """Clear cart"""
        try:
            return self.service.clear_cart(user_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))