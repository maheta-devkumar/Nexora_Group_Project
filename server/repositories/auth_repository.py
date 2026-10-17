from sqlalchemy.orm import Session
from models.user import User
from typing import Optional

class AuthRepository:
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Find user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Find user by username"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_email_or_username(db: Session, email: str, username: str) -> Optional[User]:
        """Find user by email or username"""
        return db.query(User).filter(
            (User.email == email) | (User.username == username)
        ).first()
    
    @staticmethod
    def create_user(db: Session, user_data: dict) -> User:
        """Create new user"""
        new_user = User(**user_data)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.user_id == user_id).first()