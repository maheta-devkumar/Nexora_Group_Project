from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.product_catalog.product_service import ProductService
from schemas.product_schema import ProductCreate
from typing import Dict, Any, List

class ProductController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = ProductService(db)
    
    def get_all_products(
        self,
        page: int = 1,
        per_page: int = 20,
        category_id: int = None,
        sub_category_id: int = None,
        brand_ids: str = None,
        min_price: float = None,
        max_price: float = None,
        sort_by: str = "newest",
        status: str = "ACTIVE",
        search: str = None,
        has_discount: bool = None,
        min_discount_percentage: float = None,
        discount_type: str = None
    ) -> Dict[str, Any]:
        """Get all products with filters"""
        try:
            return self.service.get_all_products(
                page=page,
                per_page=per_page,
                category_id=category_id,
                sub_category_id=sub_category_id,
                brand_ids=brand_ids,
                min_price=min_price,
                max_price=max_price,
                sort_by=sort_by,
                status=status,
                search=search,
                has_discount=has_discount,
                min_discount_percentage=min_discount_percentage,
                discount_type=discount_type
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_product_suggestions(self, query_text: str, limit: int = 10) -> List[str]:
        """Get product suggestions"""
        try:
            return self.service.get_product_suggestions(query_text, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_product_by_id(self, product_id: int) -> Dict[str, Any]:
        """Get product by ID"""
        try:
            return self.service.get_product_by_id(product_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_product(self, product_data: ProductCreate) -> Dict[str, Any]:
        """Create new product"""
        try:
            return self.service.create_product(product_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_product(self, product_id: int, update_data: dict) -> Dict[str, Any]:
        """Update product"""
        try:
            return self.service.update_product(product_id, update_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_product(self, product_id: int) -> Dict[str, str]:
        """Delete product"""
        try:
            return self.service.delete_product(product_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
        # Add to your existing ProductController class

    def get_new_arrivals(
        self,
        days: int = 7,
        page: int = 1,
        per_page: int = 24,
        category_id: int = None,
        sort_by: str = "newest"
    ) -> Dict[str, Any]:
        """Get new arrivals"""
        try:
            return self.service.get_new_arrivals(
                days=days,
                page=page,
                per_page=per_page,
                category_id=category_id,
                sort_by=sort_by
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_trending_products(self, limit: int = 6) -> List[Dict[str, Any]]:
        """Get trending products"""
        try:
            return self.service.get_trending_products(limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_products_by_category_name(
        self,
        category_name: str,
        page: int = 1,
        per_page: int = 24,
        sort_by: str = "newest"
    ) -> Dict[str, Any]:
        """Get products by category name"""
        try:
            return self.service.get_products_by_category_name(
                category_name=category_name,
                page=page,
                per_page=per_page,
                sort_by=sort_by
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))