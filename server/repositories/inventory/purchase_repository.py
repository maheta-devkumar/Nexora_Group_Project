from sqlalchemy.orm import Session
from models.inventory.purchase import Purchase
from models.inventory.purchase_item import PurchaseItem
from models.inventory.supplier import Supplier
from typing import List, Dict, Any, Optional

class PurchaseRepository:
    
    @staticmethod
    def get_purchase_by_id(db: Session, purchase_id: int) -> Optional[Purchase]:
        """Get purchase by ID"""
        return db.query(Purchase).filter(Purchase.purchase_id == purchase_id).first()
    
    @staticmethod
    def get_all_purchases(db: Session, skip: int = 0, limit: int = 100) -> List[Purchase]:
        """Get all purchases"""
        return db.query(Purchase).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_purchase(db: Session, purchase_data: Dict[str, Any]) -> Purchase:
        """Create a new purchase"""
        purchase = Purchase(**purchase_data)
        db.add(purchase)
        db.flush()  # Get purchase_id without committing
        return purchase
    
    @staticmethod
    def create_purchase_item(db: Session, purchase_item_data: Dict[str, Any]) -> PurchaseItem:
        """Create purchase item"""
        purchase_item = PurchaseItem(**purchase_item_data)
        db.add(purchase_item)
        return purchase_item
    
    @staticmethod
    def update_purchase_status(db: Session, purchase_id: int, status: str) -> Optional[Purchase]:
        """Update purchase status"""
        purchase = db.query(Purchase).filter(Purchase.purchase_id == purchase_id).first()
        
        if purchase:
            purchase.status = status
            db.commit()
            db.refresh(purchase)
        
        return purchase
    
    @staticmethod
    def get_purchase_items(db: Session, purchase_id: int) -> List[PurchaseItem]:
        """Get purchase items"""
        return db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase_id).all()