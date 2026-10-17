from sqlalchemy import Column, Integer, String, Boolean
from config.database import Base

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String(100), nullable=False, default="My Store")
    support_email = Column(String(100), nullable=False, default="support@example.com")
    
    enable_upi = Column(Boolean, default=True)
    enable_card = Column(Boolean, default=True)
    enable_cod = Column(Boolean, default=True)
    
    allow_order_cancel = Column(Boolean, default=True)
    allow_returns = Column(Boolean, default=True)
    
    enable_admin_ai = Column(Boolean, default=False)
