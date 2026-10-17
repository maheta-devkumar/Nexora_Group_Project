from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.offer_service import OfferService
from schemas.marketing_schema import OfferCreate, OfferUpdate
from typing import List, Dict, Any

class OfferController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = OfferService(db)
    
    def create_offer(self, offer_data: OfferCreate) -> Dict[str, Any]:
        """Create a new offer"""
        try:
            return self.service.create_offer(offer_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_offer(self, offer_id: int) -> Dict[str, Any]:
        """Get offer by ID"""
        try:
            return self.service.get_offer(offer_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_offers(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all offers"""
        try:
            return self.service.get_all_offers(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_active_offers(self) -> List[Dict[str, Any]]:
        """Get currently active offers"""
        try:
            return self.service.get_active_offers()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_offer(self, offer_id: int, offer_data: OfferUpdate) -> Dict[str, Any]:
        """Update offer"""
        try:
            return self.service.update_offer(offer_id, offer_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_offer_status(self, offer_id: int, is_active: bool) -> Dict[str, str]:
        """Update offer status"""
        try:
            return self.service.update_offer_status(offer_id, is_active)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_offer(self, offer_id: int) -> Dict[str, str]:
        """Delete offer"""
        try:
            return self.service.delete_offer(offer_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))