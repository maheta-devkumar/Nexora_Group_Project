from sqlalchemy import Column, Integer, String, ForeignKey, DECIMAL, Enum, TIMESTAMP, Boolean, func
from sqlalchemy.orm import relationship
from config.database import Base

class ProductVariant(Base):
    __tablename__ = "product_variant"

    variant_id = Column(Integer, primary_key=True, index=True)
    variant_name = Column(String(150))
    product_id = Column(Integer, ForeignKey("product.product_id", ondelete="CASCADE"), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    discount_type = Column(Enum('PERCENT', 'FLAT', 'NONE', name="discount_type_enum"), default="NONE")
    discount_value = Column(DECIMAL(10, 2), default=0.00)
    status = Column(Enum('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', name="status_enum"), default="ACTIVE")
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    is_default = Column(Boolean, default=False)

    product = relationship("Product", back_populates="variants")
    attributes = relationship("AttributeVariant", back_populates="variant")
    images = relationship("ProductImage", back_populates="variant")
    videos = relationship("ProductVideo", back_populates="variant")
    reviews = relationship("ProductReview", back_populates="variant")
    carts = relationship("Cart", back_populates="variant")
    wishlists = relationship("Wishlist", back_populates="variant")
    order_items = relationship("OrderItem", back_populates="variant")
    batch_items = relationship("BatchItem", back_populates="variant")
    analytics = relationship("ProductAnalytics", back_populates="variant")
    offer_variant = relationship("OfferVariant", back_populates="variant")
    coupon_variant = relationship("CouponVariant", back_populates="variant")