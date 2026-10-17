# models/inventory/purchase.py
from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, TIMESTAMP, String, func, Text
from sqlalchemy.orm import relationship
from config.database import Base

class Purchase(Base):
    __tablename__ = "purchase"

    purchase_id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("supplier.supplier_id", ondelete="SET NULL"))
    invoice_number = Column(String(100), unique=True)
    total_cost = Column(DECIMAL(12, 2), nullable=False, default=0.00)
    purchase_date = Column(TIMESTAMP, server_default=func.now())
    status = Column(String(50), default="PENDING")  # PENDING, RECEIVED, CANCELLED, RETURNED
    notes = Column(Text)  # Added notes field
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    supplier = relationship("Supplier", back_populates="purchases")
    items = relationship("PurchaseItem", back_populates="purchase")
    batches = relationship("ProductBatch", back_populates="purchase")
    returns = relationship("PurchaseReturn", back_populates="purchase")  # Added