from sqlalchemy import Column, Integer, ForeignKey, String, DECIMAL, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class Order(Base):
    __tablename__ = "order"

    order_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"))
    address_id = Column(Integer, ForeignKey("address.address_id", ondelete="SET NULL"))  # Changed from "addresses" to "address"
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    discount_amount = Column(DECIMAL(10, 2), default=0.00)
    delivery_fee = Column(DECIMAL(10, 2), default=0.00)
    tax_amount = Column(DECIMAL(10, 2), default=0.00)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    coupon_code = Column(String(50))
    payment_status = Column(String(50), default="PENDING")
    order_status = Column(String(50), default="PLACED")
    placed_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="orders")
    address = relationship("Address")
    items = relationship("OrderItem", back_populates="order")
    histories = relationship("OrderHistory", back_populates="order")
    returns = relationship("OrderReturn", back_populates="order")
    delivery = relationship("Delivery", back_populates="order", uselist=False)
    payment = relationship("Payment", back_populates="order", uselist=False)
    issues = relationship("UserIssue", back_populates="order")
    feedbacks = relationship("Feedback", back_populates="order")