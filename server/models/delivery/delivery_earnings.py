from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, TIMESTAMP, func
from sqlalchemy.orm import relationship
from config.database import Base

class DeliveryEarnings(Base):
    __tablename__ = "delivery_earnings"

    earning_id = Column(Integer, primary_key=True, index=True)
    delivery_person_id = Column(Integer, ForeignKey("delivery_person.delivery_person_id", ondelete="CASCADE"))
    delivery_id = Column(Integer, ForeignKey("delivery.delivery_id", ondelete="CASCADE"))
    amount = Column(DECIMAL(10, 2), nullable=False)
    earned_at = Column(TIMESTAMP, server_default=func.now())

    delivery_person = relationship("DeliveryPerson", back_populates="earnings")
    delivery = relationship("Delivery", back_populates="earnings")