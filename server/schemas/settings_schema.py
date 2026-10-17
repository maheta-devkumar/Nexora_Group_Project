from pydantic import BaseModel, EmailStr
from typing import Optional

class SettingsUpdate(BaseModel):
    store_name: str
    support_email: EmailStr
    enable_upi: bool
    enable_card: bool
    enable_cod: bool
    allow_order_cancel: bool
    allow_returns: bool
    enable_admin_ai: bool

    class Config:
        from_attributes = True

class SettingsResponse(SettingsUpdate):
    id: int
