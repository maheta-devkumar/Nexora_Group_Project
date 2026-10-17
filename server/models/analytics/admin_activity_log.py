from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base


class AdminActivityLog(Base):
    __tablename__ = "admin_activity_log"

    log_id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("user.user_id", ondelete="RESTRICT"), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer)
    old_value = Column(String)
    new_value = Column(String)
    ip_address = Column(String(45))
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationship
    admin = relationship("User", back_populates="activity_logs")