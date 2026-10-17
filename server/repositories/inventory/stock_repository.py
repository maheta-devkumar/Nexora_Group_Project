from sqlalchemy.orm import Session
from sqlalchemy import func
from models.inventory.stock_movement import StockMovement
from models.product_catalog.product_variant import ProductVariant
from typing import List, Dict, Any, Optional

class StockRepository:
    
    @staticmethod
    def get_all_stock_movements(db: Session, skip: int = 0, limit: int = 100) -> List[StockMovement]:
        """Get all stock movements"""
        return db.query(StockMovement).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_stock_movements_by_variant(db: Session, variant_id: int, skip: int = 0, limit: int = 100) -> List[StockMovement]:
        """Get stock movements for a specific variant"""
        return db.query(StockMovement)\
            .filter(StockMovement.variant_id == variant_id)\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    @staticmethod
    def create_stock_movement(db: Session, movement_data: Dict[str, Any]) -> StockMovement:
        """Create a new stock movement"""
        movement = StockMovement(**movement_data)
        db.add(movement)
        db.commit()
        db.refresh(movement)
        return movement
    
    @staticmethod
    def get_stock_summary(db: Session) -> List[Dict[str, Any]]:
        """Get current stock summary for all variants"""
        variants = db.query(ProductVariant).all()
        
        stock_summary = []
        for variant in variants:
            # Calculate current stock from movements
            incoming = db.query(StockMovement).filter(
                StockMovement.variant_id == variant.variant_id,
                StockMovement.movement_type.in_(["IN", "RETURN"])
            ).with_entities(StockMovement.quantity).all()
            
            outgoing = db.query(StockMovement).filter(
                StockMovement.variant_id == variant.variant_id,
                StockMovement.movement_type.in_(["OUT", "ADJUSTMENT"])
            ).with_entities(StockMovement.quantity).all()
            
            total_in = sum([mov.quantity for mov in incoming])
            total_out = sum([mov.quantity for mov in outgoing])
            current_stock = total_in - total_out
            
            stock_summary.append({
                "variant": variant,
                "current_stock": current_stock,
                "total_in": total_in,
                "total_out": total_out
            })
        
        return stock_summary