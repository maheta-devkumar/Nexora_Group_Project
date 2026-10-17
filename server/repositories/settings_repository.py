from sqlalchemy.orm import Session
from models.settings_model import Settings
from schemas.settings_schema import SettingsUpdate

class SettingsRepository:
    @staticmethod
    def get_settings(db: Session) -> Settings:
        """Get the first (and only) settings row"""
        return db.query(Settings).first()

    @staticmethod
    def create_default(db: Session) -> Settings:
        """Create default settings if none exist"""
        default_settings = Settings()
        db.add(default_settings)
        db.commit()
        db.refresh(default_settings)
        return default_settings

    @staticmethod
    def update_settings(db: Session, settings_data: SettingsUpdate) -> Settings:
        """Update existing settings or create if missing"""
        settings = db.query(Settings).first()
        
        if not settings:
            settings = Settings()
            db.add(settings)
        
        # Update fields
        for key, value in settings_data.dict().items():
            setattr(settings, key, value)
            
        db.commit()
        db.refresh(settings)
        return settings
