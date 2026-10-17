from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.product_catalog.variant_repository import VariantRepository
from schemas.product_schema import VariantCreate, VariantUpdate
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
import math

class VariantService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = VariantRepository()
    
    def calculate_final_price(self, variant) -> Decimal:
        """Calculate final price after discount"""
        final_price = variant.price
        if variant.discount_type == "PERCENT":
            final_price = variant.price * (1 - variant.discount_value / 100)
        elif variant.discount_type == "FLAT":
            final_price = max(variant.price - variant.discount_value, Decimal("0.00"))
        return final_price
    
    def serialize_variant(self, variant: ProductVariant, include_details: bool = False) -> Dict[str, Any]:
        """Convert variant to dictionary"""
        data = {
            "variant_id": variant.variant_id,
            "variant_name": variant.variant_name,
            "product_id": variant.product_id,
            "price": float(variant.price),
            "stock_quantity": variant.stock_quantity,
            "discount_type": variant.discount_type,
            "discount_value": float(variant.discount_value),
            "status": variant.status,
            "is_default": variant.is_default,
            "updated_at": variant.updated_at.isoformat() if variant.updated_at else None,
            "final_price": float(self.calculate_final_price(variant))
        }
        
        if include_details:
            images = self.repository.get_variant_images(self.db, variant.variant_id)
            data["images"] = [
                {
                    "image_id": img.image_id,
                    "url": img.url,
                    "is_default": img.is_default
                } for img in images
            ]
            
            attributes = self.repository.get_variant_attributes(self.db, variant.variant_id)
            data["attributes"] = [
                {
                    "attribute_id": attr.attribute_id,
                    "attribute_name": attr.attribute_name,
                    "value": value
                } for attr, value in attributes
            ]
        
        return data
    
    def get_all_variants(
        self,
        page: int = 1,
        per_page: int = 20,
        product_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get all variants with pagination"""
        query = self.repository.get_all_variants_query(self.db, product_id)
        
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
        
        offset = (page - 1) * per_page
        variants = query.offset(offset).limit(per_page).all()
        
        variants_data = [self.serialize_variant(variant, include_details=True) for variant in variants]
        
        return {
            "items": variants_data,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages
        }
    
    def get_variant_by_id(self, variant_id: int) -> Dict[str, Any]:
        """Get variant with full details"""
        variant = self.repository.get_variant_by_id(self.db, variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        product = self.repository.get_product_by_id(self.db, variant.product_id)
        
        variant_data = self.serialize_variant(variant, include_details=True)
        variant_data["product_name"] = product.product_name if product else None
        variant_data["product_description"] = product.description if product else None
        
        return variant_data
    
    def create_variant(self, variant_data: VariantCreate) -> Dict[str, Any]:
        """Create new variant"""
        # Check if product exists
        product = self.repository.get_product_by_id(self.db, variant_data.product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if this is the first variant
        existing_count = self.repository.count_product_variants(self.db, variant_data.product_id)
        final_is_default = variant_data.is_default or existing_count == 0
        
        # If setting as default and there are existing variants, update others
        if final_is_default and existing_count > 0:
            self.repository.update_variant_default_status(self.db, variant_data.product_id, False)
        
        new_variant = self.repository.create_variant(self.db, {
            **variant_data.model_dump(exclude={"is_default"}),
            "updated_at": datetime.now(),
            "is_default": final_is_default
        })
        
        return self.serialize_variant(new_variant, include_details=True)
    
    def update_variant(self, variant_id: int, update_data: VariantUpdate) -> Dict[str, Any]:
        """Update variant"""
        variant = self.repository.get_variant_by_id(self.db, variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        # Handle is_default update
        if update_data.is_default is True:
            self.repository.update_variant_default_status(self.db, variant.product_id, False)
        
        update_dict = update_data.model_dump(exclude_unset=True)
        updated_variant = self.repository.update_variant(self.db, variant, update_dict)
        
        return self.serialize_variant(updated_variant, include_details=True)
    
    def delete_variant(self, variant_id: int) -> Dict[str, str]:
        """Delete variant"""
        variant = self.repository.get_variant_by_id(self.db, variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        # Check if this is the only variant
        variant_count = self.repository.count_product_variants(self.db, variant.product_id)
        if variant_count == 1:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete the only variant. Delete the product instead."
            )
        
        # If deleting the default variant, set another variant as default
        if variant.is_default:
            another_variant = self.repository.get_another_variant(self.db, variant.product_id, variant_id)
            if another_variant:
                self.repository.update_variant(self.db, another_variant, {"is_default": True})
        
        self.repository.delete_variant(self.db, variant)
        return {"message": "Variant deleted successfully"}
    
    def update_variant_stock(self, variant_id: int, quantity: int) -> Dict[str, Any]:
        """Update stock quantity"""
        variant = self.repository.get_variant_by_id(self.db, variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        update_data = {"stock_quantity": quantity}
        
        # Update status based on stock
        if quantity == 0:
            update_data["status"] = "OUT_OF_STOCK"
        elif variant.status == "OUT_OF_STOCK" and quantity > 0:
            update_data["status"] = "ACTIVE"
        
        updated_variant = self.repository.update_variant(self.db, variant, update_data)
        return self.serialize_variant(updated_variant)
    
    def update_variant_price(self, variant_id: int, price: Decimal) -> Dict[str, Any]:
        """Update price"""
        variant = self.repository.get_variant_by_id(self.db, variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        updated_variant = self.repository.update_variant(self.db, variant, {"price": price})
        return self.serialize_variant(updated_variant)
    
    def set_variant_discount(self, variant_id: int, discount_type: str, discount_value: Decimal) -> Dict[str, Any]:
        """Set discount"""
        variant = self.repository.get_variant_by_id(self.db, variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        if discount_type not in ["PERCENT", "FLAT", "NONE"]:
            raise HTTPException(status_code=400, detail="Invalid discount type")
        
        update_data = {
            "discount_type": discount_type,
            "discount_value": discount_value if discount_type != "NONE" else Decimal("0.00")
        }
        
        updated_variant = self.repository.update_variant(self.db, variant, update_data)
        return self.serialize_variant(updated_variant)
    
    def update_variant_status(self, variant_id: int, status: str) -> Dict[str, Any]:
        """Update status"""
        variant = self.repository.get_variant_by_id(self.db, variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        if status not in ["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        updated_variant = self.repository.update_variant(self.db, variant, {"status": status})
        return self.serialize_variant(updated_variant)
    
    def set_default_variant(self, product_id: int, variant_id: int) -> Dict[str, str]:
        """Set default variant for product"""
        variant = self.repository.get_variant_by_id(self.db, variant_id)
        if not variant or variant.product_id != product_id:
            raise HTTPException(status_code=404, detail="Variant not found")
        
        # Set all variants to not default
        self.repository.update_variant_default_status(self.db, product_id, False)
        
        # Set the specified variant as default
        self.repository.update_variant(self.db, variant, {"is_default": True})
        
        return {"message": "Default variant updated successfully"}

    def fetch_variant_images(self, variant_id: int):
        images = self.repository.get_all_images_by_variant(self.db, variant_id)
        return images


    def fetch_variant_videos(self, variant_id: int):
        videos = self.repository.get_all_videos_by_variant(self.db, variant_id)
        return videos
