# services/password_reset_service.py
from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session

from repositories.auth_repository import AuthRepository
from utils.otp import generate_otp, hash_otp, verify_otp
from utils.email_forgot import send_otp_email
from utils.hashing import hash_password
from services.notification_service import NotificationService

OTP_EXPIRY_MINUTES = 10

class PasswordResetService:

    # services/password_reset_service.py - Update the request_reset method

    def request_reset(self, email: str, db: Session):
        user = AuthRepository.get_user_by_email(db, email)

        if not user:
            # For security, don't reveal if user exists
            return {"success": True, "message": "If your email is registered, you will receive an OTP shortly."}

        # ❌ Google users blocked
        if user.password_hash == "GOOGLE_AUTH":
            raise HTTPException(
                status_code=400,
                detail="This account uses Google login"
            )

        otp = generate_otp()
        
        # Store OTP hash and expiry
        user.password_reset_otp_hash = hash_otp(otp)
        user.password_reset_otp_expiry = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
        
        db.commit()
        
        # Try to send email
        email_sent = send_otp_email(user.email, otp)
        
        # Send notification
        try:
            notification_service = NotificationService(db)
            notification_service.send_notification(
                user_id=user.user_id,
                title="🔒 Password Reset Requested",
                message="A password reset OTP was sent to your email.",
                type="SECURITY",
                reference_id=None
            )
        except Exception as e:
            print(f"⚠️ Notification failed: {e}")
        
        # Always return success to frontend
        return {
            "success": True, 
            "message": "OTP sent to email. Please check your inbox (and spam folder)."
        }

    def reset_password(self, email: str, otp: str, new_password: str, db: Session):
        user = AuthRepository.get_user_by_email(db, email)

        if not user or not user.password_reset_otp_hash:
            raise HTTPException(status_code=400, detail="Invalid request")

        if user.password_reset_otp_expiry < datetime.utcnow():
            raise HTTPException(status_code=400, detail="OTP expired")

        if not verify_otp(otp, user.password_reset_otp_hash):
            raise HTTPException(status_code=400, detail="Invalid OTP")

        user.password_hash = hash_password(new_password)
        user.password_reset_otp_hash = None
        user.password_reset_otp_expiry = None

        db.commit()
        
        # Send notification
        try:
            notification_service = NotificationService(db)
            notification_service.send_notification(
                user_id=user.user_id,
                title="✅ Password Reset Successful",
                message="Your password has been successfully changed.",
                type="SECURITY",
                reference_id=None
            )
        except Exception as e:
            print(f"⚠️ Notification failed: {e}")

        return {"success": True, "message": "Password reset successful"}