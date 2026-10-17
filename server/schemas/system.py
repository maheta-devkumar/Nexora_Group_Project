from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from decimal import Decimal

# ===== SYSTEM ENUMS =====
class SystemHealthStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNHEALTHY = "UNHEALTHY"

class UserActivityStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class CriticalActionLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

# ===== USER & ACCESS MONITORING =====
class ActiveUser(BaseModel):
    user_id: int
    username: str
    email: str
    full_name: str
    last_login: Optional[datetime]
    role: str
    status: str

class UserRoleDistribution(BaseModel):
    role_name: str
    user_count: int
    percentage: float

class UserAccessSummary(BaseModel):
    total_users: int
    active_users: int
    verified_users: int
    new_users_today: int
    role_distribution: List[UserRoleDistribution]

# ===== SESSION & SECURITY =====
class ActiveSession(BaseModel):
    session_id: int
    user_id: int
    username: str
    device_info: str
    ip_address: str
    last_activity: datetime
    duration_minutes: float

class SessionSummary(BaseModel):
    total_sessions: int
    active_sessions: int
    avg_session_duration: float
    peak_concurrent: int
    device_distribution: Dict[str, float]

class DeviceDistribution(BaseModel):
    device_type: str
    session_count: int
    percentage: float

# ===== ADMIN & AUDIT LOGS =====
class AdminAction(BaseModel):
    log_id: int
    admin_id: int
    admin_name: str
    action: str
    entity_type: str
    entity_id: Optional[int]
    old_value: Optional[str]
    new_value: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    critical_level: Optional[str]

class AdminActivitySummary(BaseModel):
    total_actions: int
    actions_today: int
    top_admins: List[Dict[str, Any]]
    critical_actions: int

class RecentAdminActions(BaseModel):
    logs: List[AdminAction]
    count: int
    time_range: str

# ===== APPLICATION HEALTH =====
class SystemComponent(BaseModel):
    name: str
    status: SystemHealthStatus
    response_time: Optional[float]
    last_check: datetime
    message: Optional[str]

class SystemHealthStatusResponse(BaseModel):
    overall_status: SystemHealthStatus
    database: SystemComponent
    api: SystemComponent
    cache: Optional[SystemComponent]
    storage: Optional[SystemComponent]
    uptime_days: float
    last_incident: Optional[datetime]

class FailedOperation(BaseModel):
    operation_type: str
    failure_count: int
    success_rate: float
    last_failure: Optional[datetime]
    common_error: Optional[str]

class FailedOperationsSummary(BaseModel):
    operations: List[FailedOperation]
    total_failures: int
    overall_success_rate: float
    time_period: str

class ApiEndpointUsage(BaseModel):
    endpoint: str
    method: str
    request_count: int
    avg_response_time: float
    error_rate: float

class ApiUsageOverview(BaseModel):
    total_requests: int
    endpoints: List[ApiEndpointUsage]
    peak_hour: str
    avg_response_time: float

# ===== NOTIFICATION STATUS =====
class NotificationStatus(BaseModel):
    notification_id: int
    user_id: int
    title: str
    type: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]

class NotificationDeliverySummary(BaseModel):
    total_sent: int
    total_read: int
    read_rate: float
    pending_delivery: int
    failed_delivery: int
    by_type: Dict[str, Dict[str, int]]

class UnreadNotifications(BaseModel):
    total_unread: int
    by_user: Dict[str, int]
    by_type: Dict[str, int]
    oldest_unread: Optional[datetime]

# ===== PERMISSION MANAGEMENT =====
class PermissionCreate(BaseModel):
    permission_name: str
    description: Optional[str] = None

class PermissionUpdate(BaseModel):
    permission_name: Optional[str] = None
    description: Optional[str] = None

class PermissionResponse(BaseModel):
    permission_id: int
    permission_name: str
    description: Optional[str]
    created_at: datetime
    usage_count: int
    is_system: bool

class RolePermissionAssignment(BaseModel):
    role_id: int
    permission_id: int

class PermissionUsage(BaseModel):
    permission_id: int
    permission_name: str
    assigned_roles: int
    assigned_users: int
    last_used: Optional[datetime]

class PermissionDependency(BaseModel):
    permission_id: int
    depends_on: List[int]
    required_by: List[int]

# ===== ROLE PERMISSION MAPPING =====
class RolePermissionResponse(BaseModel):
    role_id: int
    role_name: str
    permission_id: int
    permission_name: str
    assigned_at: datetime
    assigned_by: Optional[str]

class RoleWithPermissions(BaseModel):
    role_id: int
    role_name: str
    description: Optional[str]
    permissions: List[PermissionResponse]
    user_count: int

class PermissionWithRoles(BaseModel):
    permission_id: int
    permission_name: str
    roles: List[Dict[str, Any]]
    total_assignments: int

# ===== SYSTEM RESPONSE MODELS =====
class SystemResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    timestamp: datetime = datetime.now()

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int