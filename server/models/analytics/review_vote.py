# models/product_catalog/review_vote.py

from sqlalchemy import Column, Integer, Boolean, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class ReviewVote(Base):
    __tablename__ = "review_vote"

    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), primary_key=True)
    review_id = Column(Integer, ForeignKey("product_review.review_id", ondelete="CASCADE"), primary_key=True)
    is_helpful = Column(Boolean, nullable=False)
    voted_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="review_votes")
    review = relationship("ProductReview", back_populates="votes")  # This should match the back_populates in ProductReview