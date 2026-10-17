from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.inventory.supplier_service import SupplierService
from schemas.inventory_schema import SupplierCreate, SupplierUpdate
from typing import List, Dict, Any

class SupplierController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = SupplierService(db)
    
    def create_supplier(self, supplier_data: SupplierCreate) -> Dict[str, Any]:
        """Create a new supplier"""
        try:
            return self.service.create_supplier(supplier_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_supplier(self, supplier_id: int) -> Dict[str, Any]:
        """Get supplier by ID"""
        try:
            return self.service.get_supplier(supplier_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_suppliers(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all suppliers"""
        try:
            return self.service.get_all_suppliers(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_supplier(self, supplier_id: int, supplier_data: SupplierUpdate) -> Dict[str, Any]:
        """Update supplier"""
        try:
            return self.service.update_supplier(supplier_id, supplier_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_supplier(self, supplier_id: int) -> Dict[str, str]:
        """Delete supplier"""
        try:
            return self.service.delete_supplier(supplier_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))