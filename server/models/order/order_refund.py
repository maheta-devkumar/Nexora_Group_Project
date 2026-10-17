from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, String, TIMESTAMP, func, Text
from sqlalchemy.orm import relationship
from config.database import Base

class OrderRefund(Base):
    __tablename__ = "order_refund"

    refund_id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("order_return.return_id", ondelete="CASCADE"), nullable=False)
    payment_id = Column(Integer, ForeignKey("payment.payment_id", ondelete="CASCADE"))  # ADD THIS
    amount = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String(50), default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    payment_method = Column(String(50))  # CREDIT_CARD, WALLET, BANK_TRANSFER
    transaction_id = Column(String(100), unique=True)  # Reference from payment gateway
    reason = Column(Text)  # Refund reason
    processed_by = Column(Integer, ForeignKey("user.user_id"))  # Admin who processed
    processed_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())

    return_request = relationship("OrderReturn", back_populates="refund")
    payment = relationship("Payment", back_populates="refunds")  # ADD THIS
    processor = relationship("User")