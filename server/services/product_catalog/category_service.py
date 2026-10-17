# services/product_catalog/category_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.product_catalog.category_repository import CategoryRepository
from schemas.product_catalog_schema import CategoryCreate, SubCategoryCreate
from typing import List, Dict, Any

class CategoryService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = CategoryRepository()
    
    def get_all_categories(self) -> List[Dict[str, Any]]:
        """Get all categories"""
        categories = self.repository.get_all_categories(self.db)
        return [
            {
                "category_id": int(cat.category_id),  # Ensure integer
                "category_name": cat.category_name,
                "description": cat.description
            } for cat in categories
        ]
    
    def get_category_by_id(self, category_id: int) -> Dict[str, Any]:
        """Get category by ID"""
        category = self.repository.get_category_by_id(self.db, category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        return {
            "category_id": int(category.category_id),  # Ensure integer
            "category_name": category.category_name,
            "description": category.description
        }
    
    def get_all_subcategories(self) -> List[Dict[str, Any]]:
        """Get all subcategories with category details"""
        subcategories = self.repository.get_all_subcategories(self.db)
        
        result = []
        for sub in subcategories:
            # Get category name for each subcategory
            category = self.repository.get_category_by_id(self.db, sub.category_id)
            result.append({
                "sub_category_id": int(sub.sub_category_id),  # Ensure integer
                "sub_category_name": sub.sub_category_name,
                "description": sub.description,
                "category_id": int(sub.category_id) if sub.category_id else None,  # Ensure integer
                "category_name": category.category_name if category else None
            })
        
        return result
    
    def get_subcategory_by_id(self, subcategory_id: int) -> Dict[str, Any]:
        """Get subcategory by ID with category details"""
        result = self.repository.get_subcategory_with_category(self.db, subcategory_id)
        if not result:
            raise HTTPException(status_code=404, detail="Subcategory not found")
        
        subcategory = result["subcategory"]
        category = result["category"]
        
        return {
            "sub_category_id": int(subcategory.sub_category_id),  # Ensure integer
            "sub_category_name": subcategory.sub_category_name,
            "description": subcategory.description,
            "category_id": int(subcategory.category_id) if subcategory.category_id else None,  # Ensure integer
            "category_name": category.category_name if category else None,
            "category_description": category.description if category else None
        }
    
    def get_category_with_subcategories(self, category_id: int) -> Dict[str, Any]:
        """Get category with all its subcategories"""
        category = self.repository.get_category_by_id(self.db, category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        subcategories = self.repository.get_subcategories_by_category(self.db, category_id)
        
        return {
            "category_id": int(category.category_id),  # Ensure integer
            "category_name": category.category_name,
            "description": category.description,
            "subcategories": [
                {
                    "sub_category_id": int(sub.sub_category_id),  # Ensure integer
                    "sub_category_name": sub.sub_category_name,
                    "description": sub.description,
                    "category_id": int(sub.category_id) if sub.category_id else None  # Ensure integer
                } for sub in subcategories
            ]
        }
    
    def create_category(self, category_data: CategoryCreate) -> Dict[str, Any]:
        """Create new category"""
        # Check if category already exists
        existing = self.repository.get_category_by_name(self.db, category_data.category_name)
        if existing:
            raise HTTPException(status_code=400, detail="Category already exists")
        
        new_category = self.repository.create_category(self.db, category_data.model_dump())
        return {
            "category_id": int(new_category.category_id),  # Ensure integer
            "category_name": new_category.category_name,
            "description": new_category.description
        }
    
    def update_category(self, category_id: int, update_data: dict) -> Dict[str, Any]:
        """Update category"""
        category = self.repository.get_category_by_id(self.db, category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        updated_category = self.repository.update_category(self.db, category, update_data)
        return {
            "category_id": int(updated_category.category_id),  # Ensure integer
            "category_name": updated_category.category_name,
            "description": updated_category.description
        }
    
    def delete_category(self, category_id: int) -> Dict[str, str]:
        """Delete category"""
        category = self.repository.get_category_by_id(self.db, category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        self.repository.delete_category(self.db, category)
        return {"message": "Category deleted successfully"}
    
    def create_subcategory(self, subcategory_data: SubCategoryCreate) -> Dict[str, Any]:
        """Create new subcategory"""
        new_subcategory = self.repository.create_subcategory(self.db, subcategory_data.model_dump())
        return {
            "sub_category_id": int(new_subcategory.sub_category_id),  # Ensure integer
            "sub_category_name": new_subcategory.sub_category_name,
            "description": new_subcategory.description,
            "category_id": int(new_subcategory.category_id) if new_subcategory.category_id else None  # Ensure integer
        }
    
    def update_subcategory(self, subcategory_id: int, update_data: dict) -> Dict[str, Any]:
        """Update subcategory"""
        subcategory = self.repository.get_subcategory_by_id(self.db, subcategory_id)
        if not subcategory:
            raise HTTPException(status_code=404, detail="Subcategory not found")
        
        updated_subcategory = self.repository.update_subcategory(self.db, subcategory, update_data)
        return {
            "sub_category_id": int(updated_subcategory.sub_category_id),  # Ensure integer
            "sub_category_name": updated_subcategory.sub_category_name,
            "description": updated_subcategory.description,
            "category_id": int(updated_subcategory.category_id) if updated_subcategory.category_id else None  # Ensure integer
        }
    
    def delete_subcategory(self, subcategory_id: int) -> Dict[str, str]:
        """Delete subcategory"""
        subcategory = self.repository.get_subcategory_by_id(self.db, subcategory_id)
        if not subcategory:
            raise HTTPException(status_code=404, detail="Subcategory not found")
        
        self.repository.delete_subcategory(self.db, subcategory)
        return {"message": "Subcategory deleted successfully"}