# delivery_panel/profile/delivery_profile_routes.py
from fastapi import APIRouter, Depends, UploadFile, File, Form
from config.dependencies import get_current_user, is_delivery_person
from controllers.delivery_panel.delivery_profile_controller import DeliveryProfileController
from schemas.delivery_panel.delivery_profile_schema import (
    ProfileOverview, PersonalInfo, PersonalInfoUpdate,
    AccountSettingsResponse, VerificationStatus, ProfileStats,
    ProfileResponse, ProfileUpdateResponse, AddressUpdateRequest,
    ChangePasswordRequest, ProfileHealthResponse, FileUploadResponse
)
from models.user import User

router = APIRouter(prefix="/api/v1/delivery_panel/profile", tags=["Delivery Profile"])


# ===== COMPREHENSIVE PROFILE =====

@router.get("/", response_model=ProfileResponse)
def get_comprehensive_profile(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Get comprehensive profile information (all in one)
    
    Returns:
    - Profile overview
    - Personal information
    - Account settings
    - Verification status
    - Statistics
    """
    return controller.get_comprehensive_profile(current_user)


# ===== PROFILE OVERVIEW =====

@router.get("/overview", response_model=ProfileOverview)
def get_profile_overview(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Get profile overview
    
    Includes:
    - Basic user information
    - Delivery person details
    - Contact information
    - Account status
    """
    return controller.get_profile_overview(current_user)


# ===== PERSONAL INFORMATION =====

@router.get("/personal-info", response_model=PersonalInfo)
def get_personal_info(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Get personal information
    
    Includes:
    - Name, email, phone
    - Gender, date of birth
    - Address details
    - License and vehicle information
    """
    return controller.get_personal_info(current_user)


@router.put("/personal-info", response_model=ProfileUpdateResponse)
def update_personal_info(
    update_data: PersonalInfoUpdate,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Update personal information
    
    Allowed fields:
    - first_name, last_name
    - phone
    - gender
    - date_of_birth
    - profile_image_url
    """
    return controller.update_personal_info(current_user, update_data)


# ===== ADDRESS MANAGEMENT =====
@router.put("/address", response_model=ProfileUpdateResponse)
def update_address(
    address_data: AddressUpdateRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Update delivery person's address
    
    Updates only the address table:
    - address_type: Home/Work/Other
    - line1: Address line 1 (required)
    - line2: Address line 2 (optional)
    - area_id: Area ID from dropdown (required)
    - is_default: Set as default address
    
    Note: area_id must be a valid ID from the area table
    """
    return controller.update_address(current_user, address_data)

# ===== ACCOUNT SETTINGS =====

@router.get("/settings", response_model=AccountSettingsResponse)
def get_account_settings(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Get account settings
    
    Returns:
    - Notification preferences
    - Privacy settings
    - App preferences
    """
    return controller.get_account_settings(current_user)


# ===== VERIFICATION STATUS =====

@router.get("/verification", response_model=VerificationStatus)
def get_verification_status(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Get verification documents status
    
    Returns:
    - Overall verification status
    - List of documents (Aadhaar, License, PAN, etc.)
    - Document status and expiry dates
    """
    return controller.get_verification_status(current_user)


# ===== STATISTICS =====

@router.get("/statistics", response_model=ProfileStats)
def get_profile_statistics(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Get profile statistics
    
    Returns:
    - Delivery counts (total, completed)
    - Earnings information
    - Ratings and performance metrics
    - Joined since days
    """
    return controller.get_profile_statistics(current_user)


# ===== PASSWORD MANAGEMENT =====

@router.put("/change-password", response_model=ProfileUpdateResponse)
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Change account password
    
    Requirements:
    - Current password verification
    - New password strength validation
    - Password confirmation
    """
    return controller.change_password(current_user, password_data)


# ===== PROFILE IMAGE UPLOAD =====

@router.post("/upload-image", response_model=FileUploadResponse)
def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Upload profile image
    
    Requirements:
    - File type: JPEG, PNG, GIF
    - Max size: 5MB
    - Will update profile_image_url in database
    """
    return controller.upload_profile_image(current_user, file)


# ===== HEALTH CHECK =====

@router.get("/health", response_model=ProfileHealthResponse)
def health_check(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Health check for profile module
    
    Verifies:
    - Database connections
    - Service layer functionality
    - User authentication
    """
    return controller.health_check(current_user)


# ===== QUICK ACTIONS =====

@router.get("/quick-stats")
def get_quick_stats(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Get quick statistics for dashboard display
    
    Returns condensed profile stats suitable for cards
    """
    try:
        stats = controller.get_profile_statistics(current_user)
        
        return {
            "success": True,
            "data": {
                "total_deliveries": stats.total_deliveries,
                "total_earnings": float(stats.total_earnings),
                "average_rating": stats.average_rating,
                "on_time_rate": stats.on_time_rate,
                "joined_days": stats.joined_since_days
            }
        }
    except:
        return {
            "success": True,
            "data": {
                "total_deliveries": 0,
                "total_earnings": 0.0,
                "average_rating": None,
                "on_time_rate": None,
                "joined_days": 0
            }
        }


# ===== PROFILE SUMMARY =====

@router.get("/summary")
def get_profile_summary(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryProfileController = Depends()
):
    """
    Get profile summary for header/footer display
    
    Returns minimal profile data for UI headers
    """
    try:
        personal_info = controller.get_personal_info(current_user)
        
        return {
            "success": True,
            "data": {
                "full_name": f"{personal_info.first_name} {personal_info.last_name}",
                "profile_image": personal_info.profile_image_url,
                "role": "Delivery Partner",
                "phone": personal_info.phone,
                "email": personal_info.email
            }
        }
    except:
        return {
            "success": True,
            "data": {
                "full_name": "Delivery Partner",
                "profile_image": None,
                "role": "Delivery Partner",
                "phone": None,
                "email": None
            }
        }