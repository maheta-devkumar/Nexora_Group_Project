from sqlalchemy.orm import Session
from repositories.settings_repository import SettingsRepository
from schemas.settings_schema import SettingsUpdate, SettingsResponse
from services.notification_service import NotificationService
from repositories.user_repository import UserRepository

class SettingsService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = SettingsRepository()
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()

    def get_settings(self) -> SettingsResponse:
        settings = self.repository.get_settings(self.db)
        if not settings:
            settings = self.repository.create_default(self.db)
        return settings

    def update_settings(self, data: SettingsUpdate) -> SettingsResponse:
        updated_settings = self.repository.update_settings(self.db, data)
        
        # Notify Admins about settings update
        try:
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="⚙️ Settings Updated",
                    message="Global application settings have been updated.",
                    type="SYSTEM",
                    reference_id=None
                )
        except Exception as e:
            print(f"⚠️ Failed to send settings update notification: {e}")
            
        return updated_settings
