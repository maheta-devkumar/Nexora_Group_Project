from sqlalchemy import Column, Integer, ForeignKey, String, Text, TIMESTAMP, func, Enum
from sqlalchemy.orm import relationship
from config.database import Base
import enum

class FeedbackType(str, enum.Enum):
    COMPLAINT = "COMPLAINT"
    SUGGESTION = "SUGGESTION"
    APP_FEEDBACK = "APP_FEEDBACK"
    DELIVERY_FEEDBACK = "DELIVERY_FEEDBACK"

class FeedbackStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"))
    order_id = Column(Integer, ForeignKey("order.order_id", ondelete="SET NULL"), nullable=True)
    feedback_type = Column(Enum(FeedbackType), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)  # 1-5 scale
    feedback_status = Column(Enum(FeedbackStatus), default=FeedbackStatus.OPEN)
    created_at = Column(TIMESTAMP, server_default=func.now())
    resolved_at = Column(TIMESTAMP, nullable=True)

    user = relationship("User", back_populates="feedbacks")
    order = relationship("Order", back_populates="feedbacks")
    responses = relationship("FeedbackResponse", back_populates="feedback")

class FeedbackResponse(Base):
    __tablename__ = "feedback_response"

    response_id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedback.feedback_id", ondelete="CASCADE"))
    admin_id = Column(Integer, ForeignKey("user.user_id", ondelete="SET NULL"))
    response_message = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    feedback = relationship("Feedback", back_populates="responses")
    admin = relationship("User")