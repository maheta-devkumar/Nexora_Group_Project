from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, func, Date, DateTime
from sqlalchemy.orm import relationship
from config.database import Base

class User(Base):
    __tablename__ = "user"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone = Column(String(20))
    profile_img_url = Column(String(255))
    gender = Column(String(10))
    dob = Column(Date)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    last_login = Column(TIMESTAMP)
    password_reset_otp_hash = Column(String(255), nullable=True)
    password_reset_otp_expiry = Column(DateTime, nullable=True)

    addresses = relationship("Address", back_populates="user")
    carts = relationship("Cart", back_populates="user")
    wishlists = relationship("Wishlist", back_populates="user")
    orders = relationship("Order", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    reviews = relationship("ProductReview", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")
    roles = relationship("UserRole", back_populates="user")
    delivery_person = relationship("DeliveryPerson", back_populates="user", uselist=False)
    review_votes = relationship("ReviewVote", back_populates="user")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete")
    activity_logs = relationship("AdminActivityLog", back_populates="admin", cascade="all, delete")