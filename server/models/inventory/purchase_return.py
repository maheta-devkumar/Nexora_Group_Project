# models/inventory/purchase_return.py
from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, TIMESTAMP, String, Text, func
from sqlalchemy.orm import relationship
from config.database import Base

class PurchaseReturn(Base):
    __tablename__ = "purchase_return"

    return_id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchase.purchase_id", ondelete="CASCADE"))
    reason = Column(Text, nullable=False)
    return_date = Column(TIMESTAMP, server_default=func.now())
    total_refund = Column(DECIMAL(12, 2), nullable=False)
    status = Column(String(50), default="PENDING")  # PENDING, APPROVED, COMPLETED
    
    purchase = relationship("Purchase", back_populates="returns")
    items = relationship("PurchaseReturnItem", back_populates="return_request")

class PurchaseReturnItem(Base):
    __tablename__ = "purchase_return_item"

    return_id = Column(Integer, ForeignKey("purchase_return.return_id", ondelete="CASCADE"), primary_key=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="RESTRICT"), primary_key=True)
    quantity = Column(Integer, nullable=False)
    refund_amount = Column(DECIMAL(12, 2), nullable=False)
    
    return_request = relationship("PurchaseReturn", back_populates="items")
    variant = relationship("ProductVariant")