from sqlalchemy import Column, Integer, ForeignKey, String, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class OrderReturn(Base):
    __tablename__ = "order_return"

    return_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("order.order_id", ondelete="CASCADE"))
    reason = Column(String(255))
    status = Column(String(50), default="REQUESTED")
    requested_at = Column(TIMESTAMP, server_default=func.now())

    order = relationship("Order", back_populates="returns")
    items = relationship("ReturnProduct", back_populates="return_request")
    refund = relationship("OrderRefund", back_populates="return_request", uselist=False)