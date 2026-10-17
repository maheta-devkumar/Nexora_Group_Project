from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class BatchItem(Base):
    __tablename__ = "batch_item"

    batch_id = Column(Integer, ForeignKey("product_batch.batch_id", ondelete="CASCADE"), primary_key=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="RESTRICT"), primary_key=True)
    quantity = Column(Integer, nullable=False)

    batch = relationship("ProductBatch", back_populates="items")
    variant = relationship("ProductVariant")