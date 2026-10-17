from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class ProductImage(Base):
    __tablename__ = "product_image"

    image_id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"), nullable=False)
    url = Column(String(255), nullable=False)
    is_default = Column(Boolean, default=False)

    variant = relationship("ProductVariant", back_populates="images")