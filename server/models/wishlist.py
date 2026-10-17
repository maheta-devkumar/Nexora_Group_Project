from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class Wishlist(Base):
    __tablename__ = "wishlist"

    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), primary_key=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="wishlists")
    variant = relationship("ProductVariant", back_populates="wishlists")