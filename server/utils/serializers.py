# server/utils/serializers.py
def serialize_user(user):
    """Convert User object to dictionary"""
    return {
        "user_id": user.user_id,
        "firstname": user.firstname,
        "lastname": user.lastname,
        "email": user.email,
        "phone": user.phon,
        "gender": user.gender,
        "dob": str(user.dob) if user.dob else None,
        "profile_img_url": user.profile_img_url,
        "created_at": str(user.created_at) if user.created_at else None
    }

def serialize_role(role):
    """Convert Role object to dictionary"""
    return {
        "role_id": role.role_id,
        "role_name": role.role_name,
        "description": role.description,
        "is_active": role.is_active
    }