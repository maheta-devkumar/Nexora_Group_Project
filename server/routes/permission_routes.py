from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.permission_controller import PermissionController
from schemas.role_schema import (
    PermissionCreate, PermissionWrapper, MessageWrapper, 
    PermissionListWrapper, RoleListWrapper
)

router = APIRouter(prefix="/api/v1/permissions", tags=["Permissions"])

# ✅✅✅ STATIC ROUTES MUST COME FIRST ✅✅✅
@router.post("/assign", response_model=MessageWrapper)
def assign_permission(
    role_id: int = Query(..., description="Role ID"),
    permission_id: int = Query(..., description="Permission ID"),
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Assign permission to role"""
    controller = PermissionController(db)
    result = controller.assign_permission_to_role(role_id, permission_id)
    return {"success": True, "message": result.get("message"), "data": result}

@router.delete("/remove", response_model=MessageWrapper)
def remove_permission_assignment(
    role_id: int = Query(..., description="Role ID"),
    permission_id: int = Query(..., description="Permission ID"),
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Remove permission from role"""
    controller = PermissionController(db)
    result = controller.remove_permission_from_role(role_id, permission_id)
    return {"success": True, "message": result.get("message"), "data": result}

# ✅✅✅ DYNAMIC ROUTES COME AFTER STATIC ROUTES ✅✅✅
@router.get("/", response_model=PermissionListWrapper)
def list_permissions(db: Session = Depends(get_db)):
    """Get all permissions"""
    controller = PermissionController(db)
    permissions = controller.get_all_permissions()
    return {"success": True, "message": "Permissions retrieved successfully", "data": permissions}

@router.get("/role/{role_id}/permissions", response_model=PermissionListWrapper)
def get_permissions_by_role(role_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Get all permissions for a role"""
    controller = PermissionController(db)
    permissions = controller.get_role_permissions(role_id)
    return {"success": True, "message": "Role permissions retrieved successfully", "data": permissions}

@router.get("/{permission_id}", response_model=PermissionWrapper)
def get_permission(permission_id: int, db: Session = Depends(get_db)):
    """Get permission by ID"""
    controller = PermissionController(db)
    permission = controller.get_permission_by_id(permission_id)
    return {"success": True, "message": "Permission retrieved successfully", "data": permission}

@router.get("/{permission_id}/roles", response_model=RoleListWrapper)
def get_roles_by_permission(permission_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Get all roles that have this permission"""
    controller = PermissionController(db)
    roles = controller.get_permission_roles(permission_id)
    return {"success": True, "message": "Permission roles retrieved successfully", "data": roles}

@router.post("/", response_model=PermissionWrapper, status_code=201)
def add_permission(permission_data: PermissionCreate, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Create new permission"""
    controller = PermissionController(db)
    permission = controller.create_permission(permission_data)
    return {"success": True, "message": "Permission created successfully", "data": permission}

@router.put("/{permission_id}", response_model=PermissionWrapper)
def edit_permission(permission_id: int, update_data: dict, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Update permission"""
    controller = PermissionController(db)
    permission = controller.update_permission(permission_id, update_data)
    return {"success": True, "message": "Permission updated successfully", "data": permission}

@router.delete("/{permission_id}", response_model=MessageWrapper)
def remove_permission(permission_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Delete permission"""
    controller = PermissionController(db)
    result = controller.delete_permission(permission_id)
    return {"success": True, "message": result.get("message"), "data": result}