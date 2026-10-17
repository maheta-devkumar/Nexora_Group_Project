from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.wishlist_service import WishlistService
from typing import List, Dict, Any

class WishlistController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = WishlistService(db)
    
    def get_user_wishlist(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user wishlist"""
        try:
            return self.service.get_user_wishlist(user_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def add_to_wishlist(self, user_id: int, variant_id: int) -> Dict[str, Any]:
        """Add to wishlist"""
        try:
            return self.service.add_to_wishlist(user_id, variant_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def remove_from_wishlist(self, user_id: int, variant_id: int) -> Dict[str, str]:
        """Remove from wishlist"""
        try:
            return self.service.remove_from_wishlist(user_id, variant_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))