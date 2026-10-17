from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.product_catalog.brand_service import BrandService
from schemas.product_catalog_schema import BrandCreate
from typing import List, Dict, Any

class BrandController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = BrandService(db)
    
    def get_all_brands(self) -> List[Dict[str, Any]]:
        """Get all brands"""
        try:
            return self.service.get_all_brands()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_brand_by_id(self, brand_id: int) -> Dict[str, Any]:
        """Get brand by ID"""
        try:
            return self.service.get_brand_by_id(brand_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_brand(self, brand_data: BrandCreate) -> Dict[str, Any]:
        """Create new brand"""
        try:
            return self.service.create_brand(brand_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_brand(self, brand_id: int, update_data: dict) -> Dict[str, Any]:
        """Update brand"""
        try:
            return self.service.update_brand(brand_id, update_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_brand(self, brand_id: int) -> Dict[str, str]:
        """Delete brand"""
        try:
            return self.service.delete_brand(brand_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))