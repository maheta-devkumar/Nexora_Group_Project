from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Union
from datetime import datetime

# --- Utility Schemas ---
class RoleDetail(BaseModel):
    role_id: int
    role_name: str
    description: Optional[str] = None
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

class PermissionDetail(BaseModel):
    permission_id: int
    permission_name: str
    description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserBasicDetail(BaseModel):
    user_id: int
    username: str
    first_name: str
    last_name: str
    email: str
    
    model_config = ConfigDict(from_attributes=True)

class RoleWithPermissions(BaseModel):
    role_id: int
    role_name: str
    description: Optional[str] = None
    is_active: bool
    permissions: List[PermissionDetail]

# --- Core Role Schemas ---
class RoleBase(BaseModel):
    role_name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class RoleResponse(RoleBase):
    role_id: int
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

# --- Permission Schemas ---
class PermissionBase(BaseModel):
    permission_name: str
    description: Optional[str] = None

class PermissionCreate(PermissionBase):
    pass

class PermissionResponse(PermissionBase):
    permission_id: int
    
    model_config = ConfigDict(from_attributes=True)

# --- Wrapper Schemas ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class RoleWrapper(SuccessWrapper):
    data: RoleResponse

class RoleWithPermissionsWrapper(SuccessWrapper):
    data: RoleWithPermissions

class PermissionWrapper(SuccessWrapper):
    data: PermissionResponse

class MessageWrapper(SuccessWrapper):
    data: dict

# Create specific list wrappers instead of generic ones
class RoleListWrapper(SuccessWrapper):
    data: List[RoleDetail]

class PermissionListWrapper(SuccessWrapper):
    data: List[PermissionDetail]

class UserListWrapper(SuccessWrapper):
    data: List[UserBasicDetail]

# Generic wrapper for simple lists (use sparingly)
class GenericListWrapper(SuccessWrapper):
    data: List[dict]

