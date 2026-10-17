from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.user_controller import UserController
from schemas.user_schema import UserWrapper, MessageWrapper, UserListWrapper

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

@router.get("/", response_model=UserListWrapper)
def list_users(
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Get all users (Admin only)"""
    controller = UserController(db)
    users = controller.get_all_users()
    return {
        "success": True, 
        "message": "Users retrieved successfully", 
        "data": users
    }

@router.get("/{user_id}", response_model=UserWrapper)
def get_user(user_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Get user by ID (Admin only)"""
    controller = UserController(db)
    user = controller.get_user_by_id(user_id)
    return {"success": True, "message": "User retrieved successfully", "data": user}

@router.put("/{user_id}", response_model=UserWrapper)
def update_user_data(user_id: int, update_data: dict, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Update user (Admin only)"""
    controller = UserController(db)
    user = controller.update_user(user_id, update_data)
    return {"success": True, "message": "User updated successfully", "data": user}

@router.delete("/{user_id}", response_model=MessageWrapper)
def remove_user(user_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Delete user (Admin only)"""
    controller = UserController(db)
    result = controller.delete_user(user_id)
    return {"success": True, "message": result.get("message"), "data": result}