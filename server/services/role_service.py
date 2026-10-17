from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.role_repository import RoleRepository
from schemas.role_schema import RoleCreate
from typing import List, Dict, Any

class RoleService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = RoleRepository()
    
    def serialize_role(self, role) -> Dict[str, Any]:
        """Convert role to dictionary"""
        return {
            "role_id": role.role_id,
            "role_name": role.role_name,
            "description": role.description,
            "is_active": role.is_active
        }
    
    def serialize_user_basic(self, user) -> Dict[str, Any]:
        """Convert user to basic dictionary"""
        return {
            "user_id": user.user_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email
        }
    
    def serialize_permission(self, permission) -> Dict[str, Any]:
        """Convert permission to dictionary"""
        return {
            "permission_id": permission.permission_id,
            "permission_name": permission.permission_name,
            "description": permission.description
        }
    
    def get_all_roles(self) -> List[Dict[str, Any]]:
        """Get all roles"""
        roles = self.repository.get_all_roles(self.db)
        return [self.serialize_role(role) for role in roles]
    
    def get_role_by_id(self, role_id: int) -> Dict[str, Any]:
        """Get role by ID"""
        role = self.repository.get_role_by_id(self.db, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        return self.serialize_role(role)
    
    def create_role(self, role_data: RoleCreate) -> Dict[str, Any]:
        """Create new role"""
        existing_role = self.repository.get_role_by_name(self.db, role_data.role_name)
        if existing_role:
            raise HTTPException(status_code=400, detail="Role already exists")
        
        new_role = self.repository.create_role(self.db, role_data.model_dump())
        return self.serialize_role(new_role)
    
    def update_role(self, role_id: int, update_data: dict) -> Dict[str, Any]:
        """Update role"""
        role = self.repository.get_role_by_id(self.db, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        updated_role = self.repository.update_role(self.db, role, update_data)
        return self.serialize_role(updated_role)
    
    def delete_role(self, role_id: int) -> Dict[str, str]:
        """Delete role"""
        role = self.repository.get_role_by_id(self.db, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        user_roles_count = self.repository.count_user_roles(self.db, role_id)
        if user_roles_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete role. It is assigned to {user_roles_count} users."
            )
        
        self.repository.delete_role(self.db, role)
        return {"message": "Role deleted successfully"}
    
    def assign_role_to_user(self, user_id: int, role_id: int) -> Dict[str, str]:
        """Assign role to user"""
        user = self.repository.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        role = self.repository.get_role_by_id(self.db, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        existing = self.repository.get_user_role(self.db, user_id, role_id)
        if existing:
            raise HTTPException(status_code=400, detail="Role already assigned to user")
        
        self.repository.create_user_role(self.db, user_id, role_id)
        return {"message": "Role assigned successfully"}
    
    def remove_role_from_user(self, user_id: int, role_id: int) -> Dict[str, str]:
        """Remove role from user"""
        user_role = self.repository.get_user_role(self.db, user_id, role_id)
        if not user_role:
            raise HTTPException(status_code=404, detail="Role not assigned to this user")
        
        self.repository.delete_user_role(self.db, user_role)
        return {"message": "Role removed from user successfully"}
    
    def get_user_roles(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all roles for a user"""
        user = self.repository.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        roles = self.repository.get_user_roles(self.db, user_id)
        return [self.serialize_role(role) for role in roles]
    
    def get_role_users(self, role_id: int) -> List[Dict[str, Any]]:
        """Get all users with a specific role"""
        role = self.repository.get_role_by_id(self.db, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        users = self.repository.get_role_users(self.db, role_id)
        return [self.serialize_user_basic(user) for user in users]
    
    def get_role_with_permissions(self, role_id: int) -> Dict[str, Any]:
        """Get role with all its permissions"""
        role = self.repository.get_role_by_id(self.db, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        permissions = self.repository.get_role_permissions(self.db, role_id)
        
        return {
            "role_id": role.role_id,
            "role_name": role.role_name,
            "description": role.description,
            "is_active": role.is_active,
            "permissions": [self.serialize_permission(perm) for perm in permissions]
        }