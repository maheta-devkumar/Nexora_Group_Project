from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.product_catalog.variant_service import VariantService
from schemas.product_schema import VariantCreate, VariantUpdate
from typing import Dict, Any
from decimal import Decimal

class VariantController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = VariantService(db)
    
    def get_all_variants(
        self,
        page: int = 1,
        per_page: int = 20,
        product_id: int = None
    ) -> Dict[str, Any]:
        """Get all variants"""
        try:
            return self.service.get_all_variants(page, per_page, product_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_variant_by_id(self, variant_id: int) -> Dict[str, Any]:
        """Get variant by ID"""
        try:
            return self.service.get_variant_by_id(variant_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_variant(self, variant_data: VariantCreate) -> Dict[str, Any]:
        """Create new variant"""
        try:
            return self.service.create_variant(variant_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_variant(self, variant_id: int, update_data: VariantUpdate) -> Dict[str, Any]:
        """Update variant"""
        try:
            return self.service.update_variant(variant_id, update_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_variant(self, variant_id: int) -> Dict[str, str]:
        """Delete variant"""
        try:
            return self.service.delete_variant(variant_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_variant_stock(self, variant_id: int, quantity: int) -> Dict[str, Any]:
        """Update stock"""
        try:
            return self.service.update_variant_stock(variant_id, quantity)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_variant_price(self, variant_id: int, price: Decimal) -> Dict[str, Any]:
        """Update price"""
        try:
            return self.service.update_variant_price(variant_id, price)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def set_variant_discount(
        self,
        variant_id: int,
        discount_type: str,
        discount_value: Decimal
    ) -> Dict[str, Any]:
        """Set discount"""
        try:
            return self.service.set_variant_discount(variant_id, discount_type, discount_value)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_variant_status(self, variant_id: int, status: str) -> Dict[str, Any]:
        """Update status"""
        try:
            return self.service.update_variant_status(variant_id, status)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def set_default_variant(self, product_id: int, variant_id: int) -> Dict[str, str]:
        """Set default variant"""
        try:
            return self.service.set_default_variant(product_id, variant_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_variant_images(self, variant_id: int):
        images = self.service.fetch_variant_images(variant_id)
        return images


    async def get_variant_videos(self, variant_id: int):
        videos = self.service.fetch_variant_videos(variant_id)
        return videos
