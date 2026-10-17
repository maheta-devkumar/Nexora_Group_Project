from sqlalchemy import Column, Integer, ForeignKey, String, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class ProductBatch(Base):
    __tablename__ = "product_batch"

    batch_id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchase.purchase_id", ondelete="CASCADE"))
    batch_number = Column(String(100), nullable=False, unique=True)
    manufactured_at = Column(TIMESTAMP)
    expires_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())

    purchase = relationship("Purchase", back_populates="batches")
    items = relationship("BatchItem", back_populates="batch")