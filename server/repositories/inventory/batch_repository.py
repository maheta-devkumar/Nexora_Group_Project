from sqlalchemy.orm import Session
from models.inventory.product_batch import ProductBatch
from models.inventory.batch_item import BatchItem
from models.inventory.purchase import Purchase
from models.product_catalog.product_variant import ProductVariant
from typing import List, Dict, Any, Optional

class BatchRepository:
    
    @staticmethod
    def get_batch_by_id(db: Session, batch_id: int) -> Optional[ProductBatch]:
        """Get batch by ID"""
        return db.query(ProductBatch).filter(ProductBatch.batch_id == batch_id).first()
    
    @staticmethod
    def get_batch_by_number(db: Session, batch_number: str) -> Optional[ProductBatch]:
        """Get batch by batch number"""
        return db.query(ProductBatch).filter(ProductBatch.batch_number == batch_number).first()
    
    @staticmethod
    def get_all_batches(db: Session, skip: int = 0, limit: int = 100) -> List[ProductBatch]:
        """Get all batches"""
        return db.query(ProductBatch).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_batch(db: Session, batch_data: Dict[str, Any]) -> ProductBatch:
        """Create a new product batch"""
        batch = ProductBatch(**batch_data)
        db.add(batch)
        db.flush()  # Get batch_id without committing
        return batch
    
    @staticmethod
    def create_batch_item(db: Session, batch_item_data: Dict[str, Any]) -> BatchItem:
        """Create batch item"""
        batch_item = BatchItem(**batch_item_data)
        db.add(batch_item)
        return batch_item
    
    @staticmethod
    def update_batch(db: Session, batch_id: int, update_data: Dict[str, Any]) -> Optional[ProductBatch]:
        """Update batch information"""
        batch = db.query(ProductBatch).filter(ProductBatch.batch_id == batch_id).first()
        
        if batch:
            for field, value in update_data.items():
                if hasattr(batch, field) and value is not None:
                    setattr(batch, field, value)
            db.commit()
            db.refresh(batch)
        
        return batch
    
    @staticmethod
    def get_batch_items(db: Session, batch_id: int) -> List[BatchItem]:
        """Get batch items"""
        return db.query(BatchItem).filter(BatchItem.batch_id == batch_id).all()