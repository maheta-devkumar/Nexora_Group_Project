# services/product_catalog/brand_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.product_catalog.brand_repository import BrandRepository
from schemas.product_catalog_schema import BrandCreate
from typing import List, Dict, Any

class BrandService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = BrandRepository()
    
    def get_all_brands(self) -> List[Dict[str, Any]]:
        """Get all brands"""
        brands = self.repository.get_all_brands(self.db)
        return [
            {
                "brand_id": int(brand.brand_id),  # Ensure integer
                "brand_name": brand.brand_name,
                "description": brand.description if brand.description else ""  # Default to empty string
            } for brand in brands
        ]
    
    def get_brand_by_id(self, brand_id: int) -> Dict[str, Any]:
        """Get brand by ID"""
        brand = self.repository.get_brand_by_id(self.db, brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        return {
            "brand_id": int(brand.brand_id),  # Ensure integer
            "brand_name": brand.brand_name,
            "description": brand.description if brand.description else ""  # Default to empty string
        }
    
    def create_brand(self, brand_data: BrandCreate) -> Dict[str, Any]:
        """Create new brand"""
        # Check if brand already exists
        existing = self.repository.get_brand_by_name(self.db, brand_data.brand_name)
        if existing:
            raise HTTPException(status_code=400, detail="Brand already exists")
        
        new_brand = self.repository.create_brand(self.db, brand_data.model_dump())
        return {
            "brand_id": int(new_brand.brand_id),  # Ensure integer
            "brand_name": new_brand.brand_name,
            "description": new_brand.description if new_brand.description else ""  # Default to empty string
        }
    
    def update_brand(self, brand_id: int, update_data: dict) -> Dict[str, Any]:
        """Update brand"""
        brand = self.repository.get_brand_by_id(self.db, brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        updated_brand = self.repository.update_brand(self.db, brand, update_data)
        return {
            "brand_id": int(updated_brand.brand_id),  # Ensure integer
            "brand_name": updated_brand.brand_name,
            "description": updated_brand.description if updated_brand.description else ""  # Default to empty string
        }
    
    def delete_brand(self, brand_id: int) -> Dict[str, str]:
        """Delete brand"""
        brand = self.repository.get_brand_by_id(self.db, brand_id)
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        self.repository.delete_brand(self.db, brand)
        return {"message": "Brand deleted successfully"}