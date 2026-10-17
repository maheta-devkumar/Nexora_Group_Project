from sqlalchemy.orm import Session
from models.role import Role, UserRole, RolePermission, Permission
from models.user import User
from typing import List, Optional, Dict, Any
from datetime import datetime

class RoleRepository:
    
    @staticmethod
    def get_all_roles(db: Session) -> List[Role]:
        """Get all active roles"""
        return db.query(Role).filter(Role.is_active == True).all()
    
    @staticmethod
    def get_role_by_id(db: Session, role_id: int) -> Optional[Role]:
        """Get role by ID"""
        return db.query(Role).filter(Role.role_id == role_id).first()
    
    @staticmethod
    def get_role_by_name(db: Session, role_name: str) -> Optional[Role]:
        """Get role by name"""
        return db.query(Role).filter(Role.role_name == role_name).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.user_id == user_id).first()
    
    @staticmethod
    def get_user_role(db: Session, user_id: int, role_id: int) -> Optional[UserRole]:
        """Get user role relationship"""
        return db.query(UserRole).filter(
            UserRole.user_id == user_id, 
            UserRole.role_id == role_id
        ).first()
    
    @staticmethod
    def get_user_roles(db: Session, user_id: int) -> List[Role]:
        """Get all roles for a user"""
        return db.query(Role).join(UserRole).filter(
            UserRole.user_id == user_id,
            Role.is_active == True
        ).all()
    
    @staticmethod
    def get_role_users(db: Session, role_id: int) -> List[User]:
        """Get all users with a specific role"""
        return db.query(User).join(UserRole).filter(
            UserRole.role_id == role_id,
            User.is_active == True
        ).all()
    
    @staticmethod
    def get_role_permissions(db: Session, role_id: int) -> List[Permission]:
        """Get all permissions for a role"""
        return db.query(Permission).join(RolePermission).filter(
            RolePermission.role_id == role_id
        ).all()
    
    @staticmethod
    def count_user_roles(db: Session, role_id: int) -> int:
        """Count users with a specific role"""
        return db.query(UserRole).filter(UserRole.role_id == role_id).count()
    
    @staticmethod
    def create_role(db: Session, role_data: dict) -> Role:
        """Create new role"""
        new_role = Role(**role_data)
        db.add(new_role)
        db.commit()
        db.refresh(new_role)
        return new_role
    
    @staticmethod
    def create_user_role(db: Session, user_id: int, role_id: int) -> UserRole:
        """Create user role relationship"""
        user_role = UserRole(user_id=user_id, role_id=role_id, assigned_at=datetime.now())
        db.add(user_role)
        db.commit()
        return user_role
    
    @staticmethod
    def update_role(db: Session, role: Role, update_data: dict) -> Role:
        """Update role"""
        for key, value in update_data.items():
            if hasattr(role, key):
                setattr(role, key, value)
        
        db.commit()
        db.refresh(role)
        return role
    
    @staticmethod
    def delete_role(db: Session, role: Role) -> None:
        """Delete role"""
        db.delete(role)
        db.commit()
    
    @staticmethod
    def delete_user_role(db: Session, user_role: UserRole) -> None:
        """Delete user role relationship"""
        db.delete(user_role)
        db.commit()