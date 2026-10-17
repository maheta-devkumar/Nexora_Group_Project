from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.marketing.offer import Offer
from models.marketing.offer_variant import OfferVariant
from models.product_catalog.product_variant import ProductVariant
from schemas.marketing_schema import OfferCreate
from datetime import datetime
from typing import List, Dict, Any, Optional

class OfferRepository:
    
    @staticmethod
    def get_offer_by_id(db: Session, offer_id: int) -> Optional[Offer]:
        """Get offer by ID"""
        return db.query(Offer).filter(Offer.offer_id == offer_id).first()
    
    @staticmethod
    def get_all_offers(db: Session, skip: int = 0, limit: int = 100) -> List[Offer]:
        """Get all offers"""
        return db.query(Offer).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_active_offers(db: Session) -> List[Offer]:
        """Get currently active offers"""
        now = datetime.now()
        
        # Use SQLAlchemy's and_ for proper datetime comparison
        return db.query(Offer).filter(
            and_(
                Offer.is_active == True,
                Offer.start_date <= now,
                Offer.end_date >= now
            )
        ).all()
    
    @staticmethod
    def create_offer(db: Session, offer_data: Dict[str, Any]) -> Offer:
        """Create a new offer"""
        offer = Offer(**offer_data)
        db.add(offer)
        db.flush()  # Get offer_id without committing
        return offer
    
    @staticmethod
    def create_offer_variant(db: Session, offer_variant_data: Dict[str, Any]) -> OfferVariant:
        """Create offer variant relationship"""
        offer_variant = OfferVariant(**offer_variant_data)
        db.add(offer_variant)
        return offer_variant
    
    @staticmethod
    def update_offer(db: Session, offer_id: int, update_data: Dict[str, Any]) -> Optional[Offer]:
        """Update offer"""
        offer = db.query(Offer).filter(Offer.offer_id == offer_id).first()
        
        if offer:
            for field, value in update_data.items():
                if hasattr(offer, field) and value is not None:
                    setattr(offer, field, value)
            db.commit()
            db.refresh(offer)
        
        return offer
    
    @staticmethod
    def update_offer_status(db: Session, offer_id: int, is_active: bool) -> Optional[Offer]:
        """Update offer status"""
        offer = db.query(Offer).filter(Offer.offer_id == offer_id).first()
        
        if offer:
            offer.is_active = is_active
            db.commit()
            db.refresh(offer)
        
        return offer
    
    @staticmethod
    def delete_offer(db: Session, offer_id: int) -> bool:
        """Delete offer"""
        offer = db.query(Offer).filter(Offer.offer_id == offer_id).first()
        
        if offer:
            db.delete(offer)
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def get_offer_variants(db: Session, offer_id: int) -> List[int]:
        """Get variant IDs for an offer"""
        offer_variants = db.query(OfferVariant).filter(OfferVariant.offer_id == offer_id).all()
        return [ov.variant_id for ov in offer_variants]