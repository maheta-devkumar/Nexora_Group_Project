from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, func, Boolean
from sqlalchemy.orm import relationship
from config.database import Base

class Coupon(Base):
    __tablename__ = "coupon"

    coupon_id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    discount_type = Column(String(20), nullable=False)
    discount_value = Column(DECIMAL(10, 2), nullable=False)
    min_order_amount = Column(DECIMAL(10, 2))
    max_discount_amount = Column(DECIMAL(10, 2))
    start_date = Column(TIMESTAMP, nullable=False)
    end_date = Column(TIMESTAMP, nullable=False)
    usage_limit = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    variants = relationship("CouponVariant", back_populates="coupon")