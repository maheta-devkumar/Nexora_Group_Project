from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class OfferVariant(Base):
    __tablename__ = "offer_variant"

    offer_id = Column(Integer, ForeignKey("offer.offer_id", ondelete="CASCADE"), primary_key=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"), primary_key=True)

    offer = relationship("Offer", back_populates="variants")
    variant = relationship("ProductVariant")