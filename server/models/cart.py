from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class Cart(Base):
    __tablename__ = "cart"

    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), primary_key=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"), primary_key=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    added_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="carts")
    variant = relationship("ProductVariant", back_populates="carts")