from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class ReturnProduct(Base):
    __tablename__ = "return_product"

    return_id = Column(Integer, ForeignKey("order_return.return_id", ondelete="CASCADE"), primary_key=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"), primary_key=True)
    quantity = Column(Integer, nullable=False)

    return_request = relationship("OrderReturn", back_populates="items")
    variant = relationship("ProductVariant")