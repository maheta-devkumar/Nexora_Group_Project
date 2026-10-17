from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from config.dependencies import get_db, get_current_user, is_admin
from services.system_service import SystemService
from schemas.system import (
    # User & Access Monitoring
    ActiveUser, UserRoleDistribution, UserAccessSummary,
    
    # Session & Security
    ActiveSession, SessionSummary, DeviceDistribution,
    
    # Admin & Audit Logs
    AdminAction, AdminActivitySummary, RecentAdminActions,
    
    # Application Health
    SystemHealthStatusResponse, FailedOperationsSummary, ApiUsageOverview,
    
    # Notification Status
    NotificationDeliverySummary, UnreadNotifications,
    
    # Permission Management
    PermissionCreate, PermissionUpdate, PermissionResponse,
    PermissionUsage, PermissionDependency,
    
    # Role Permission Mapping
    RoleWithPermissions, PermissionWithRoles,
    
    # System Response
    SystemResponse
)
from models.user import User

class SystemController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = SystemService(db)
    
    # ===== USER & ACCESS MONITORING =====
    
    def get_active_users_count(self, current_user: User) -> Dict[str, int]:
        """Get count of active users"""
        try:
            return self.service.get_active_users_count()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get active users count: {str(e)}"
            )
    
    def get_logged_in_users(self, current_user: User) -> List[ActiveUser]:
        """Get currently logged in users"""
        try:
            return self.service.get_logged_in_users()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get logged in users: {str(e)}"
            )
    
    def get_user_role_distribution(self, current_user: User) -> UserAccessSummary:
        """Get user role distribution summary"""
        try:
            return self.service.get_user_role_distribution()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user role distribution: {str(e)}"
            )
    
    # ===== SESSION & SECURITY =====
    
    def get_active_sessions(self, current_user: User) -> List[ActiveSession]:
        """Get all active sessions"""
        try:
            return self.service.get_active_sessions()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get active sessions: {str(e)}"
            )
    
    def get_session_activity_summary(self, current_user: User) -> SessionSummary:
        """Get session activity summary"""
        try:
            return self.service.get_session_activity_summary()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get session activity summary: {str(e)}"
            )
    
    def get_device_login_distribution(self, current_user: User) -> List[DeviceDistribution]:
        """Get login distribution by device type"""
        try:
            return self.service.get_device_login_distribution()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get device login distribution: {str(e)}"
            )
    
    # ===== ADMIN & AUDIT LOGS =====
    
    def get_admin_activity_logs(
        self, 
        admin_id: Optional[int] = None,
        page: int = 1,
        size: int = 50,
        current_user: User = None
    ) -> Dict[str, Any]:
        """Get admin activity logs with pagination"""
        try:
            return self.service.get_admin_activity_logs(admin_id, page, size)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get admin activity logs: {str(e)}"
            )
    
    def get_recent_admin_actions(
        self,
        hours: int = 24,
        current_user: User = None
    ) -> RecentAdminActions:
        """Get recent admin actions"""
        try:
            return self.service.get_recent_admin_actions(hours)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get recent admin actions: {str(e)}"
            )
    
    def get_critical_admin_actions(
        self,
        days: int = 7,
        current_user: User = None
    ) -> List[Dict[str, Any]]:
        """Get critical admin actions"""
        try:
            return self.service.get_critical_admin_actions(days)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get critical admin actions: {str(e)}"
            )
    
    # ===== APPLICATION HEALTH =====
    
    def get_system_health_status(self, current_user: User) -> SystemHealthStatusResponse:
        """Get comprehensive system health status"""
        try:
            return self.service.get_system_health_status()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get system health status: {str(e)}"
            )
    
    def get_failed_operations_summary(
        self,
        days: int = 7,
        current_user: User = None
    ) -> FailedOperationsSummary:
        """Get summary of failed operations"""
        try:
            return self.service.get_failed_operations_summary(days)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get failed operations summary: {str(e)}"
            )
    
    def get_api_usage_overview(self, current_user: User) -> ApiUsageOverview:
        """Get API usage overview"""
        try:
            return self.service.get_api_usage_overview()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get API usage overview: {str(e)}"
            )
    
    # ===== NOTIFICATION STATUS =====
    
    def get_notification_delivery_summary(
        self,
        days: int = 7,
        current_user: User = None
    ) -> NotificationDeliverySummary:
        """Get notification delivery summary"""
        try:
            return self.service.get_notification_delivery_summary(days)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get notification delivery summary: {str(e)}"
            )
    
    def get_unread_notifications_count(self, current_user: User) -> UnreadNotifications:
        """Get count of unread notifications"""
        try:
            return self.service.get_unread_notifications_count()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get unread notifications count: {str(e)}"
            )
    
    # ===== PERMISSION MANAGEMENT =====
    
    def create_permission(
        self,
        permission_data: PermissionCreate,
        current_user: User
    ) -> PermissionResponse:
        """Create a new permission"""
        try:
            return self.service.create_permission(permission_data)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create permission: {str(e)}"
            )
    
    def update_permission(
        self,
        permission_id: int,
        permission_data: PermissionUpdate,
        current_user: User
    ) -> PermissionResponse:
        """Update an existing permission"""
        try:
            result = self.service.update_permission(permission_id, permission_data)
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Permission {permission_id} not found"
                )
            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update permission: {str(e)}"
            )
    
    def delete_permission(
        self,
        permission_id: int,
        current_user: User
    ) -> SystemResponse:
        """Delete a permission"""
        try:
            return self.service.delete_permission(permission_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete permission: {str(e)}"
            )
    
    def get_all_permissions(self, current_user: User) -> List[PermissionResponse]:
        """Get all permissions"""
        try:
            return self.service.get_all_permissions()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get permissions: {str(e)}"
            )
    
    def get_permission_by_id(
        self,
        permission_id: int,
        current_user: User
    ) -> PermissionResponse:
        """Get permission by ID"""
        try:
            result = self.service.get_permission_by_id(permission_id)
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Permission {permission_id} not found"
                )
            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get permission: {str(e)}"
            )
    
    # ===== PERMISSION ↔ ROLE MAPPING =====
    
    def assign_permission_to_role(
        self,
        role_id: int,
        permission_id: int,
        current_user: User
    ) -> SystemResponse:
        """Assign a permission to a role"""
        try:
            return self.service.assign_permission_to_role(role_id, permission_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to assign permission to role: {str(e)}"
            )
    
    def remove_permission_from_role(
        self,
        role_id: int,
        permission_id: int,
        current_user: User
    ) -> SystemResponse:
        """Remove a permission from a role"""
        try:
            return self.service.remove_permission_from_role(role_id, permission_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to remove permission from role: {str(e)}"
            )
    
    def get_permissions_by_role(
        self,
        role_id: int,
        current_user: User
    ) -> RoleWithPermissions:
        """Get all permissions assigned to a role"""
        try:
            return self.service.get_permissions_by_role(role_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get permissions by role: {str(e)}"
            )
    
    def get_roles_by_permission(
        self,
        permission_id: int,
        current_user: User
    ) -> PermissionWithRoles:
        """Get all roles that have a specific permission"""
        try:
            return self.service.get_roles_by_permission(permission_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get roles by permission: {str(e)}"
            )
    
    # ===== PERMISSION USAGE & SAFETY =====
    
    def get_permission_usage_summary(self, current_user: User) -> List[PermissionUsage]:
        """Get usage summary for all permissions"""
        try:
            return self.service.get_permission_usage_summary()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get permission usage summary: {str(e)}"
            )
    
    def check_permission_dependency(
        self,
        permission_id: int,
        current_user: User
    ) -> PermissionDependency:
        """Check dependencies for a permission"""
        try:
            return self.service.check_permission_dependency(permission_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to check permission dependency: {str(e)}"
            )