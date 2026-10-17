from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base

class Offer(Base):
    __tablename__ = "offer"

    offer_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    discount_type = Column(String(20), nullable=False)  # PERCENT, FLAT
    discount_value = Column(DECIMAL(10, 2), nullable=False)
    start_date = Column(TIMESTAMP, nullable=False)
    end_date = Column(TIMESTAMP, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    variants = relationship("OfferVariant", back_populates="offer")