from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from config.database import Base

class ProductAttribute(Base):
    __tablename__ = "product_attribute"

    attribute_id = Column(Integer, primary_key=True, index=True)
    attribute_name = Column(String(100), unique=True, nullable=False)

    variants = relationship("AttributeVariant", back_populates="attribute")