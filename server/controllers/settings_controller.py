from fastapi import HTTPException
from sqlalchemy.orm import Session
from services.settings_service import SettingsService
from schemas.settings_schema import SettingsUpdate

class SettingsController:
    def __init__(self, db: Session):
        self.service = SettingsService(db)

    def get_settings(self):
        try:
            return self.service.get_settings()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def update_settings(self, data: SettingsUpdate):
        try:
            return self.service.update_settings(data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
