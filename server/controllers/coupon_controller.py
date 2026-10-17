from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.coupon_service import CouponService
from schemas.marketing_schema import CouponCreate, CouponUpdate
from decimal import Decimal
from typing import List, Dict, Any

class CouponController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = CouponService(db)
    
    def create_coupon(self, coupon_data: CouponCreate) -> Dict[str, Any]:
        """Create a new coupon"""
        try:
            return self.service.create_coupon(coupon_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_coupon(self, coupon_id: int) -> Dict[str, Any]:
        """Get coupon by ID"""
        try:
            return self.service.get_coupon(coupon_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_coupons(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all coupons"""
        try:
            return self.service.get_all_coupons(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_active_coupons(self) -> List[Dict[str, Any]]:
        """Get currently active coupons"""
        try:
            return self.service.get_active_coupons()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_coupon(self, coupon_id: int, coupon_data: CouponUpdate) -> Dict[str, Any]:
        """Update coupon"""
        try:
            return self.service.update_coupon(coupon_id, coupon_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_coupon_status(self, coupon_id: int, is_active: bool) -> Dict[str, str]:
        """Update coupon status"""
        try:
            return self.service.update_coupon_status(coupon_id, is_active)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_coupon(self, coupon_id: int) -> Dict[str, str]:
        """Delete coupon"""
        try:
            return self.service.delete_coupon(coupon_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def validate_coupon(self, code: str, variant_ids: List[int], order_total: Decimal) -> Dict[str, Any]:
        """Validate coupon for checkout"""
        try:
            return self.service.validate_coupon(code, variant_ids, order_total)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))