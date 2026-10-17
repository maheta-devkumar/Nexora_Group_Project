# repositories/inventory/supplier_repository.py

from sqlalchemy.orm import Session, joinedload, contains_eager
from models.inventory.supplier import Supplier
from typing import List, Dict, Any, Optional

class SupplierRepository:
    
    @staticmethod
    def get_supplier_by_id(db: Session, supplier_id: int) -> Optional[Supplier]:
        """Get supplier by ID with company, company.area, and area relationships"""
        return db.query(Supplier).options(
            joinedload(Supplier.company).joinedload("area"),
            joinedload(Supplier.area)
        ).filter(Supplier.supplier_id == supplier_id).first()
    
    @staticmethod
    def get_all_suppliers(db: Session, skip: int = 0, limit: int = 100) -> List[Supplier]:
        """Get all suppliers with company, company.area, and area relationships"""
        return db.query(Supplier).options(
            joinedload(Supplier.company).joinedload("area"),
            joinedload(Supplier.area)
        ).offset(skip).limit(limit).all()
    
    # ... rest of the methods remain the same
    @staticmethod
    def get_all_suppliers(db: Session, skip: int = 0, limit: int = 100) -> List[Supplier]:
        """Get all suppliers with company and area relationships"""
        return db.query(Supplier).options(
            joinedload(Supplier.company),
            joinedload(Supplier.area)
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_supplier(db: Session, supplier_data: Dict[str, Any]) -> Supplier:
        """Create a new supplier"""
        supplier = Supplier(**supplier_data)
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier
    
    @staticmethod
    def update_supplier(db: Session, supplier_id: int, update_data: Dict[str, Any]) -> Optional[Supplier]:
        """Update supplier"""
        supplier = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
        
        if supplier:
            for field, value in update_data.items():
                setattr(supplier, field, value)
            db.commit()
            db.refresh(supplier)
        
        return supplier
    
    @staticmethod
    def delete_supplier(db: Session, supplier_id: int) -> bool:
        """Delete supplier"""
        supplier = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
        
        if supplier:
            db.delete(supplier)
            db.commit()
            return True
        
        return False