from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class AttributeVariant(Base):
    __tablename__ = "attribute_variant"

    attribute_id = Column(Integer, ForeignKey("product_attribute.attribute_id", ondelete="CASCADE"), primary_key=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"), primary_key=True)
    value = Column(String(100), nullable=False)

    attribute = relationship("ProductAttribute", back_populates="variants")
    variant = relationship("ProductVariant", back_populates="attributes")