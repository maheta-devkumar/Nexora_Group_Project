from sqlalchemy.orm import Session
from models.inventory.purchase_return import PurchaseReturn, PurchaseReturnItem
from models.inventory.purchase import Purchase
from typing import List, Dict, Any, Optional

class PurchaseReturnRepository:
    
    @staticmethod
    def get_purchase_return_by_id(db: Session, return_id: int) -> Optional[PurchaseReturn]:
        """Get purchase return by ID"""
        return db.query(PurchaseReturn).filter(PurchaseReturn.return_id == return_id).first()
    
    @staticmethod
    def get_all_purchase_returns(db: Session, skip: int = 0, limit: int = 100) -> List[PurchaseReturn]:
        """Get all purchase returns"""
        return db.query(PurchaseReturn).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_purchase_return(db: Session, return_data: Dict[str, Any]) -> PurchaseReturn:
        """Create a new purchase return"""
        purchase_return = PurchaseReturn(**return_data)
        db.add(purchase_return)
        db.flush()  # Get return_id without committing
        return purchase_return
    
    @staticmethod
    def create_purchase_return_item(db: Session, return_item_data: Dict[str, Any]) -> PurchaseReturnItem:
        """Create purchase return item"""
        return_item = PurchaseReturnItem(**return_item_data)
        db.add(return_item)
        return return_item
    
    @staticmethod
    def update_purchase_return_status(db: Session, return_id: int, status: str) -> Optional[PurchaseReturn]:
        """Update purchase return status"""
        purchase_return = db.query(PurchaseReturn).filter(PurchaseReturn.return_id == return_id).first()
        
        if purchase_return:
            purchase_return.status = status
            db.commit()
            db.refresh(purchase_return)
        
        return purchase_return
    
    @staticmethod
    def get_purchase_return_items(db: Session, return_id: int) -> List[PurchaseReturnItem]:
        """Get purchase return items"""
        return db.query(PurchaseReturnItem).filter(PurchaseReturnItem.return_id == return_id).all()