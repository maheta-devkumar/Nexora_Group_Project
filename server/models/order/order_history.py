from sqlalchemy import Column, Integer, ForeignKey, String, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class OrderHistory(Base):
    __tablename__ = "order_history"

    history_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("order.order_id", ondelete="CASCADE"))
    status = Column(String(50), nullable=False)
    updated_by = Column(Integer, ForeignKey("user.user_id", ondelete="SET NULL"))
    updated_at = Column(TIMESTAMP, server_default=func.now())

    order = relationship("Order", back_populates="histories")
    updated_user = relationship("User")