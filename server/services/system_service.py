from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from repositories.system_repository import SystemRepository
from repositories.notification_repository import NotificationRepository  # ADD THIS
from repositories.user_repository import UserRepository  # ADD THIS
from schemas.system import (
    # User & Access Monitoring
    ActiveUser, UserRoleDistribution, UserAccessSummary,
    
    # Session & Security
    ActiveSession, SessionSummary, DeviceDistribution,
    
    # Admin & Audit Logs
    AdminAction, AdminActivitySummary, RecentAdminActions,
    
    # Application Health
    SystemHealthStatus, SystemComponent, SystemHealthStatusResponse,
    FailedOperation, FailedOperationsSummary, ApiEndpointUsage, ApiUsageOverview,
    
    # Notification Status
    NotificationStatus, NotificationDeliverySummary, UnreadNotifications,
    
    # Permission Management
    PermissionCreate, PermissionUpdate, PermissionResponse,
    RolePermissionAssignment, PermissionUsage, PermissionDependency,
    
    # Role Permission Mapping
    RolePermissionResponse, RoleWithPermissions, PermissionWithRoles,
    
    # System Response
    SystemResponse
)
from datetime import datetime, timedelta
from models.user import User
from models.role import Role, UserRole

class SystemService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = SystemRepository()
        self.notification_repo = NotificationRepository()  # ADD THIS
        self.user_repo = UserRepository()  # ADD THIS
    
    # ===== USER & ACCESS MONITORING =====
    
    def get_active_users_count(self) -> Dict[str, int]:
        """Get count of active users"""
        total_users, active_users = self.repository.get_active_users_count(self.db)
        
        # New users today
        today = datetime.now().date()
        start_of_day = datetime.combine(today, datetime.min.time())
        new_users_today = self.db.query(User).filter(
            User.created_at >= start_of_day
        ).count()
        
        # Verified users
        verified_users = self.db.query(User).filter(
            User.is_verified == True
        ).count()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "verified_users": verified_users,
            "new_users_today": new_users_today
        }
    
    def get_logged_in_users(self) -> List[ActiveUser]:
        """Get currently logged in users"""
        users_data = self.repository.get_logged_in_users(self.db)
        
        # Get roles for each user
        result = []
        for user_data in users_data:
            # Get user's role
            user_role = self.db.query(Role).join(UserRole).filter(
                UserRole.user_id == user_data["user_id"]
            ).first()
            
            result.append(ActiveUser(
                user_id=user_data["user_id"],
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                last_login=user_data["last_login"],
                role=user_role.role_name if user_role else "Unknown",
                status="ACTIVE"
            ))
        
        return result
    
    def get_user_role_distribution(self) -> UserAccessSummary:
        """Get user role distribution summary"""
        # Get counts
        counts = self.get_active_users_count()
        
        # Get distribution
        distribution_data = self.repository.get_user_role_distribution(self.db)
        
        distribution = [
            UserRoleDistribution(
                role_name=dist["role_name"],
                user_count=dist["user_count"],
                percentage=dist["percentage"]
            )
            for dist in distribution_data
        ]
        
        return UserAccessSummary(
            total_users=counts["total_users"],
            active_users=counts["active_users"],
            verified_users=counts["verified_users"],
            new_users_today=counts["new_users_today"],
            role_distribution=distribution
        )
    
    # ===== SESSION & SECURITY =====
    
    def get_active_sessions(self) -> List[ActiveSession]:
        """Get all active sessions"""
        sessions_data = self.repository.get_active_sessions(self.db)
        
        return [
            ActiveSession(
                session_id=session["session_id"],
                user_id=session["user_id"],
                username=session["username"],
                device_info=session["device_info"],
                ip_address=session["ip_address"],
                last_activity=session["last_activity"],
                duration_minutes=session["duration_minutes"]
            )
            for session in sessions_data
        ]
    
    def get_session_activity_summary(self) -> SessionSummary:
        """Get session activity summary"""
        summary_data = self.repository.get_session_activity_summary(self.db)
        
        # Calculate peak concurrent (simplified)
        peak_concurrent = summary_data["active_sessions"]  # Would need historical data
        
        # Convert device distribution to DeviceDistribution objects
        device_distribution = summary_data["device_distribution"]
        
        return SessionSummary(
            total_sessions=summary_data["total_sessions"],
            active_sessions=summary_data["active_sessions"],
            avg_session_duration=summary_data["avg_session_duration"],
            peak_concurrent=peak_concurrent,
            device_distribution=device_distribution
        )
    
    def get_device_login_distribution(self) -> List[DeviceDistribution]:
        """Get login distribution by device type"""
        distribution_data = self.repository.get_device_login_distribution(self.db)
        
        return [
            DeviceDistribution(
                device_type=dist["device_type"],
                session_count=dist["login_count"],
                percentage=dist["percentage"]
            )
            for dist in distribution_data
        ]
    
    # ===== ADMIN & AUDIT LOGS =====
    
    def get_admin_activity_logs(self, admin_id: Optional[int] = None, 
                               page: int = 1, size: int = 50) -> Dict[str, Any]:
        """Get admin activity logs with pagination"""
        offset = (page - 1) * size
        
        logs_data, total = self.repository.get_admin_activity_logs(
            self.db, admin_id, size, offset
        )
        
        logs = [
            AdminAction(**log_data)
            for log_data in logs_data
        ]
        
        # Calculate summary
        actions_today = self.repository.get_recent_admin_actions(self.db, 24)
        
        # Get top admins
        from collections import Counter
        admin_counts = Counter(log["admin_id"] for log in logs_data[:100])
        top_admins = []
        for admin_id, count in admin_counts.most_common(5):
            admin = self.db.query(User).filter(User.user_id == admin_id).first()
            if admin:
                top_admins.append({
                    "admin_id": admin_id,
                    "name": f"{admin.first_name} {admin.last_name}",
                    "action_count": count
                })
        
        summary = AdminActivitySummary(
            total_actions=total,
            actions_today=len(actions_today),
            top_admins=top_admins,
            critical_actions=len([log for log in logs if log.critical_level in ["HIGH", "CRITICAL"]])
        )
        
        return {
            "logs": logs,
            "summary": summary,
            "pagination": {
                "total": total,
                "page": page,
                "size": size,
                "pages": (total + size - 1) // size
            }
        }
    
    def get_recent_admin_actions(self, hours: int = 24) -> RecentAdminActions:
        """Get recent admin actions"""
        actions_data = self.repository.get_recent_admin_actions(self.db, hours)
        
        actions = [
            AdminAction(**action_data)
            for action_data in actions_data
        ]
        
        return RecentAdminActions(
            logs=actions,
            count=len(actions),
            time_range=f"Last {hours} hours"
        )
    
    def get_critical_admin_actions(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get critical admin actions"""
        return self.repository.get_critical_admin_actions(self.db, days)
    
    # ===== APPLICATION HEALTH =====
    
    def get_system_health_status(self) -> SystemHealthStatusResponse:
        """Get comprehensive system health status"""
        health_data = self.repository.get_system_health_status(self.db)
        
        # Create system components
        db_component = SystemComponent(
            name="Database",
            status=SystemHealthStatus(health_data["database"]["status"]),
            response_time=None,
            last_check=health_data["database"]["last_check"],
            message=f"Connection successful" if health_data["database"]["status"] == "HEALTHY" else "Connection failed"
        )
        
        api_component = SystemComponent(
            name="API Gateway",
            status=SystemHealthStatus.HEALTHY,  # Would need actual API health check
            response_time=0.15,
            last_check=datetime.now(),
            message="All endpoints responding"
        )
        
        # Calculate uptime (simplified)
        # In real system, this would come from monitoring system
        uptime_days = 99.5  # Placeholder
        
        return SystemHealthStatusResponse(
            overall_status=SystemHealthStatus(health_data["overall_status"]),
            database=db_component,
            api=api_component,
            cache=None,
            storage=None,
            uptime_days=uptime_days,
            last_incident=None  # Would come from incident log
        )
    
    def get_failed_operations_summary(self, days: int = 7) -> FailedOperationsSummary:
        """Get summary of failed operations"""
        summary_data = self.repository.get_failed_operations_summary(self.db, days)
        
        operations = [
            FailedOperation(
                operation_type=op["operation_type"],
                failure_count=op["failure_count"],
                success_rate=op["success_rate"],
                last_failure=None,  # Would need specific failure timestamps
                common_error=None   # Would need error tracking
            )
            for op in summary_data["operations"]
        ]
        
        return FailedOperationsSummary(
            operations=operations,
            total_failures=summary_data["total_failures"],
            overall_success_rate=summary_data["overall_success_rate"],
            time_period=summary_data["time_period"]
        )
    
    def get_api_usage_overview(self) -> ApiUsageOverview:
        """Get API usage overview"""
        usage_data = self.repository.get_api_usage_overview(self.db)
        
        endpoints = [
            ApiEndpointUsage(
                endpoint=endpoint.get("endpoint", "/unknown"),
                method=endpoint.get("method", "GET"),
                request_count=endpoint.get("request_count", 0),
                avg_response_time=endpoint.get("avg_response_time", 0),
                error_rate=endpoint.get("error_rate", 0)
            )
            for endpoint in usage_data.get("endpoints", [])
        ]
        
        return ApiUsageOverview(
            total_requests=usage_data.get("total_requests", 0),
            endpoints=endpoints,
            peak_hour=usage_data.get("peak_hour", "00:00"),
            avg_response_time=usage_data.get("avg_response_time", 0)
        )
    
    # ===== NOTIFICATION STATUS =====
    
    def get_notification_delivery_summary(self, days: int = 7) -> NotificationDeliverySummary:
        """Get notification delivery summary"""
        summary_data = self.repository.get_notification_delivery_summary(self.db, days)
        
        return NotificationDeliverySummary(
            total_sent=summary_data["total_sent"],
            total_read=summary_data["total_read"],
            read_rate=summary_data["read_rate"],
            pending_delivery=summary_data["pending_delivery"],
            failed_delivery=summary_data["failed_delivery"],
            by_type=summary_data["by_type"]
        )
    
    def get_unread_notifications_count(self) -> UnreadNotifications:
        """Get count of unread notifications"""
        unread_data = self.repository.get_unread_notifications_count(self.db)
        
        return UnreadNotifications(
            total_unread=unread_data["total_unread"],
            by_user=unread_data["by_user"],
            by_type=unread_data["by_type"],
            oldest_unread=unread_data["oldest_unread"]
        )
    
    # ===== PERMISSION MANAGEMENT =====
    
    def create_permission(self, permission_data: PermissionCreate) -> PermissionResponse:
        """Create a new permission"""
        # Check if permission already exists
        existing = self.repository.get_permission_by_name(self.db, permission_data.permission_name)
        if existing:
            raise ValueError(f"Permission '{permission_data.permission_name}' already exists")
        
        permission = self.repository.create_permission(
            self.db, 
            permission_data.permission_name, 
            permission_data.description
        )
        
        # ============================================
        # SEND NOTIFICATION FOR PERMISSION CREATION
        # ============================================
        try:
            self._send_permission_creation_notification(permission)
        except Exception as notif_error:
            print(f"⚠️ Permission creation notification failed: {notif_error}")
        
        return PermissionResponse(
            permission_id=permission.permission_id,
            permission_name=permission.permission_name,
            description=permission.description,
            created_at=datetime.now(),
            usage_count=0,
            is_system=permission.permission_name.startswith("system.")
        )
    
    def update_permission(self, permission_id: int, permission_data: PermissionUpdate) -> Optional[PermissionResponse]:
        """Update an existing permission"""
        # Get permission before update for notification
        old_permission = self.repository.get_permission_by_id(self.db, permission_id)
        
        permission = self.repository.update_permission(
            self.db, 
            permission_id, 
            permission_data.permission_name, 
            permission_data.description
        )
        
        if not permission:
            return None
        
        # ============================================
        # SEND NOTIFICATION FOR PERMISSION UPDATE
        # ============================================
        try:
            self._send_permission_update_notification(old_permission, permission)
        except Exception as notif_error:
            print(f"⚠️ Permission update notification failed: {notif_error}")
        
        # Get usage count
        usage_count = self.repository.get_roles_by_permission(self.db, permission_id)
        
        return PermissionResponse(
            permission_id=permission.permission_id,
            permission_name=permission.permission_name,
            description=permission.description,
            created_at=getattr(permission, 'created_at', datetime.now()),
            usage_count=len(usage_count),
            is_system=permission.permission_name.startswith("system.")
        )
    
    def delete_permission(self, permission_id: int) -> SystemResponse:
        """Delete a permission"""
        # Get permission before deletion for notification
        permission = self.repository.get_permission_by_id(self.db, permission_id)
        
        success = self.repository.delete_permission(self.db, permission_id)
        
        if success:
            # ============================================
            # SEND NOTIFICATION FOR PERMISSION DELETION
            # ============================================
            try:
                if permission:
                    self._send_permission_deletion_notification(permission)
            except Exception as notif_error:
                print(f"⚠️ Permission deletion notification failed: {notif_error}")
            
            return SystemResponse(
                success=True,
                message=f"Permission {permission_id} deleted successfully"
            )
        else:
            return SystemResponse(
                success=False,
                message=f"Cannot delete permission {permission_id}. It may be assigned to roles."
            )
    
    def get_all_permissions(self) -> List[PermissionResponse]:
        """Get all permissions"""
        permissions = self.repository.get_all_permissions(self.db)
        
        result = []
        for permission in permissions:
            # Get usage count
            usage = self.repository.get_roles_by_permission(self.db, permission.permission_id)
            
            result.append(PermissionResponse(
                permission_id=permission.permission_id,
                permission_name=permission.permission_name,
                description=permission.description,
                created_at=getattr(permission, 'created_at', datetime.now()),
                usage_count=len(usage),
                is_system=permission.permission_name.startswith("system.")
            ))
        
        return result
    
    def get_permission_by_id(self, permission_id: int) -> Optional[PermissionResponse]:
        """Get permission by ID"""
        permission = self.repository.get_permission_by_id(self.db, permission_id)
        
        if not permission:
            return None
        
        # Get usage count
        usage = self.repository.get_roles_by_permission(self.db, permission_id)
        
        return PermissionResponse(
            permission_id=permission.permission_id,
            permission_name=permission.permission_name,
            description=permission.description,
            created_at=getattr(permission, 'created_at', datetime.now()),
            usage_count=len(usage),
            is_system=permission.permission_name.startswith("system.")
        )
    
    # ===== PERMISSION ↔ ROLE MAPPING =====
    
    def assign_permission_to_role(self, role_id: int, permission_id: int) -> SystemResponse:
        """Assign a permission to a role"""
        # Get role and permission details before assignment
        role = self.db.query(Role).filter(Role.role_id == role_id).first()
        permission = self.repository.get_permission_by_id(self.db, permission_id)
        
        success = self.repository.assign_permission_to_role(self.db, role_id, permission_id)
        
        if success:
            # ============================================
            # SEND NOTIFICATION FOR PERMISSION ASSIGNMENT
            # ============================================
            try:
                if role and permission:
                    self._send_permission_assignment_notification(role, permission)
            except Exception as notif_error:
                print(f"⚠️ Permission assignment notification failed: {notif_error}")
            
            return SystemResponse(
                success=True,
                message=f"Permission {permission_id} assigned to role {role_id} successfully"
            )
        else:
            return SystemResponse(
                success=False,
                message=f"Failed to assign permission. It may already be assigned or invalid IDs."
            )
    
    def remove_permission_from_role(self, role_id: int, permission_id: int) -> SystemResponse:
        """Remove a permission from a role"""
        # Get role and permission details before removal
        role = self.db.query(Role).filter(Role.role_id == role_id).first()
        permission = self.repository.get_permission_by_id(self.db, permission_id)
        
        success = self.repository.remove_permission_from_role(self.db, role_id, permission_id)
        
        if success:
            # ============================================
            # SEND NOTIFICATION FOR PERMISSION REMOVAL
            # ============================================
            try:
                if role and permission:
                    self._send_permission_removal_notification(role, permission)
            except Exception as notif_error:
                print(f"⚠️ Permission removal notification failed: {notif_error}")
            
            return SystemResponse(
                success=True,
                message=f"Permission {permission_id} removed from role {role_id} successfully"
            )
        else:
            return SystemResponse(
                success=False,
                message=f"Permission {permission_id} is not assigned to role {role_id}"
            )
    
    def get_permissions_by_role(self, role_id: int) -> RoleWithPermissions:
        """Get all permissions assigned to a role"""
        permissions_data = self.repository.get_permissions_by_role(self.db, role_id)
        
        # Get role info
        role = self.db.query(Role).filter(Role.role_id == role_id).first()
        if not role:
            raise ValueError(f"Role {role_id} not found")
        
        # Count users with this role
        user_count = self.db.query(UserRole).filter(
            UserRole.role_id == role_id
        ).count()
        
        permissions = [
            PermissionResponse(
                permission_id=p["permission_id"],
                permission_name=p["permission_name"],
                description=p["description"],
                created_at=None,
                usage_count=0,
                is_system=p["permission_name"].startswith("system.")
            )
            for p in permissions_data
        ]
        
        return RoleWithPermissions(
            role_id=role.role_id,
            role_name=role.role_name,
            description=role.description,
            permissions=permissions,
            user_count=user_count
        )
    
    def get_roles_by_permission(self, permission_id: int) -> PermissionWithRoles:
        """Get all roles that have a specific permission"""
        roles_data = self.repository.get_roles_by_permission(self.db, permission_id)
        
        # Get permission info
        permission = self.repository.get_permission_by_id(self.db, permission_id)
        if not permission:
            raise ValueError(f"Permission {permission_id} not found")
        
        roles = [
            {
                "role_id": r["role_id"],
                "role_name": r["role_name"],
                "description": r["description"],
                "assigned_at": r["assigned_at"]
            }
            for r in roles_data
        ]
        
        return PermissionWithRoles(
            permission_id=permission.permission_id,
            permission_name=permission.permission_name,
            roles=roles,
            total_assignments=len(roles)
        )
    
    # ===== PERMISSION USAGE & SAFETY =====
    
    def get_permission_usage_summary(self) -> List[PermissionUsage]:
        """Get usage summary for all permissions"""
        usage_data = self.repository.get_permission_usage_summary(self.db)
        
        return [
            PermissionUsage(
                permission_id=usage["permission_id"],
                permission_name=usage["permission_name"],
                assigned_roles=usage["assigned_roles"],
                assigned_users=usage["assigned_users"],
                last_used=None  # Would need audit log to determine this
            )
            for usage in usage_data
        ]
    
    def check_permission_dependency(self, permission_id: int) -> PermissionDependency:
        """Check dependencies for a permission"""
        dependency_data = self.repository.check_permission_dependency(self.db, permission_id)
        
        if not dependency_data["exists"]:
            raise ValueError(f"Permission {permission_id} not found")
        
        # In a real system, you would have actual dependency data
        # For now, return empty lists
        return PermissionDependency(
            permission_id=permission_id,
            depends_on=[],
            required_by=[]
        )
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_permission_creation_notification(self, permission):
        """Send notifications when permission is created"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Determine if it's a system permission
            is_system = permission.permission_name.startswith("system.")
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "🔐 New Permission Created",
                    'message': f"New permission '{permission.permission_name}' created. {'(System Permission)' if is_system else ''} Description: {permission.description}",
                    'type': "SYSTEM",
                    'reference_id': permission.permission_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send permission creation notifications: {e}")

    def _send_permission_update_notification(self, old_permission, new_permission):
        """Send notifications when permission is updated"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Determine what changed
            changes = []
            if old_permission.permission_name != new_permission.permission_name:
                changes.append(f"name: '{old_permission.permission_name}' → '{new_permission.permission_name}'")
            if old_permission.description != new_permission.description:
                changes.append(f"description updated")
            
            if not changes:
                return
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "✏️ Permission Updated",
                    'message': f"Permission ID {new_permission.permission_id} updated. Changes: {', '.join(changes)}",
                    'type': "SYSTEM",
                    'reference_id': new_permission.permission_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send permission update notifications: {e}")

    def _send_permission_deletion_notification(self, permission):
        """Send notifications when permission is deleted"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Get permission usage count
            usage = self.repository.get_roles_by_permission(self.db, permission.permission_id)
            usage_count = len(usage) if usage else 0
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "🗑️ Permission Deleted",
                    'message': f"Permission '{permission.permission_name}' (ID: {permission.permission_id}) has been deleted. Was assigned to {usage_count} role(s).",
                    'type': "SYSTEM",
                    'reference_id': permission.permission_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send permission deletion notifications: {e}")

    def _send_permission_assignment_notification(self, role, permission):
        """Send notifications when permission is assigned to role"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "🔗 Permission Assigned",
                    'message': f"Permission '{permission.permission_name}' assigned to role '{role.role_name}'.",
                    'type': "SYSTEM",
                    'reference_id': permission.permission_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send permission assignment notifications: {e}")

    def _send_permission_removal_notification(self, role, permission):
        """Send notifications when permission is removed from role"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "🔗 Permission Removed",
                    'message': f"Permission '{permission.permission_name}' removed from role '{role.role_name}'.",
                    'type': "SYSTEM",
                    'reference_id': permission.permission_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send permission removal notifications: {e}")