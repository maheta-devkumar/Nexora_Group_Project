from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.product_catalog.product_repository import ProductRepository
from schemas.product_schema import ProductCreate
from typing import List, Dict, Any, Optional
from decimal import Decimal
import math
import os
from sqlalchemy import or_, desc, asc

# Import the required models
from models.product_catalog.product import Product
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product_brand import ProductBrand
from models.product_catalog.sub_category import SubCategory
from models.product_catalog.category import Category
from models.product_catalog.product_image import ProductImage

class ProductService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = ProductRepository
        self.base_url = "http://localhost:8000"

    def get_image_url(self, db_path: str) -> str:
        """Extract just the filename from any path format"""
        if not db_path:
            return ""
        
        
        # Replace backslashes
        clean_path = db_path.replace("\\", "/")
        
        # Find "products/" in the path and take everything after it
        if "products/" in clean_path:
            products_index = clean_path.find("products/")
            filename = clean_path[products_index:]  
        else:
            # If no "products/" found, use the filename
            filename = os.path.basename(clean_path)  # ← THIS NEEDS 'os' IMPORT
            filename = f"products/{filename}" if filename else ""
        
        if not filename:
            return ""
        
        # Construct URL
        final_url = f"http://localhost:8000/uploads/{filename}"
        return final_url

        
    def calculate_final_price(self, variant) -> Decimal:
        """Calculate final price after discount"""
        final_price = variant.price
        if variant.discount_type == "PERCENT":
            final_price = variant.price * (1 - variant.discount_value / 100)
        elif variant.discount_type == "FLAT":
            final_price = max(variant.price - variant.discount_value, Decimal("0.00"))
        return final_price
    
    def get_all_products(
        self,
        page: int = 1,
        per_page: int = 20,
        category_id: Optional[int] = None,
        sub_category_id: Optional[int] = None,
        brand_ids: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "newest",
        status: str = "ACTIVE",
        search: Optional[str] = None,
        has_discount: Optional[bool] = None,
        min_discount_percentage: Optional[float] = None,
        discount_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all products with filters and pagination - SIMPLIFIED"""
        
        
        # Start with ALL products - no variant join
        query = self.db.query(Product)

        # Apply product-level filters ONLY
        if category_id:
            query = query.join(SubCategory).filter(SubCategory.category_id == category_id)
        
        if sub_category_id:
            query = query.filter(Product.sub_category_id == sub_category_id)
        
        if brand_ids:
            try:
                brand_id_list = [int(bid.strip()) for bid in brand_ids.split(',') if bid.strip()]
                if brand_id_list:
                    query = query.filter(Product.brand_id.in_(brand_id_list))
            except ValueError:
                pass
        
        if search and search.strip():
            search_clean = search.strip()
            search_pattern = f"%{search_clean}%"
            query = query.filter(
                or_(
                    Product.product_name.ilike(search_pattern),
                    Product.description.ilike(search_pattern)
                )
            )
        
        # Get total count BEFORE pagination
        total = query.count()
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        
        
        if total == 0:
            return {
                "items": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
                "total_pages": 0
            }
        
        # Apply sorting
        if sort_by == "name_asc":
            query = query.order_by(asc(Product.product_name))
        elif sort_by == "name_desc":
            query = query.order_by(desc(Product.product_name))
        else:  # "newest" default
            query = query.order_by(desc(Product.created_at))
        
        # Get paginated products
        offset = (page - 1) * per_page
        products = query.offset(offset).limit(per_page).all()
        
        
        # Build response - IGNORE variant filters for now
        items = []
        for product in products:
            # Get ANY variant for display (or create dummy if none)
            variant = self.repository.get_default_variant(self.db, product.product_id)
            
            # If no default variant, get ANY variant
            if not variant:
                variants = self.repository.get_product_variants(self.db, product.product_id)
                variant = variants[0] if variants else None
            
            # If still no variant, create a dummy for display
            if not variant:
                variant_data = {
                    "variant_id": 0,
                    "variant_name": None,
                    "price": 0.0,
                    "final_price": 0.0,
                    "discount_type": "NONE",
                    "discount_value": 0.0,
                    "stock_quantity": 0,
                    "status": "INACTIVE",
                    "images": []
                }
            else:
                # Get variant images
                images = self.repository.get_variant_images(self.db, variant.variant_id)
                final_price = self.calculate_final_price(variant)
                
                variant_data = {
                    "variant_id": variant.variant_id,
                    "variant_name": variant.variant_name,
                    "price": float(variant.price),
                    "final_price": float(final_price),
                    "discount_type": variant.discount_type,
                    "discount_value": float(variant.discount_value),
                    "stock_quantity": variant.stock_quantity,
                    "status": variant.status,
                    "images": [
                        {
                            "image_id": img.image_id,
                            "url": self.get_image_url(img.url),
                            "is_default": img.is_default
                        } for img in images
                    ]
                }
            
            # Get brand, category, subcategory
            brand = self.repository.get_brand_by_id(self.db, product.brand_id)
            subcategory = self.repository.get_subcategory_by_id(self.db, product.sub_category_id)
            category = self.repository.get_category_by_id(self.db, subcategory.category_id) if subcategory else None
            
            items.append({
                "product_id": product.product_id,
                "product_name": product.product_name,
                "description": product.description,
                "brand": {
                    "brand_id": brand.brand_id if brand else None,
                    "brand_name": brand.brand_name if brand else None
                },
                "category": {
                    "category_id": category.category_id if category else None,
                    "category_name": category.category_name if category else None
                },
                "subcategory": {
                    "sub_category_id": subcategory.sub_category_id if subcategory else None,
                    "sub_category_name": subcategory.sub_category_name if subcategory else None
                },
                "default_variant": variant_data
            })
        
        
        return {
            "items": items,
            "total": total,  # Return ALL products count
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages
        }
    
    def get_product_suggestions(self, query_text: str, limit: int = 10) -> List[str]:
        """Get product name suggestions"""
        if not query_text or not query_text.strip():
            return []
        
        search_clean = query_text.strip()
        search_pattern = f"%{search_clean}%"
        
        products = self.repository.search_products_by_name(self.db, search_pattern, limit)
        return [r[0] for r in products]
    
    def get_product_by_id(self, product_id: int) -> Dict[str, Any]:
        """Get product with all variants"""
        product = self.repository.get_product_by_id(self.db, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        variants = self.repository.get_product_variants(self.db, product_id)
        brand = self.repository.get_brand_by_id(self.db, product.brand_id)
        subcategory = self.repository.get_subcategory_by_id(self.db, product.sub_category_id)
        category = self.repository.get_category_by_id(self.db, subcategory.category_id) if subcategory else None
        
        variant_data = []
        for variant in variants:
            images = self.repository.get_variant_images(self.db, variant.variant_id)
            final_price = self.calculate_final_price(variant)
            
            variant_data.append({
                "variant_id": variant.variant_id,
                "variant_name": variant.variant_name,
                "price": float(variant.price),
                "final_price": float(final_price),
                "discount_type": variant.discount_type,
                "discount_value": float(variant.discount_value),
                "stock_quantity": variant.stock_quantity,
                "status": variant.status,
                "is_default": variant.is_default,
                "images": [
                    {
                        "image_id": img.image_id,
                        "url": self.get_image_url(img.url),
                        "is_default": img.is_default
                    } for img in images
                ]
            })
        
        return {
            "product_id": product.product_id,
            "product_name": product.product_name,
            "description": product.description,
            "brand": {
                "brand_id": brand.brand_id if brand else None,
                "brand_name": brand.brand_name if brand else None
            },
            "category": {
                "category_id": category.category_id if category else None,
                "category_name": category.category_name if category else None
            },
            "subcategory": {
                "sub_category_id": subcategory.sub_category_id if subcategory else None,
                "sub_category_name": subcategory.sub_category_name if subcategory else None
            },
            "created_at": product.created_at,
            "variants": variant_data
        }
    
    def create_product(self, product_data: ProductCreate) -> Dict[str, Any]:
        """Create new product"""
        from datetime import datetime
        
        new_product = self.repository.create_product(self.db, {
            **product_data.model_dump(exclude_unset=True),
            "created_at": datetime.now()
        })
        
        return {
            "product_id": new_product.product_id,
            "product_name": new_product.product_name,
            "description": new_product.description,
            "brand_id": new_product.brand_id,
            "sub_category_id": new_product.sub_category_id,
            "created_at": str(new_product.created_at)
        }
    
    def update_product(self, product_id: int, update_data: dict) -> Dict[str, Any]:
        """Update product"""
        product = self.repository.get_product_by_id(self.db, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        updated_product = self.repository.update_product(self.db, product, update_data)
        
        return {
            "product_id": updated_product.product_id,
            "product_name": updated_product.product_name,
            "description": updated_product.description,
            "brand_id": updated_product.brand_id,
            "sub_category_id": updated_product.sub_category_id,
            "created_at": str(updated_product.created_at)
        }
    
    def delete_product(self, product_id: int) -> Dict[str, str]:
        """Delete product"""
        product = self.repository.get_product_by_id(self.db, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        self.repository.delete_product(self.db, product)
        return {"message": "Product deleted successfully"}

    # Add to your existing ProductService class

    def get_new_arrivals(
        self,
        days: int = 7,
        page: int = 1,
        per_page: int = 24,
        category_id: Optional[int] = None,
        sort_by: str = "newest"
    ) -> Dict[str, Any]:
        """Get newly added products"""
        query = self.repository.get_new_arrivals_query(self.db, days)
        
        # Apply additional filters
        if category_id:
            query = query.join(SubCategory).filter(SubCategory.category_id == category_id)
        
        # Apply sorting
        if sort_by == "price_low":
            query = query.order_by(asc(ProductVariant.price), asc(Product.product_id))
        elif sort_by == "price_high":
            query = query.order_by(desc(ProductVariant.price), asc(Product.product_id))
        elif sort_by == "rating":
            # You can implement rating sorting when you have ratings
            query = query.order_by(desc(Product.created_at), asc(Product.product_id))
        else:  # newest
            query = query.order_by(desc(Product.created_at), asc(Product.product_id))
        
        # Get total count
        total = query.count()
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        
        if total == 0:
            return {
                "items": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
                "total_pages": 0,
                "days": days
            }
        
        # Get paginated results
        offset = (page - 1) * per_page
        products = query.offset(offset).limit(per_page).all()
        
        # Build response
        items = []
        for product in products:
            default_variant = self.repository.get_default_variant(self.db, product.product_id)
            if not default_variant:
                continue
            
            images = self.repository.get_variant_images(self.db, default_variant.variant_id)
            brand = self.repository.get_brand_by_id(self.db, product.brand_id)
            subcategory = self.repository.get_subcategory_by_id(self.db, product.sub_category_id)
            category = self.repository.get_category_by_id(self.db, subcategory.category_id) if subcategory else None
            
            final_price = self.calculate_final_price(default_variant)
            
            items.append({
                "product_id": product.product_id,
                "product_name": product.product_name,
                "description": product.description,
                "brand": {
                    "brand_id": brand.brand_id if brand else None,
                    "brand_name": brand.brand_name if brand else None
                },
                "category": {
                    "category_id": category.category_id if category else None,
                    "category_name": category.category_name if category else None
                },
                "subcategory": {
                    "sub_category_id": subcategory.sub_category_id if subcategory else None,
                    "sub_category_name": subcategory.sub_category_name if subcategory else None
                },
                "created_at": product.created_at,
                "default_variant": {
                    "variant_id": default_variant.variant_id,
                    "variant_name": default_variant.variant_name,
                    "price": float(default_variant.price),
                    "final_price": float(final_price),
                    "discount_type": default_variant.discount_type,
                    "discount_value": float(default_variant.discount_value),
                    "stock_quantity": default_variant.stock_quantity,
                    "status": default_variant.status,
                    "images": [
                        {
                            "image_id": img.image_id,
                            "url": self.get_image_url(img.url),
                            "is_default": img.is_default
                        } for img in images
                    ]
                }
            })
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "days": days
        }

    def get_trending_products(self, limit: int = 6) -> List[Dict[str, Any]]:
        """Get trending products"""
        products = self.repository.get_trending_products_query(self.db, limit).all()
        
        trending_items = []
        for product in products:
            default_variant = self.repository.get_default_variant(self.db, product.product_id)
            if not default_variant:
                continue
            
            images = self.repository.get_variant_images(self.db, default_variant.variant_id)
            final_price = self.calculate_final_price(default_variant)
            
            trending_items.append({
                "product_id": product.product_id,
                "product_name": product.product_name,
                "created_at": product.created_at,
                "default_variant": {
                    "variant_id": default_variant.variant_id,
                    "price": float(default_variant.price),
                    "final_price": float(final_price),
                    "images": [
                        {
                            "url": self.get_image_url(img.url)
                        } for img in images[:1]  # Just first image for trending
                    ]
                }
            })
        
        return trending_items

    def get_products_by_category_name(
        self,
        category_name: str,
        page: int = 1,
        per_page: int = 24,
        sort_by: str = "newest"
    ) -> Dict[str, Any]:
        """Get products by category name"""
        query = self.repository.get_products_by_category_name(self.db, category_name)
        
        # Apply sorting
        if sort_by == "price_low":
            query = query.order_by(asc(ProductVariant.price), asc(Product.product_id))
        elif sort_by == "price_high":
            query = query.order_by(desc(ProductVariant.price), asc(Product.product_id))
        elif sort_by == "rating":
            query = query.order_by(desc(Product.created_at), asc(Product.product_id))
        else:  # newest
            query = query.order_by(desc(Product.created_at), asc(Product.product_id))
        
        # Get total count
        total = query.count()
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        
        if total == 0:
            return {
                "items": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
                "total_pages": 0,
                "category": category_name
            }
        
        # Get paginated results
        offset = (page - 1) * per_page
        products = query.offset(offset).limit(per_page).all()
        
        # Build response (similar to get_all_products)
        items = []
        for product in products:
            default_variant = self.repository.get_default_variant(self.db, product.product_id)
            if not default_variant:
                continue
            
            images = self.repository.get_variant_images(self.db, default_variant.variant_id)
            brand = self.repository.get_brand_by_id(self.db, product.brand_id)
            subcategory = self.repository.get_subcategory_by_id(self.db, product.sub_category_id)
            category = self.repository.get_category_by_id(self.db, subcategory.category_id) if subcategory else None
            
            final_price = self.calculate_final_price(default_variant)
            
            items.append({
                "product_id": product.product_id,
                "product_name": product.product_name,
                "description": product.description,
                "brand": {
                    "brand_id": brand.brand_id if brand else None,
                    "brand_name": brand.brand_name if brand else None
                },
                "category": {
                    "category_id": category.category_id if category else None,
                    "category_name": category.category_name if category else None
                },
                "subcategory": {
                    "sub_category_id": subcategory.sub_category_id if subcategory else None,
                    "sub_category_name": subcategory.sub_category_name if subcategory else None
                },
                "created_at": product.created_at,
                "default_variant": {
                    "variant_id": default_variant.variant_id,
                    "variant_name": default_variant.variant_name,
                    "price": float(default_variant.price),
                    "final_price": float(final_price),
                    "discount_type": default_variant.discount_type,
                    "discount_value": float(default_variant.discount_value),
                    "stock_quantity": default_variant.stock_quantity,
                    "status": default_variant.status,
                    "images": [
                        {
                            "image_id": img.image_id,
                            "url": self.get_image_url(img.url),
                            "is_default": img.is_default
                        } for img in images
                    ]
                }
            })
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "category": category_name
        }