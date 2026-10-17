from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class Product(Base):
    __tablename__ = "product"

    product_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255), nullable=False)
    description = Column(Text)
    brand_id = Column(Integer, ForeignKey("product_brand.brand_id", ondelete="SET NULL"))
    sub_category_id = Column(Integer, ForeignKey("sub_category.sub_category_id", ondelete="RESTRICT"))
    created_at = Column(TIMESTAMP, server_default=func.now())

    brand = relationship("ProductBrand", back_populates="products")
    sub_category = relationship("SubCategory", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product")