from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base
from models.product_catalog.review_reply import ReviewReply

class ProductReview(Base):
    __tablename__ = "product_review"

    review_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    title = Column(String(100))
    body = Column(Text)
    images = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())
    status = Column(String(20), server_default="VISIBLE")

    user = relationship("User")
    variant = relationship("ProductVariant", back_populates="reviews")
    votes = relationship("ReviewVote", back_populates="review")
    replies = relationship("ReviewReply", back_populates="review", cascade="all, delete")
