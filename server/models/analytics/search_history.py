from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, func
from config.database import Base

class SearchHistory(Base):
    __tablename__ = "search_history"

    search_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="SET NULL"))
    search_query = Column(String(255), nullable=False)
    results_count = Column(Integer, default=0)
    searched_at = Column(TIMESTAMP, server_default=func.now())