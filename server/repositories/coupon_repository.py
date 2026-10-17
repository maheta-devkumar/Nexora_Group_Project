from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.marketing.coupon import Coupon
from models.marketing.coupon_variant import CouponVariant
from models.product_catalog.product_variant import ProductVariant
from schemas.marketing_schema import CouponCreate
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional

class CouponRepository:
    
    @staticmethod
    def get_coupon_by_id(db: Session, coupon_id: int) -> Optional[Coupon]:
        """Get coupon by ID"""
        return db.query(Coupon).filter(Coupon.coupon_id == coupon_id).first()
    
    @staticmethod
    def get_coupon_by_code(db: Session, code: str) -> Optional[Coupon]:
        """Get coupon by code"""
        return db.query(Coupon).filter(Coupon.code == code).first()
    
    @staticmethod
    def get_all_coupons(db: Session, skip: int = 0, limit: int = 100) -> List[Coupon]:
        """Get all coupons"""
        return db.query(Coupon).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_active_coupons(db: Session) -> List[Coupon]:
        """Get currently active coupons"""
        now = datetime.now()
        
        # Use SQLAlchemy's and_ for proper datetime comparison
        return db.query(Coupon).filter(
            and_(
                Coupon.is_active == True,
                Coupon.start_date <= now,
                Coupon.end_date >= now
            )
        ).all()
    
    @staticmethod
    def create_coupon(db: Session, coupon_data: Dict[str, Any]) -> Coupon:
        """Create a new coupon"""
        coupon = Coupon(**coupon_data)
        db.add(coupon)
        db.flush()  # Get coupon_id without committing
        return coupon
    
    @staticmethod
    def create_coupon_variant(db: Session, coupon_variant_data: Dict[str, Any]) -> CouponVariant:
        """Create coupon variant relationship"""
        coupon_variant = CouponVariant(**coupon_variant_data)
        db.add(coupon_variant)
        return coupon_variant
    
    @staticmethod
    def update_coupon(db: Session, coupon_id: int, update_data: Dict[str, Any]) -> Optional[Coupon]:
        """Update coupon"""
        coupon = db.query(Coupon).filter(Coupon.coupon_id == coupon_id).first()
        
        if coupon:
            for field, value in update_data.items():
                if hasattr(coupon, field) and value is not None:
                    setattr(coupon, field, value)
            db.commit()
            db.refresh(coupon)
        
        return coupon
    
    @staticmethod
    def update_coupon_status(db: Session, coupon_id: int, is_active: bool) -> Optional[Coupon]:
        """Update coupon status"""
        coupon = db.query(Coupon).filter(Coupon.coupon_id == coupon_id).first()
        
        if coupon:
            coupon.is_active = is_active
            db.commit()
            db.refresh(coupon)
        
        return coupon
    
    @staticmethod
    def delete_coupon(db: Session, coupon_id: int) -> bool:
        """Delete coupon"""
        coupon = db.query(Coupon).filter(Coupon.coupon_id == coupon_id).first()
        
        if coupon:
            db.delete(coupon)
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def get_coupon_variants(db: Session, coupon_id: int) -> List[int]:
        """Get variant IDs for a coupon"""
        coupon_variants = db.query(CouponVariant).filter(CouponVariant.coupon_id == coupon_id).all()
        return [cv.variant_id for cv in coupon_variants]