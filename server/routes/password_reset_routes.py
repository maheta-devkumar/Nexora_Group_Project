from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from schemas.password_reset_schema import ForgotPasswordRequest, ResetPasswordRequest
from controllers.password_reset_controller import PasswordResetController

router = APIRouter(prefix="/api/v1/auth", tags=["Password Reset"])

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    controller = PasswordResetController(db)
    return controller.forgot_password(data.email)

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    controller = PasswordResetController(db)
    return controller.reset_password(
        data.email, data.otp, data.new_password
    )
