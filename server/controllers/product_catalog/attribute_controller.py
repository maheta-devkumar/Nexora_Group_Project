from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.product_catalog.attribute_service import AttributeService
from schemas.product_catalog_schema import AttributeCreate
from typing import List, Dict, Any

class AttributeController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = AttributeService(db)
    
    def get_all_attributes(self) -> List[Dict[str, Any]]:
        """Get all attributes"""
        try:
            return self.service.get_all_attributes()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_variant_attributes(self, variant_id: int) -> List[Dict[str, Any]]:
        """Get all attributes of a variant"""
        try:
            return self.service.get_variant_attributes(variant_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_attribute(self, attribute_data: AttributeCreate) -> Dict[str, Any]:
        """Create new attribute"""
        try:
            return self.service.create_attribute(attribute_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def assign_attribute_to_variant(self, variant_id: int, attribute_id: int, value: str) -> Dict[str, str]:
        """Assign attribute to variant"""
        try:
            return self.service.assign_attribute_to_variant(variant_id, attribute_id, value)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_variant_attribute_value(self, variant_id: int, attribute_id: int, value: str) -> Dict[str, str]:
        """Update attribute value for variant"""
        try:
            return self.service.update_variant_attribute_value(variant_id, attribute_id, value)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def remove_attribute_from_variant(self, variant_id: int, attribute_id: int) -> Dict[str, str]:
        """Remove attribute from variant"""
        try:
            return self.service.remove_attribute_from_variant(variant_id, attribute_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    # Add these methods to AttributeController class

    def update_attribute(self, attribute_id: int, attribute_data: AttributeCreate) -> Dict[str, Any]:
        """Update existing attribute"""
        try:
            return self.service.update_attribute(attribute_id, attribute_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_attribute(self, attribute_id: int) -> Dict[str, str]:
        """Delete attribute"""
        try:
            return self.service.delete_attribute(attribute_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))