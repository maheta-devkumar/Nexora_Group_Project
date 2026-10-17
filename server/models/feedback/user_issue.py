from sqlalchemy import Column, Integer, ForeignKey, String, Text, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class UserIssue(Base):
    __tablename__ = "user_issue"

    issue_id = Column(Integer, primary_key=True, index=True)
    raised_by_id = Column(Integer, ForeignKey("user.user_id", ondelete="SET NULL"))
    raised_by_role = Column(String(50), nullable=False)
    order_id = Column(Integer, ForeignKey("order.order_id", ondelete="CASCADE"))
    delivery_id = Column(Integer, ForeignKey("delivery.delivery_id", ondelete="CASCADE"))
    issue_type = Column(String(50), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="MEDIUM")
    status = Column(String(50), default="OPEN")
    resolution_note = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    resolved_at = Column(TIMESTAMP)

    raised_by = relationship("User")
    order = relationship("Order", back_populates="issues")
    delivery = relationship("Delivery", back_populates="issues")