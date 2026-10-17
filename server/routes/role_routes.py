from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.role_controller import RoleController
from schemas.role_schema import (
    RoleCreate, RoleWrapper, MessageWrapper, RoleListWrapper, 
    RoleWithPermissionsWrapper, UserListWrapper
)

router = APIRouter(prefix="/api/v1/roles", tags=["Roles"])

# ✅✅✅ STATIC ROUTES FIRST ✅✅✅
@router.post("/assign", response_model=MessageWrapper)
def assign_role(
    user_id: int = Query(..., description="User ID"),
    role_id: int = Query(..., description="Role ID"),
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Assign role to user"""
    controller = RoleController(db)
    result = controller.assign_role_to_user(user_id, role_id)
    return {"success": True, "message": result.get("message"), "data": result}

@router.delete("/remove", response_model=MessageWrapper)
def remove_role_assignment(
    user_id: int = Query(..., description="User ID"),
    role_id: int = Query(..., description="Role ID"),
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Remove role from user"""
    controller = RoleController(db)
    result = controller.remove_role_from_user(user_id, role_id)
    return {"success": True, "message": result.get("message"), "data": result}

# ✅✅✅ DYNAMIC ROUTES AFTER STATIC ROUTES ✅✅✅
@router.get("/", response_model=RoleListWrapper)
def list_roles(db: Session = Depends(get_db)):
    """Get all roles"""
    controller = RoleController(db)
    roles = controller.get_all_roles()
    return {"success": True, "message": "Roles retrieved successfully", "data": roles}

@router.get("/user/{user_id}/roles", response_model=RoleListWrapper)
def get_roles_by_user(user_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Get all roles for a user"""
    controller = RoleController(db)
    roles = controller.get_user_roles(user_id)
    return {"success": True, "message": "User roles retrieved successfully", "data": roles}

@router.get("/{role_id}", response_model=RoleWrapper)
def get_role(role_id: int, db: Session = Depends(get_db)):
    """Get role by ID"""
    controller = RoleController(db)
    role = controller.get_role_by_id(role_id)
    return {"success": True, "message": "Role retrieved successfully", "data": role}

@router.get("/{role_id}/details", response_model=RoleWithPermissionsWrapper)
def get_role_details(role_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Get role with all permissions"""
    controller = RoleController(db)
    role = controller.get_role_with_permissions(role_id)
    return {"success": True, "message": "Role details retrieved successfully", "data": role}

@router.get("/{role_id}/users", response_model=UserListWrapper)
def get_users_by_role(role_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Get all users with this role"""
    controller = RoleController(db)
    users = controller.get_role_users(role_id)
    return {"success": True, "message": "Role users retrieved successfully", "data": users}

@router.post("/", response_model=RoleWrapper, status_code=201)
def add_role(role_data: RoleCreate, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Create new role"""
    controller = RoleController(db)
    role = controller.create_role(role_data)
    return {"success": True, "message": "Role created successfully", "data": role}

@router.put("/{role_id}", response_model=RoleWrapper)
def edit_role(role_id: int, update_data: dict, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Update role"""
    controller = RoleController(db)
    role = controller.update_role(role_id, update_data)
    return {"success": True, "message": "Role updated successfully", "data": role}

@router.delete("/{role_id}", response_model=MessageWrapper)
def remove_role(role_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Delete role"""
    controller = RoleController(db)
    result = controller.delete_role(role_id)
    return {"success": True, "message": result.get("message"), "data": result}