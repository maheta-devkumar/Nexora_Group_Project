from sqlalchemy import Column, Integer, String, ForeignKey, DECIMAL, TIMESTAMP, func, Boolean, JSON
from sqlalchemy.orm import relationship
from config.database import Base

class DeliveryPerson(Base):
    __tablename__ = "delivery_person"

    delivery_person_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"))
    license_number = Column(String(100))
    status = Column(String(50), default="ACTIVE")
    rating = Column(DECIMAL(3, 2), default=0.0)
    joined_at = Column(TIMESTAMP, server_default=func.now())
    is_online = Column(Boolean, default=False)  # For status toggle
    current_location = Column(JSON)  # For map: {lat: xx, lng: xx}
    vehicle_info = Column(JSON)  # {type: "bike", number: "GJ01AB1234", insurance: "2025-12-31"}
    documents = Column(JSON)  # {aadhaar: "url", license: "url", pan: "url"}
    
    # Performance Metrics (Cached)
    total_deliveries = Column(Integer, default=0)
    total_earnings = Column(DECIMAL(10, 2), default=0.00)
    success_rate = Column(DECIMAL(5, 2), default=100.00)

    user = relationship("User")
    deliveries = relationship("Delivery", back_populates="delivery_person")
    earnings = relationship("DeliveryEarnings", back_populates="delivery_person")