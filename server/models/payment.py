from sqlalchemy import Column, Integer, ForeignKey, String, DECIMAL, TIMESTAMP, func, Text, Boolean
from sqlalchemy.orm import relationship
from config.database import Base

class Payment(Base):
    __tablename__ = "payment"

    payment_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"))
    order_id = Column(Integer, ForeignKey("order.order_id", ondelete="CASCADE"))  # Make sure it's "order.order_id"
    payment_method = Column(String(50), nullable=False)
    payment_status = Column(String(50), default="PENDING")
    transaction_reference = Column(String(100))
    amount_paid = Column(DECIMAL(10, 2), nullable=False)
    amount_refunded = Column(DECIMAL(10, 2), default=0.00)  # ADD THIS
    refundable = Column(Boolean, default=True)  # ADD THIS - for COD etc.
    payment_date = Column(TIMESTAMP, server_default=func.now())
    remarks = Column(Text)

    user = relationship("User", back_populates="payments")
    order = relationship("Order", back_populates="payment")
    refunds = relationship("OrderRefund", back_populates="payment")