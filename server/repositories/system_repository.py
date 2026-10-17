from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, case, text, between, extract
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any

# Import your models
from models.user import User
from models.role import Role, Permission, UserRole, RolePermission
from models.analytics.user_sessions import UserSession
from models.analytics.admin_activity_log import AdminActivityLog
from models.notification import Notification
from models.order.order import Order
from models.payment import Payment
from models.order.order_refund import OrderRefund
from models.order.order_return import OrderReturn
from models.delivery.delivery import Delivery
from models.feedback.feedback import Feedback
from models.feedback.user_issue import UserIssue

class SystemRepository:
    
    # ===== USER & ACCESS MONITORING =====
    
    @staticmethod
    def get_active_users_count(db: Session) -> Tuple[int, int]:
        """Get count of active users and total users"""
        total_users = db.query(User).count()
        
        # Active users: logged in within last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        active_users = db.query(User).filter(
            User.last_login >= thirty_days_ago,
            User.is_active == True
        ).count()
        
        return total_users, active_users
    
    @staticmethod
    def get_logged_in_users(db: Session) -> List[Dict[str, Any]]:
        """Get currently logged in users (active sessions)"""
        fifteen_minutes_ago = datetime.now() - timedelta(minutes=15)
        
        logged_in_users = db.query(
            User.user_id,
            User.username,
            User.email,
            func.concat(User.first_name, ' ', User.last_name).label('full_name'),
            User.last_login,
            UserSession.device_info,
            UserSession.ip_address,
            UserSession.last_activity
        ).join(
            UserSession, User.user_id == UserSession.user_id
        ).filter(
            UserSession.last_activity >= fifteen_minutes_ago
        ).group_by(
            User.user_id,
            User.username,
            User.email,
            User.first_name,
            User.last_name,
            User.last_login,
            UserSession.device_info,
            UserSession.ip_address,
            UserSession.last_activity
        ).all()
        
        return [
            {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "last_login": user.last_login,
                "device_info": user.device_info,
                "ip_address": user.ip_address,
                "last_activity": user.last_activity
            }
            for user in logged_in_users
        ]
    
    @staticmethod
    def get_user_role_distribution(db: Session) -> List[Dict[str, Any]]:
        """Get distribution of users by role"""
        role_distribution = db.query(
            Role.role_name,
            func.count(UserRole.user_id).label('user_count')
        ).join(
            UserRole, UserRole.role_id == Role.role_id
        ).join(
            User, User.user_id == UserRole.user_id
        ).filter(
            User.is_active == True
        ).group_by(
            Role.role_id,
            Role.role_name
        ).order_by(
            desc('user_count')
        ).all()
        
        total_users = db.query(User).filter(User.is_active == True).count()
        
        return [
            {
                "role_name": dist.role_name,
                "user_count": dist.user_count,
                "percentage": (dist.user_count / total_users * 100) if total_users > 0 else 0
            }
            for dist in role_distribution
        ]
    
    # ===== SESSION & SECURITY =====
    
    @staticmethod
    def get_active_sessions(db: Session) -> List[Dict[str, Any]]:
        """Get all active sessions (last 30 minutes)"""
        thirty_minutes_ago = datetime.now() - timedelta(minutes=30)
        
        active_sessions = db.query(
            UserSession.session_id,
            UserSession.user_id,
            User.username,
            UserSession.device_info,
            UserSession.ip_address,
            UserSession.last_activity,
            UserSession.created_at,
            func.extract('epoch', func.now() - UserSession.last_activity).label('inactive_minutes')
        ).join(
            User, User.user_id == UserSession.user_id
        ).filter(
            UserSession.last_activity >= thirty_minutes_ago
        ).order_by(
            desc(UserSession.last_activity)
        ).all()
        
        return [
            {
                "session_id": session.session_id,
                "user_id": session.user_id,
                "username": session.username,
                "device_info": session.device_info,
                "ip_address": session.ip_address,
                "last_activity": session.last_activity,
                "duration_minutes": (
                    (session.last_activity - session.created_at).total_seconds() / 60
                    if session.created_at else 0
                ),
                "is_expiring": session.inactive_minutes > 25  # Warning for near expiry
            }
            for session in active_sessions
        ]
    
    @staticmethod
    def get_session_activity_summary(db: Session) -> Dict[str, Any]:
        """Get session activity summary"""
        thirty_minutes_ago = datetime.now() - timedelta(minutes=30)
        twenty_four_hours_ago = datetime.now() - timedelta(hours=24)
        
        # Active sessions
        active_sessions = db.query(UserSession).filter(
            UserSession.last_activity >= thirty_minutes_ago
        ).count()
        
        # Total sessions in last 24 hours
        total_sessions = db.query(UserSession).filter(
            UserSession.created_at >= twenty_four_hours_ago
        ).count()
        
        # Average session duration
        avg_duration = db.query(
            func.avg(
                func.extract('epoch', UserSession.last_activity - UserSession.created_at) / 60
            )
        ).filter(
            UserSession.created_at >= twenty_four_hours_ago
        ).scalar() or 0
        
        # Device distribution
        device_distribution = db.query(
            UserSession.device_info,
            func.count(UserSession.session_id).label('session_count')
        ).filter(
            UserSession.created_at >= twenty_four_hours_ago
        ).group_by(
            UserSession.device_info
        ).all()
        
        total_device_sessions = sum(d.session_count for d in device_distribution)
        
        return {
            "active_sessions": active_sessions,
            "total_sessions": total_sessions,
            "avg_session_duration": float(avg_duration),
            "device_distribution": {
                d.device_info or "Unknown": (
                    (d.session_count / total_device_sessions * 100) 
                    if total_device_sessions > 0 else 0
                )
                for d in device_distribution
            }
        }
    
    @staticmethod
    def get_device_login_distribution(db: Session) -> List[Dict[str, Any]]:
        """Get login distribution by device type"""
        twenty_four_hours_ago = datetime.now() - timedelta(hours=24)
        
        device_logins = db.query(
            case(
                (UserSession.device_info.ilike('%android%'), 'Android'),
                (UserSession.device_info.ilike('%iphone%'), 'iOS'),
                (UserSession.device_info.ilike('%ipad%'), 'iOS'),
                (UserSession.device_info.ilike('%windows%'), 'Windows'),
                (UserSession.device_info.ilike('%mac%'), 'Mac'),
                (UserSession.device_info.ilike('%linux%'), 'Linux'),
                else_='Other'
            ).label('device_type'),
            func.count(UserSession.session_id).label('login_count')
        ).filter(
            UserSession.created_at >= twenty_four_hours_ago
        ).group_by('device_type').order_by(desc('login_count')).all()
        
        total_logins = sum(d.login_count for d in device_logins)
        
        return [
            {
                "device_type": d.device_type,
                "login_count": d.login_count,
                "percentage": (d.login_count / total_logins * 100) if total_logins > 0 else 0
            }
            for d in device_logins
        ]
    
    # ===== ADMIN & AUDIT LOGS =====
    
    @staticmethod
    def get_admin_activity_logs(
        db: Session, 
        admin_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get admin activity logs with pagination"""
        query = db.query(AdminActivityLog)
        
        if admin_id:
            query = query.filter(AdminActivityLog.admin_id == admin_id)
        
        total = query.count()
        
        logs = query.order_by(desc(AdminActivityLog.created_at)).offset(offset).limit(limit).all()
        
        # Get admin names for the logs
        admin_ids = {log.admin_id for log in logs}
        admins = {}
        if admin_ids:
            admin_users = db.query(User.user_id, User.username, User.first_name, User.last_name).filter(
                User.user_id.in_(admin_ids)
            ).all()
            admins = {admin.user_id: admin for admin in admin_users}
        
        return [
            {
                "log_id": log.log_id,
                "admin_id": log.admin_id,
                "admin_name": f"{admins.get(log.admin_id, {}).get('first_name', '')} {admins.get(log.admin_id, {}).get('last_name', '')}".strip() or admins.get(log.admin_id, {}).get('username', 'Unknown'),
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "ip_address": log.ip_address,
                "created_at": log.created_at,
                "critical_level": SystemRepository._determine_critical_level(log.action, log.entity_type)
            }
            for log in logs
        ], total
    
    @staticmethod
    def get_recent_admin_actions(db: Session, hours: int = 24) -> List[Dict[str, Any]]:
        """Get recent admin actions within specified hours"""
        time_threshold = datetime.now() - timedelta(hours=hours)
        
        recent_actions = db.query(AdminActivityLog).filter(
            AdminActivityLog.created_at >= time_threshold
        ).order_by(desc(AdminActivityLog.created_at)).limit(100).all()
        
        # Get admin names
        admin_ids = {action.admin_id for action in recent_actions}
        admins = {}
        if admin_ids:
            admin_users = db.query(User.user_id, User.username).filter(
                User.user_id.in_(admin_ids)
            ).all()
            admins = {admin.user_id: admin.username for admin in admin_users}
        
        return [
            {
                "log_id": action.log_id,
                "admin_id": action.admin_id,
                "admin_name": admins.get(action.admin_id, "Unknown"),
                "action": action.action,
                "entity_type": action.entity_type,
                "entity_id": action.entity_id,
                "created_at": action.created_at,
                "critical_level": SystemRepository._determine_critical_level(action.action, action.entity_type)
            }
            for action in recent_actions
        ]
    
    @staticmethod
    def get_critical_admin_actions(db: Session, days: int = 7) -> List[Dict[str, Any]]:
        """Get critical admin actions within specified days"""
        time_threshold = datetime.now() - timedelta(days=days)
        
        critical_actions = db.query(AdminActivityLog).filter(
            AdminActivityLog.created_at >= time_threshold
        ).all()
        
        # Filter for critical actions
        critical = []
        for action in critical_actions:
            level = SystemRepository._determine_critical_level(action.action, action.entity_type)
            if level in ["HIGH", "CRITICAL"]:
                critical.append({
                    "log_id": action.log_id,
                    "admin_id": action.admin_id,
                    "action": action.action,
                    "entity_type": action.entity_type,
                    "entity_id": action.entity_id,
                    "created_at": action.created_at,
                    "critical_level": level,
                    "details": f"{action.action} on {action.entity_type}"
                })
        
        return critical
    
    @staticmethod
    def _determine_critical_level(action: str, entity_type: str) -> str:
        """Determine critical level of an admin action"""
        critical_actions = {
            "DELETE": "HIGH",
            "DISABLE": "HIGH",
            "SUSPEND": "HIGH",
            "TERMINATE": "CRITICAL",
            "GRANT_ADMIN": "HIGH",
            "CHANGE_PERMISSION": "MEDIUM",
            "UPDATE": "LOW",
            "CREATE": "LOW",
            "VIEW": "LOW"
        }
        
        critical_entities = {
            "USER": "HIGH",
            "ROLE": "HIGH",
            "PERMISSION": "HIGH",
            "PAYMENT": "HIGH",
            "ORDER": "MEDIUM",
            "PRODUCT": "MEDIUM",
            "SETTINGS": "HIGH"
        }
        
        action_level = critical_actions.get(action.upper(), "LOW")
        entity_level = critical_entities.get(entity_type.upper(), "LOW")
        
        # Return the higher critical level
        if entity_level == "CRITICAL" or action_level == "CRITICAL":
            return "CRITICAL"
        elif entity_level == "HIGH" or action_level == "HIGH":
            return "HIGH"
        elif entity_level == "MEDIUM" or action_level == "MEDIUM":
            return "MEDIUM"
        else:
            return "LOW"
    
    # ===== APPLICATION HEALTH =====
    
    @staticmethod
    def get_system_health_status(db: Session) -> Dict[str, Any]:
        """Get comprehensive system health status"""
        now = datetime.now()
        
        # Database health
        try:
            db.query(User).limit(1).all()
            db_status = "HEALTHY"
            db_response_time = None  # Could be measured with time
        except Exception as e:
            db_status = "UNHEALTHY"
        
        # Check for failed operations
        twenty_four_hours_ago = now - timedelta(hours=24)
        
        # Failed orders
        failed_orders = db.query(Order).filter(
            Order.order_status.in_(["FAILED", "CANCELLED"]),
            Order.placed_at >= twenty_four_hours_ago
        ).count()
        
        total_orders = db.query(Order).filter(
            Order.placed_at >= twenty_four_hours_ago
        ).count()
        
        order_success_rate = ((total_orders - failed_orders) / total_orders * 100) if total_orders > 0 else 100
        
        # Failed payments
        failed_payments = db.query(Payment).filter(
            Payment.payment_status == "FAILED",
            Payment.payment_date >= twenty_four_hours_ago
        ).count()
        
        total_payments = db.query(Payment).filter(
            Payment.payment_date >= twenty_four_hours_ago
        ).count()
        
        payment_success_rate = ((total_payments - failed_payments) / total_payments * 100) if total_payments > 0 else 100
        
        # Check for open issues
        open_issues = db.query(UserIssue).filter(
            UserIssue.status == "OPEN"
        ).count()
        
        # Overall status
        if order_success_rate < 90 or payment_success_rate < 90 or open_issues > 10:
            overall_status = "DEGRADED"
        elif order_success_rate < 80 or payment_success_rate < 80:
            overall_status = "UNHEALTHY"
        else:
            overall_status = "HEALTHY"
        
        return {
            "overall_status": overall_status,
            "database": {
                "status": db_status,
                "last_check": now
            },
            "orders": {
                "success_rate": order_success_rate,
                "failed_count": failed_orders,
                "total_count": total_orders
            },
            "payments": {
                "success_rate": payment_success_rate,
                "failed_count": failed_payments,
                "total_count": total_payments
            },
            "open_issues": open_issues,
            "last_checked": now
        }
    
    @staticmethod
    def get_failed_operations_summary(db: Session, days: int = 7) -> Dict[str, Any]:
        """Get summary of failed operations"""
        time_threshold = datetime.now() - timedelta(days=days)
        
        # Failed orders
        failed_orders = db.query(Order).filter(
            Order.order_status.in_(["FAILED", "CANCELLED"]),
            Order.placed_at >= time_threshold
        ).count()
        
        total_orders = db.query(Order).filter(
            Order.placed_at >= time_threshold
        ).count()
        
        # Failed payments
        failed_payments = db.query(Payment).filter(
            Payment.payment_status == "FAILED",
            Payment.payment_date >= time_threshold
        ).count()
        
        total_payments = db.query(Payment).filter(
            Payment.payment_date >= time_threshold
        ).count()
        
        # Failed deliveries
        failed_deliveries = db.query(Delivery).filter(
            Delivery.status == "FAILED",
            Delivery.assigned_at >= time_threshold
        ).count()
        
        total_deliveries = db.query(Delivery).filter(
            Delivery.assigned_at >= time_threshold
        ).count()
        
        return {
            "time_period": f"{days} days",
            "total_failures": failed_orders + failed_payments + failed_deliveries,
            "operations": [
                {
                    "operation_type": "ORDERS",
                    "failure_count": failed_orders,
                    "success_rate": ((total_orders - failed_orders) / total_orders * 100) if total_orders > 0 else 100,
                    "total_operations": total_orders
                },
                {
                    "operation_type": "PAYMENTS",
                    "failure_count": failed_payments,
                    "success_rate": ((total_payments - failed_payments) / total_payments * 100) if total_payments > 0 else 100,
                    "total_operations": total_payments
                },
                {
                    "operation_type": "DELIVERIES",
                    "failure_count": failed_deliveries,
                    "success_rate": ((total_deliveries - failed_deliveries) / total_deliveries * 100) if total_deliveries > 0 else 100,
                    "total_operations": total_deliveries
                }
            ],
            "overall_success_rate": (
                ((total_orders + total_payments + total_deliveries) - 
                 (failed_orders + failed_payments + failed_deliveries)) / 
                (total_orders + total_payments + total_deliveries) * 100
            ) if (total_orders + total_payments + total_deliveries) > 0 else 100
        }
    
    # ===== NOTIFICATION STATUS =====
    
    @staticmethod
    def get_notification_delivery_summary(db: Session, days: int = 7) -> Dict[str, Any]:
        """Get notification delivery summary"""
        time_threshold = datetime.now() - timedelta(days=days)
        
        notifications = db.query(Notification).filter(
            Notification.created_at >= time_threshold
        ).all()
        
        total_sent = len(notifications)
        total_read = sum(1 for n in notifications if n.is_read)
        
        # Group by type
        by_type = {}
        for n in notifications:
            n_type = n.type.value if hasattr(n.type, 'value') else str(n.type)
            if n_type not in by_type:
                by_type[n_type] = {"sent": 0, "read": 0}
            
            by_type[n_type]["sent"] += 1
            if n.is_read:
                by_type[n_type]["read"] += 1
        
        # Calculate read rates per type
        for n_type in by_type:
            sent = by_type[n_type]["sent"]
            read = by_type[n_type]["read"]
            by_type[n_type]["read_rate"] = (read / sent * 100) if sent > 0 else 0
        
        return {
            "total_sent": total_sent,
            "total_read": total_read,
            "read_rate": (total_read / total_sent * 100) if total_sent > 0 else 0,
            "pending_delivery": 0,  # Assuming instant delivery
            "failed_delivery": 0,   # Assuming no failures
            "by_type": by_type,
            "time_period": f"{days} days"
        }
    
    @staticmethod
    def get_unread_notifications_count(db: Session) -> Dict[str, Any]:
        """Get count of unread notifications"""
        unread_notifications = db.query(Notification).filter(
            Notification.is_read == False
        ).all()
        
        total_unread = len(unread_notifications)
        
        # Group by user
        by_user = {}
        for n in unread_notifications:
            user_id = str(n.user_id)
            if user_id not in by_user:
                by_user[user_id] = 0
            by_user[user_id] += 1
        
        # Group by type
        by_type = {}
        for n in unread_notifications:
            n_type = n.type.value if hasattr(n.type, 'value') else str(n.type)
            if n_type not in by_type:
                by_type[n_type] = 0
            by_type[n_type] += 1
        
        # Find oldest unread
        oldest = None
        if unread_notifications:
            oldest = min(n.created_at for n in unread_notifications)
        
        return {
            "total_unread": total_unread,
            "by_user": by_user,
            "by_type": by_type,
            "oldest_unread": oldest
        }
    
    # ===== PERMISSION MANAGEMENT =====
    
    @staticmethod
    def create_permission(db: Session, permission_name: str, description: Optional[str] = None) -> Permission:
        """Create a new permission"""
        permission = Permission(
            permission_name=permission_name,
            description=description
        )
        db.add(permission)
        db.commit()
        db.refresh(permission)
        return permission
    
    @staticmethod
    def update_permission(db: Session, permission_id: int, permission_name: Optional[str] = None, 
                         description: Optional[str] = None) -> Optional[Permission]:
        """Update an existing permission"""
        permission = db.query(Permission).filter(Permission.permission_id == permission_id).first()
        if not permission:
            return None
        
        if permission_name:
            permission.permission_name = permission_name
        if description is not None:
            permission.description = description
        
        db.commit()
        db.refresh(permission)
        return permission
    
    @staticmethod
    def delete_permission(db: Session, permission_id: int) -> bool:
        """Delete a permission if not in use"""
        # Check if permission is assigned to any role
        assigned = db.query(RolePermission).filter(
            RolePermission.permission_id == permission_id
        ).first()
        
        if assigned:
            return False  # Cannot delete permission that's in use
        
        permission = db.query(Permission).filter(Permission.permission_id == permission_id).first()
        if permission:
            db.delete(permission)
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def get_all_permissions(db: Session) -> List[Permission]:
        """Get all permissions"""
        return db.query(Permission).order_by(Permission.permission_name).all()
    
    @staticmethod
    def get_permission_by_id(db: Session, permission_id: int) -> Optional[Permission]:
        """Get permission by ID"""
        return db.query(Permission).filter(Permission.permission_id == permission_id).first()
    
    @staticmethod
    def get_permission_by_name(db: Session, permission_name: str) -> Optional[Permission]:
        """Get permission by name"""
        return db.query(Permission).filter(Permission.permission_name == permission_name).first()
    
    # ===== PERMISSION ↔ ROLE MAPPING =====
    
    @staticmethod
    def assign_permission_to_role(db: Session, role_id: int, permission_id: int) -> bool:
        """Assign a permission to a role"""
        # Check if already assigned
        existing = db.query(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id
        ).first()
        
        if existing:
            return False  # Already assigned
        
        # Check if role and permission exist
        role = db.query(Role).filter(Role.role_id == role_id).first()
        permission = db.query(Permission).filter(Permission.permission_id == permission_id).first()
        
        if not role or not permission:
            return False
        
        role_permission = RolePermission(
            role_id=role_id,
            permission_id=permission_id
        )
        
        db.add(role_permission)
        db.commit()
        return True
    
    @staticmethod
    def remove_permission_from_role(db: Session, role_id: int, permission_id: int) -> bool:
        """Remove a permission from a role"""
        role_permission = db.query(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id
        ).first()
        
        if not role_permission:
            return False
        
        db.delete(role_permission)
        db.commit()
        return True
    
    @staticmethod
    def get_permissions_by_role(db: Session, role_id: int) -> List[Dict[str, Any]]:
        """Get all permissions assigned to a role"""
        permissions = db.query(
            Permission.permission_id,
            Permission.permission_name,
            Permission.description,
            RolePermission.assigned_at
        ).join(
            RolePermission, RolePermission.permission_id == Permission.permission_id
        ).filter(
            RolePermission.role_id == role_id
        ).order_by(
            Permission.permission_name
        ).all()
        
        return [
            {
                "permission_id": p.permission_id,
                "permission_name": p.permission_name,
                "description": p.description,
                "assigned_at": p.assigned_at
            }
            for p in permissions
        ]
    
    @staticmethod
    def get_roles_by_permission(db: Session, permission_id: int) -> List[Dict[str, Any]]:
        """Get all roles that have a specific permission"""
        roles = db.query(
            Role.role_id,
            Role.role_name,
            Role.description,
            RolePermission.assigned_at
        ).join(
            RolePermission, RolePermission.role_id == Role.role_id
        ).filter(
            RolePermission.permission_id == permission_id
        ).order_by(
            Role.role_name
        ).all()
        
        return [
            {
                "role_id": r.role_id,
                "role_name": r.role_name,
                "description": r.description,
                "assigned_at": r.assigned_at
            }
            for r in roles
        ]
    
    # ===== PERMISSION USAGE & SAFETY =====
    
    @staticmethod
    def get_permission_usage_summary(db: Session) -> List[Dict[str, Any]]:
        """Get usage summary for all permissions"""
        permissions = db.query(Permission).all()
        
        result = []
        for permission in permissions:
            # Count roles using this permission
            role_count = db.query(RolePermission).filter(
                RolePermission.permission_id == permission.permission_id
            ).count()
            
            # Count users indirectly through roles
            user_count = db.query(UserRole).join(
                RolePermission, RolePermission.role_id == UserRole.role_id
            ).filter(
                RolePermission.permission_id == permission.permission_id
            ).count()
            
            result.append({
                "permission_id": permission.permission_id,
                "permission_name": permission.permission_name,
                "description": permission.description,
                "assigned_roles": role_count,
                "assigned_users": user_count,
                "is_system": permission.permission_name.startswith("system."),
                "created_at": getattr(permission, 'created_at', None)
            })
        
        return result
    
    @staticmethod
    def check_permission_dependency(db: Session, permission_id: int) -> Dict[str, Any]:
        """Check dependencies for a permission"""
        permission = db.query(Permission).filter(
            Permission.permission_id == permission_id
        ).first()
        
        if not permission:
            return {
                "permission_id": permission_id,
                "exists": False,
                "dependencies": []
            }
        
        # This is a simplified dependency check
        # In a real system, you might have a dependency table
        dependencies = []
        
        # Example: Check if this permission is required by other permissions
        # This would require a dependency table in the database
        
        return {
            "permission_id": permission.permission_id,
            "permission_name": permission.permission_name,
            "exists": True,
            "dependencies": dependencies,
            "is_used": db.query(RolePermission).filter(
                RolePermission.permission_id == permission_id
            ).first() is not None
        }
    
    # ===== HELPER METHODS =====
    
    @staticmethod
    def get_api_usage_overview(db: Session) -> Dict[str, Any]:
        """Get API usage overview (simplified version)"""
        # This would typically come from API logging table
        # For now, return placeholder data
        return {
            "total_requests": 0,
            "endpoints": [],
            "peak_hour": "14:00",
            "avg_response_time": 0.15
        }