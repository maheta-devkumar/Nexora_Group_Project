from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class CouponVariant(Base):
    __tablename__ = "coupon_variant"

    coupon_id = Column(Integer, ForeignKey("coupon.coupon_id", ondelete="CASCADE"), primary_key=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"), primary_key=True)

    coupon = relationship("Coupon", back_populates="variants")
    variant = relationship("ProductVariant")