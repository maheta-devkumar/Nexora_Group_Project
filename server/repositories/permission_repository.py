from sqlalchemy.orm import Session
from models.role import Permission, RolePermission, Role
from typing import List, Optional
from datetime import datetime

class PermissionRepository:
    
    @staticmethod
    def get_all_permissions(db: Session) -> List[Permission]:
        """Get all permissions"""
        return db.query(Permission).all()
    
    @staticmethod
    def get_permission_by_id(db: Session, permission_id: int) -> Optional[Permission]:
        """Get permission by ID"""
        return db.query(Permission).filter(Permission.permission_id == permission_id).first()
    
    @staticmethod
    def get_permission_by_name(db: Session, permission_name: str) -> Optional[Permission]:
        """Get permission by name"""
        return db.query(Permission).filter(Permission.permission_name == permission_name).first()
    
    @staticmethod
    def get_role_by_id(db: Session, role_id: int) -> Optional[Role]:
        """Get role by ID"""
        return db.query(Role).filter(Role.role_id == role_id).first()
    
    @staticmethod
    def get_role_permission(db: Session, role_id: int, permission_id: int) -> Optional[RolePermission]:
        """Get role permission relationship"""
        return db.query(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id
        ).first()
    
    @staticmethod
    def get_role_permissions(db: Session, role_id: int) -> List[Permission]:
        """Get all permissions for a role"""
        return db.query(Permission).join(RolePermission).filter(
            RolePermission.role_id == role_id
        ).all()
    
    @staticmethod
    def get_permission_roles(db: Session, permission_id: int) -> List[Role]:
        """Get all roles with a specific permission"""
        return db.query(Role).join(RolePermission).filter(
            RolePermission.permission_id == permission_id
        ).all()
    
    @staticmethod
    def count_role_permissions(db: Session, permission_id: int) -> int:
        """Count roles with a specific permission"""
        return db.query(RolePermission).filter(RolePermission.permission_id == permission_id).count()
    
    @staticmethod
    def create_permission(db: Session, permission_data: dict) -> Permission:
        """Create new permission"""
        new_permission = Permission(**permission_data)
        db.add(new_permission)
        db.commit()
        db.refresh(new_permission)
        return new_permission
    
    @staticmethod
    def create_role_permission(db: Session, role_id: int, permission_id: int) -> RolePermission:
        """Create role permission relationship"""
        role_permission = RolePermission(
            role_id=role_id,
            permission_id=permission_id,
            assigned_at=datetime.now()
        )
        db.add(role_permission)
        db.commit()
        return role_permission
    
    @staticmethod
    def update_permission(db: Session, permission: Permission, update_data: dict) -> Permission:
        """Update permission"""
        for key, value in update_data.items():
            if hasattr(permission, key):
                setattr(permission, key, value)
        
        db.commit()
        db.refresh(permission)
        return permission
    
    @staticmethod
    def delete_permission(db: Session, permission: Permission) -> None:
        """Delete permission"""
        db.delete(permission)
        db.commit()
    
    @staticmethod
    def delete_role_permission(db: Session, role_permission: RolePermission) -> None:
        """Delete role permission relationship"""
        db.delete(role_permission)
        db.commit()