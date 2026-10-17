from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from config.database import get_db
from config.dependencies import get_current_user
from controllers.profile_controller import ProfileController
from schemas.profile_schema import (
    ProfileUpdate, 
    PasswordChange, 
    ProfileWrapper,
    StatsWrapper, 
    MessageWrapper
)
from models.user import User

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])


@router.get("/me", response_model=ProfileWrapper)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    controller = ProfileController(db)
    profile = controller.get_user_profile(current_user.user_id)
    
    return ProfileWrapper(
        success=True,
        message="Profile retrieved successfully",
        data=profile
    )


@router.put("/me", response_model=ProfileWrapper)
def update_current_user_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    controller = ProfileController(db)
    profile = controller.update_user_profile(current_user.user_id, profile_data)
    
    return ProfileWrapper(
        success=True,
        message="Profile updated successfully",
        data=profile
    )


@router.post("/change-password", response_model=MessageWrapper)
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user's password"""
    controller = ProfileController(db)
    result = controller.change_password(current_user.user_id, password_data)
    
    return MessageWrapper(
        success=True,
        message=result.get("message"),
        data=result
    )


@router.get("/stats", response_model=StatsWrapper)
def get_user_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's statistics"""
    controller = ProfileController(db)
    stats = controller.get_user_stats(current_user.user_id)
    
    return StatsWrapper(
        success=True,
        message="Statistics retrieved successfully",
        data=stats
    )


@router.post("/upload-image", response_model=ProfileWrapper)
def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload profile image"""
    controller = ProfileController(db)
    profile = controller.upload_profile_image(current_user.user_id, file)
    
    return ProfileWrapper(
        success=True,
        message="Profile image uploaded successfully",
        data=profile
    )