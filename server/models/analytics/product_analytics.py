from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class ProductAnalytics(Base):
    __tablename__ = "product_analytics"

    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"), primary_key=True)
    view_count = Column(Integer, default=0)
    cart_add_count = Column(Integer, default=0)
    wishlist_add_count = Column(Integer, default=0)
    purchase_count = Column(Integer, default=0)
    last_updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    variant = relationship("ProductVariant")