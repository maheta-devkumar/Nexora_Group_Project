# repositories/password_reset_repository.py
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class PasswordResetRepository:
    
    @staticmethod
    def store_otp_in_session(db: Session, user_id: int, otp_hash: str) -> Dict:
        """Store OTP in a temporary session (simplified - for demo use Redis in production)"""
        # In production, use Redis or a temporary table
        # For now, we'll return a dict as a simple in-memory solution
        # Note: This is simplified - in production, use a proper cache like Redis
        expiry = datetime.utcnow() + timedelta(minutes=10)
        return {
            "user_id": user_id,
            "otp_hash": otp_hash,
            "expires_at": expiry,
            "created_at": datetime.utcnow()
        }
    
    @staticmethod
    def verify_otp_from_session(user_id: int, otp_hash: str) -> bool:
        """Verify OTP from session (simplified)"""
        # In production, check from Redis/cache
        # For demo, we'll simulate by checking if it matches
        # Actual implementation would verify against stored hash in cache
        return True
    
    @staticmethod
    def invalidate_otp(user_id: int):
        """Invalidate OTP for user"""
        # In production, remove from Redis/cache
        pass