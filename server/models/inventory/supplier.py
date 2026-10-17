# models/inventory/supplier.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DECIMAL, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class Supplier(Base):
    __tablename__ = "supplier"

    supplier_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company.company_id", ondelete="CASCADE"))
    name = Column(String(150), nullable=False)
    email = Column(String(100))
    phone = Column(String(20))
    address_line = Column(Text)
    area_id = Column(Integer, ForeignKey("area.area_id", ondelete="RESTRICT"), nullable=False)
    gst_number = Column(String(50))  # Added GST number
    is_active = Column(Boolean, default=True)  # Soft delete
    total_purchases = Column(DECIMAL(12, 2), default=0.00)  # Performance metric
    last_purchase_date = Column(TIMESTAMP)  # Performance metric
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    company = relationship("Company", back_populates="suppliers")
    purchases = relationship("Purchase", back_populates="supplier")
    area = relationship("Area", back_populates="supplier")