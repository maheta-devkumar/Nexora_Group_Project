# models/inventory/company.py
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class Company(Base):
    __tablename__ = "company"

    company_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    gst_number = Column(String(50))
    address_line = Column(Text)
    area_id = Column(Integer, ForeignKey("area.area_id", ondelete="RESTRICT"), nullable=False)
    contact_email = Column(String(100))
    contact_phone = Column(String(20))
    website = Column(String(200))  # Added website
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    suppliers = relationship("Supplier", back_populates="company")
    area = relationship("Area", back_populates="company")