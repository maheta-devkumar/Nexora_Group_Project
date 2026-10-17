from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.permission_service import PermissionService
from schemas.role_schema import PermissionCreate
from typing import List, Dict, Any

class PermissionController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = PermissionService(db)
    
    def get_all_permissions(self) -> List[Dict[str, Any]]:
        """Get all permissions"""
        try:
            return self.service.get_all_permissions()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_permission_by_id(self, permission_id: int) -> Dict[str, Any]:
        """Get permission by ID"""
        try:
            return self.service.get_permission_by_id(permission_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_permission(self, permission_data: PermissionCreate) -> Dict[str, Any]:
        """Create permission"""
        try:
            return self.service.create_permission(permission_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_permission(self, permission_id: int, update_data: dict) -> Dict[str, Any]:
        """Update permission"""
        try:
            return self.service.update_permission(permission_id, update_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_permission(self, permission_id: int) -> Dict[str, str]:
        """Delete permission"""
        try:
            return self.service.delete_permission(permission_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def assign_permission_to_role(self, role_id: int, permission_id: int) -> Dict[str, str]:
        """Assign permission to role"""
        try:
            return self.service.assign_permission_to_role(role_id, permission_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def remove_permission_from_role(self, role_id: int, permission_id: int) -> Dict[str, str]:
        """Remove permission from role"""
        try:
            return self.service.remove_permission_from_role(role_id, permission_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_role_permissions(self, role_id: int) -> List[Dict[str, Any]]:
        """Get role permissions"""
        try:
            return self.service.get_role_permissions(role_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_permission_roles(self, permission_id: int) -> List[Dict[str, Any]]:
        """Get permission roles"""
        try:
            return self.service.get_permission_roles(permission_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))