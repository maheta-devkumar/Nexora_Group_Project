from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List, Dict, Any
from config.dependencies import get_current_user, is_admin
from controllers.system_controller import SystemController
from schemas.system import (
    # User & Access Monitoring
    ActiveUser, UserAccessSummary,
    
    # Session & Security
    ActiveSession, SessionSummary, DeviceDistribution,
    
    # Admin & Audit Logs
    RecentAdminActions,
    
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
from datetime import datetime

router = APIRouter(prefix="/api/v1/admin/system", tags=["Admin System"])

# ===== USER & ACCESS MONITORING =====

@router.get("/users/active/count", response_model=Dict[str, int])
def get_active_users_count(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get count of active users, total users, verified users, and new users today
    """
    return controller.get_active_users_count(current_user)

@router.get("/users/logged-in", response_model=List[ActiveUser])
def get_logged_in_users(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get currently logged in users with their session details
    """
    return controller.get_logged_in_users(current_user)

@router.get("/users/role-distribution", response_model=UserAccessSummary)
def get_user_role_distribution(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get user role distribution summary with counts and percentages
    """
    return controller.get_user_role_distribution(current_user)

# ===== SESSION & SECURITY =====

@router.get("/sessions/active", response_model=List[ActiveSession])
def get_active_sessions(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get all active user sessions (last 30 minutes)
    """
    return controller.get_active_sessions(current_user)

@router.get("/sessions/summary", response_model=SessionSummary)
def get_session_activity_summary(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get session activity summary including totals, averages, and device distribution
    """
    return controller.get_session_activity_summary(current_user)

@router.get("/sessions/device-distribution", response_model=List[DeviceDistribution])
def get_device_login_distribution(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get login distribution by device type (Android, iOS, Windows, etc.)
    """
    return controller.get_device_login_distribution(current_user)

# ===== ADMIN & AUDIT LOGS =====

@router.get("/admin/logs")
def get_admin_activity_logs(
    admin_id: Optional[int] = Query(None, description="Filter by specific admin ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get admin activity logs with pagination and summary
    """
    return controller.get_admin_activity_logs(admin_id, page, size, current_user)

@router.get("/admin/recent-actions", response_model=RecentAdminActions)
def get_recent_admin_actions(
    hours: int = Query(24, ge=1, le=168, description="Hours to look back"),
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get recent admin actions within specified hours
    """
    return controller.get_recent_admin_actions(hours, current_user)

@router.get("/admin/critical-actions")
def get_critical_admin_actions(
    days: int = Query(7, ge=1, le=30, description="Days to look back"),
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get critical admin actions (HIGH and CRITICAL level)
    """
    return controller.get_critical_admin_actions(days, current_user)

# ===== APPLICATION HEALTH =====

@router.get("/health/status", response_model=SystemHealthStatusResponse)
def get_system_health_status(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get comprehensive system health status including database, API, and component status
    """
    return controller.get_system_health_status(current_user)

@router.get("/health/failed-operations", response_model=FailedOperationsSummary)
def get_failed_operations_summary(
    days: int = Query(7, ge=1, le=30, description="Days to look back"),
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get summary of failed operations (orders, payments, deliveries)
    """
    return controller.get_failed_operations_summary(days, current_user)

@router.get("/health/api-usage", response_model=ApiUsageOverview)
def get_api_usage_overview(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get API usage overview including request counts and response times
    """
    return controller.get_api_usage_overview(current_user)

# ===== NOTIFICATION STATUS =====

@router.get("/notifications/delivery-summary", response_model=NotificationDeliverySummary)
def get_notification_delivery_summary(
    days: int = Query(7, ge=1, le=30, description="Days to look back"),
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get notification delivery summary including read rates and type distribution
    """
    return controller.get_notification_delivery_summary(days, current_user)

@router.get("/notifications/unread-count", response_model=UnreadNotifications)
def get_unread_notifications_count(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get count of unread notifications with user and type breakdown
    """
    return controller.get_unread_notifications_count(current_user)

# ===== PERMISSION MANAGEMENT =====

@router.post("/permissions", response_model=PermissionResponse)
def create_permission(
    permission_data: PermissionCreate,
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Create a new permission
    """
    return controller.create_permission(permission_data, current_user)

@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
def update_permission(
    permission_id: int,
    permission_data: PermissionUpdate,
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Update an existing permission
    """
    return controller.update_permission(permission_id, permission_data, current_user)

@router.delete("/permissions/{permission_id}", response_model=SystemResponse)
def delete_permission(
    permission_id: int,
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Delete a permission (only if not assigned to any role)
    """
    return controller.delete_permission(permission_id, current_user)

@router.get("/permissions", response_model=List[PermissionResponse])
def get_all_permissions(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get all permissions with usage counts
    """
    return controller.get_all_permissions(current_user)

@router.get("/permissions/{permission_id}", response_model=PermissionResponse)
def get_permission_by_id(
    permission_id: int,
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get permission by ID with usage details
    """
    return controller.get_permission_by_id(permission_id, current_user)

# ===== PERMISSION ↔ ROLE MAPPING =====

@router.post("/roles/{role_id}/permissions/{permission_id}", response_model=SystemResponse)
def assign_permission_to_role(
    role_id: int,
    permission_id: int,
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Assign a permission to a role
    """
    return controller.assign_permission_to_role(role_id, permission_id, current_user)

@router.delete("/roles/{role_id}/permissions/{permission_id}", response_model=SystemResponse)
def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Remove a permission from a role
    """
    return controller.remove_permission_from_role(role_id, permission_id, current_user)

@router.get("/roles/{role_id}/permissions", response_model=RoleWithPermissions)
def get_permissions_by_role(
    role_id: int,
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get all permissions assigned to a specific role
    """
    return controller.get_permissions_by_role(role_id, current_user)

@router.get("/permissions/{permission_id}/roles", response_model=PermissionWithRoles)
def get_roles_by_permission(
    permission_id: int,
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get all roles that have a specific permission assigned
    """
    return controller.get_roles_by_permission(permission_id, current_user)

# ===== PERMISSION USAGE & SAFETY =====

@router.get("/permissions/usage/summary", response_model=List[PermissionUsage])
def get_permission_usage_summary(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get usage summary for all permissions including assignment counts
    """
    return controller.get_permission_usage_summary(current_user)

@router.get("/permissions/{permission_id}/dependencies", response_model=PermissionDependency)
def check_permission_dependency(
    permission_id: int,
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Check dependencies for a permission (what it depends on and what depends on it)
    """
    return controller.check_permission_dependency(permission_id, current_user)

# ===== SYSTEM DASHBOARD SUMMARY =====

@router.get("/dashboard")
def get_system_dashboard(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Get comprehensive system dashboard with all key metrics
    """
    try:
        # Get all metrics for dashboard
        user_access = controller.get_user_role_distribution(current_user)
        session_summary = controller.get_session_activity_summary(current_user)
        health_status = controller.get_system_health_status(current_user)
        recent_actions = controller.get_recent_admin_actions(24, current_user)
        notification_summary = controller.get_notification_delivery_summary(7, current_user)
        permission_summary = controller.get_permission_usage_summary(current_user)
        
        return {
            "user_access": user_access,
            "sessions": session_summary,
            "health": health_status,
            "recent_actions": recent_actions,
            "notifications": notification_summary,
            "permissions": permission_summary,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system dashboard: {str(e)}"
        )

# ===== SYSTEM HEALTH CHECK =====

@router.get("/health-check")
def system_health_check(
    current_user: User = Depends(is_admin),
    controller: SystemController = Depends()
):
    """
    Quick system health check for monitoring
    """
    try:
        # Test database connection
        user_count = controller.get_active_users_count(current_user)
        
        # Test session data
        session_summary = controller.get_session_activity_summary(current_user)
        
        # Test permission data
        permissions = controller.get_all_permissions(current_user)
        
        return {
            "status": "healthy",
            "database": "connected",
            "users": user_count["total_users"],
            "active_sessions": session_summary.active_sessions,
            "permissions_count": len(permissions),
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"System health check failed: {str(e)}"
        )