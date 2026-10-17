from sqlalchemy import Column, Integer, String, ForeignKey, Enum, TIMESTAMP, Boolean, func
from sqlalchemy.orm import relationship
from config.database import Base

class State(Base):
    __tablename__ = "state"

    state_id = Column(Integer, primary_key=True, index=True)
    state_name = Column(String(100), unique=True, nullable=False)
    cities = relationship("City", back_populates="state")

class City(Base):
    __tablename__ = "city"

    city_id = Column(Integer, primary_key=True, index=True)
    city_name = Column(String(100), nullable=False)
    state_id = Column(Integer, ForeignKey("state.state_id", ondelete="RESTRICT"), nullable=False)
    state = relationship("State", back_populates="cities")
    areas = relationship("Area", back_populates="city")

class Area(Base):
    __tablename__ = "area"

    area_id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("city.city_id", ondelete="RESTRICT"), nullable=False)
    area_name = Column(String(150), nullable=False)
    pincode = Column(String(10))
    city = relationship("City", back_populates="areas")
    addresses = relationship("Address", back_populates="area")
    company = relationship("Company", back_populates="area")
    supplier = relationship("Supplier", back_populates="area")

class Address(Base):
    __tablename__ = "address"

    address_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    address_type = Column(Enum('Home', 'Work', 'Other', name="address_type_enum"), nullable=False)
    line1 = Column(String(100), nullable=False)
    line2 = Column(String(100))
    area_id = Column(Integer, ForeignKey("area.area_id", ondelete="RESTRICT"), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    area = relationship("Area", back_populates="addresses")
    user = relationship("User", back_populates="addresses")
    orders = relationship("Order", back_populates="address")