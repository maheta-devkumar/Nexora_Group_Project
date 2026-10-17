from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.role_service import RoleService
from schemas.role_schema import RoleCreate
from typing import List, Dict, Any

class RoleController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = RoleService(db)
    
    def get_all_roles(self) -> List[Dict[str, Any]]:
        """Get all roles"""
        try:
            return self.service.get_all_roles()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_role_by_id(self, role_id: int) -> Dict[str, Any]:
        """Get role by ID"""
        try:
            return self.service.get_role_by_id(role_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_role(self, role_data: RoleCreate) -> Dict[str, Any]:
        """Create role"""
        try:
            return self.service.create_role(role_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_role(self, role_id: int, update_data: dict) -> Dict[str, Any]:
        """Update role"""
        try:
            return self.service.update_role(role_id, update_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_role(self, role_id: int) -> Dict[str, str]:
        """Delete role"""
        try:
            return self.service.delete_role(role_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def assign_role_to_user(self, user_id: int, role_id: int) -> Dict[str, str]:
        """Assign role to user"""
        try:
            return self.service.assign_role_to_user(user_id, role_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def remove_role_from_user(self, user_id: int, role_id: int) -> Dict[str, str]:
        """Remove role from user"""
        try:
            return self.service.remove_role_from_user(user_id, role_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_user_roles(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user roles"""
        try:
            return self.service.get_user_roles(user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_role_users(self, role_id: int) -> List[Dict[str, Any]]:
        """Get role users"""
        try:
            return self.service.get_role_users(role_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_role_with_permissions(self, role_id: int) -> Dict[str, Any]:
        """Get role with permissions"""
        try:
            return self.service.get_role_with_permissions(role_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))