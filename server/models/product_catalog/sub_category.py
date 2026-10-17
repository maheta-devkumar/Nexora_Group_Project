from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class SubCategory(Base):
    __tablename__ = "sub_category"

    sub_category_id = Column(Integer, primary_key=True, index=True)
    sub_category_name = Column(String(100), nullable=False)
    category_id = Column(Integer, ForeignKey("category.category_id", ondelete="RESTRICT"), nullable=False)
    description = Column(String(255))

    category = relationship("Category", back_populates="sub_categories")
    products = relationship("Product", back_populates="sub_category")