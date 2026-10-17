from sqlalchemy import Column, Integer, ForeignKey, String, TIMESTAMP, func, Boolean, DECIMAL, JSON
from sqlalchemy.orm import relationship
from config.database import Base

class Delivery(Base):
    __tablename__ = "delivery"

    delivery_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("order.order_id", ondelete="CASCADE"))
    delivery_person_id = Column(Integer, ForeignKey("delivery_person.delivery_person_id", ondelete="SET NULL"))
    status = Column(String(50), default="ASSIGNED")
    assigned_at = Column(TIMESTAMP, server_default=func.now())
    delivered_at = Column(TIMESTAMP)
    
    # Add these new fields for notification system
    is_available = Column(Boolean, default=False)  # For available deliveries pool
    available_since = Column(TIMESTAMP)  # When it became available
    notification_sent = Column(Boolean, default=False)  # If notifications sent
    last_notification_sent = Column(TIMESTAMP)  # Last notification time
    notification_count = Column(Integer, default=0)  # How many times notified
    
    # Existing additional fields
    expected_delivery_time = Column(TIMESTAMP)
    actual_delivery_time = Column(TIMESTAMP)
    pod_image_url = Column(String(500))
    signature_url = Column(String(500))
    delivery_notes = Column(String(1000))
    distance_km = Column(DECIMAL(6, 2))
    

    
    # OTP Fields
    pickup_otp = Column(String(255))  # OTP for pickup
    delivery_otp = Column(String(255))  # Hashed OTP
    delivery_otp_expiry = Column(TIMESTAMP)
    
    rejected_by = Column(JSON, default=[])  # List of delivery person IDs who rejected
    offered_to = Column(JSON, default=[])  # List of delivery person IDs offered to

    order = relationship("Order", back_populates="delivery")
    delivery_person = relationship("DeliveryPerson", back_populates="deliveries")
    earnings = relationship("DeliveryEarnings", back_populates="delivery")
    issues = relationship("UserIssue", back_populates="delivery")