from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from config.database import Base

class ProductBrand(Base):
    __tablename__ = "product_brand"

    brand_id = Column(Integer, primary_key=True, index=True)
    brand_name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))

    products = relationship("Product", back_populates="brand")