from services.password_reset_service import PasswordResetService

class PasswordResetController:
    def __init__(self, db):
        self.service = PasswordResetService()
        self.db = db

    def forgot_password(self, email: str):
        return self.service.request_reset(email, self.db)

    def reset_password(self, email: str, otp: str, password: str):
        return self.service.reset_password(email, otp, password, self.db)
