from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, TIMESTAMP, String, func
from sqlalchemy.orm import relationship
from config.database import Base

class StockMovement(Base):
    __tablename__ = "stock_movement"

    movement_id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"))
    movement_type = Column(String(20), nullable=False)
    reference_type = Column(String(50))
    reference_id = Column(Integer)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(DECIMAL(12, 2))
    remark = Column(String(255))
    moved_at = Column(TIMESTAMP, server_default=func.now())

    variant = relationship("ProductVariant")