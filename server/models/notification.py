from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, func, Text, Enum
from sqlalchemy.orm import relationship
from config.database import Base
import enum

# Define ENUM for notification types
class NotificationType(enum.Enum):
    ORDER = "ORDER"
    PAYMENT = "PAYMENT"
    DELIVERY = "DELIVERY"
    DELIVERY_OFFER = "DELIVERY_OFFER"
    OFFER = "OFFER"
    FEEDBACK = "FEEDBACK"
    SYSTEM = "SYSTEM"
    SECURITY = "SECURITY"

class Notification(Base):
    __tablename__ = "notifications"  # ✅ Changed to plural
    
    notification_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)  # ✅ Changed to Text for longer content
    type = Column(Enum(NotificationType), nullable=False)  # ✅ Added ENUM constraint
    reference_id = Column(Integer, nullable=True)  # ✅ NEW: For order_id, payment_id, etc.
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    read_at = Column(TIMESTAMP, nullable=True)  # ✅ NEW: Track when notification was read

    user = relationship("User", back_populates="notifications")