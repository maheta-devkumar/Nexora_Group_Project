from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.product_catalog.category_service import CategoryService
from schemas.product_catalog_schema import CategoryCreate, SubCategoryCreate
from typing import List, Dict, Any

class CategoryController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = CategoryService(db)
    
    def get_all_categories(self) -> List[Dict[str, Any]]:
        """Get all categories"""
        try:
            return self.service.get_all_categories()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_category_by_id(self, category_id: int) -> Dict[str, Any]:
        """Get category by ID"""
        try:
            return self.service.get_category_by_id(category_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_category_with_subcategories(self, category_id: int) -> Dict[str, Any]:
        """Get category with all its subcategories"""
        try:
            return self.service.get_category_with_subcategories(category_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_category(self, category_data: CategoryCreate) -> Dict[str, Any]:
        """Create new category"""
        try:
            return self.service.create_category(category_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_category(self, category_id: int, update_data: dict) -> Dict[str, Any]:
        """Update category"""
        try:
            return self.service.update_category(category_id, update_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_category(self, category_id: int) -> Dict[str, str]:
        """Delete category"""
        try:
            return self.service.delete_category(category_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_subcategory(self, subcategory_data: SubCategoryCreate) -> Dict[str, Any]:
        """Create new subcategory"""
        try:
            return self.service.create_subcategory(subcategory_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_subcategory(self, subcategory_id: int, update_data: dict) -> Dict[str, Any]:
        """Update subcategory"""
        try:
            return self.service.update_subcategory(subcategory_id, update_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_subcategory(self, subcategory_id: int) -> Dict[str, str]:
        """Delete subcategory"""
        try:
            return self.service.delete_subcategory(subcategory_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

     
    def get_all_subcategories(self) -> List[Dict[str, Any]]:  # NEW METHOD
        """Get all subcategories"""
        try:
            return self.service.get_all_subcategories()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_subcategory_by_id(self, subcategory_id: int) -> Dict[str, Any]:  # NEW METHOD
        """Get subcategory by ID"""
        try:
            return self.service.get_subcategory_by_id(subcategory_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))