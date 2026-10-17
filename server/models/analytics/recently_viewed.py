from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, func
from config.database import Base

class RecentlyViewed(Base):
    __tablename__ = "recently_viewed"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"))
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="CASCADE"))
    viewed_at = Column(TIMESTAMP, server_default=func.now())