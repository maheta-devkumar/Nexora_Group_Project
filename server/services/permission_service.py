from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.permission_repository import PermissionRepository
from schemas.role_schema import PermissionCreate
from typing import List, Dict, Any

class PermissionService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = PermissionRepository()
    
    def serialize_permission(self, permission) -> Dict[str, Any]:
        """Convert permission to dictionary"""
        return {
            "permission_id": permission.permission_id,
            "permission_name": permission.permission_name,
            "description": permission.description
        }
    
    def serialize_role_basic(self, role) -> Dict[str, Any]:
        """Convert role to basic dictionary"""
        return {
            "role_id": role.role_id,
            "role_name": role.role_name,
            "description": role.description,
            "is_active": role.is_active
        }
    
    def get_all_permissions(self) -> List[Dict[str, Any]]:
        """Get all permissions"""
        permissions = self.repository.get_all_permissions(self.db)
        return [self.serialize_permission(permission) for permission in permissions]
    
    def get_permission_by_id(self, permission_id: int) -> Dict[str, Any]:
        """Get permission by ID"""
        permission = self.repository.get_permission_by_id(self.db, permission_id)
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")
        return self.serialize_permission(permission)
    
    def create_permission(self, permission_data: PermissionCreate) -> Dict[str, Any]:
        """Create new permission"""
        existing = self.repository.get_permission_by_name(self.db, permission_data.permission_name)
        if existing:
            raise HTTPException(status_code=400, detail="Permission already exists")
        
        new_permission = self.repository.create_permission(self.db, permission_data.model_dump())
        return self.serialize_permission(new_permission)
    
    def update_permission(self, permission_id: int, update_data: dict) -> Dict[str, Any]:
        """Update permission"""
        permission = self.repository.get_permission_by_id(self.db, permission_id)
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")
        
        updated_permission = self.repository.update_permission(self.db, permission, update_data)
        return self.serialize_permission(updated_permission)
    
    def delete_permission(self, permission_id: int) -> Dict[str, str]:
        """Delete permission"""
        permission = self.repository.get_permission_by_id(self.db, permission_id)
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")
        
        role_permissions_count = self.repository.count_role_permissions(self.db, permission_id)
        if role_permissions_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete permission. It is assigned to {role_permissions_count} roles."
            )
        
        self.repository.delete_permission(self.db, permission)
        return {"message": "Permission deleted successfully"}
    
    def assign_permission_to_role(self, role_id: int, permission_id: int) -> Dict[str, str]:
        """Assign permission to role"""
        role = self.repository.get_role_by_id(self.db, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        permission = self.repository.get_permission_by_id(self.db, permission_id)
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")
        
        existing = self.repository.get_role_permission(self.db, role_id, permission_id)
        if existing:
            raise HTTPException(status_code=400, detail="Permission already assigned to this role")
        
        self.repository.create_role_permission(self.db, role_id, permission_id)
        return {"message": "Permission assigned to role successfully"}
    
    def remove_permission_from_role(self, role_id: int, permission_id: int) -> Dict[str, str]:
        """Remove permission from role"""
        role_permission = self.repository.get_role_permission(self.db, role_id, permission_id)
        if not role_permission:
            raise HTTPException(status_code=404, detail="Permission not assigned to this role")
        
        self.repository.delete_role_permission(self.db, role_permission)
        return {"message": "Permission removed from role successfully"}
    
    def get_role_permissions(self, role_id: int) -> List[Dict[str, Any]]:
        """Get all permissions for a role"""
        role = self.repository.get_role_by_id(self.db, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        permissions = self.repository.get_role_permissions(self.db, role_id)
        return [self.serialize_permission(permission) for permission in permissions]
    
    def get_permission_roles(self, permission_id: int) -> List[Dict[str, Any]]:
        """Get all roles with a specific permission"""
        permission = self.repository.get_permission_by_id(self.db, permission_id)
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")
        
        roles = self.repository.get_permission_roles(self.db, permission_id)
        return [self.serialize_role_basic(role) for role in roles]