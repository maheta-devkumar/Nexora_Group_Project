from sqlalchemy import Column, Integer, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class ReviewReply(Base):
    __tablename__ = "review_reply"

    reply_id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("product_review.review_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="SET NULL"))
    body = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    review = relationship("ProductReview", back_populates="replies")
    user = relationship("User")
