import api from './api';

const SYSTEM_BASE_URL = `/admin/system`;

/* -----------------------------
   ✅ SYSTEM USER & ACCESS MONITORING API
------------------------------ */

// Get active users count
export const getActiveUsersCount = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/users/active/count`);
        return { 
            success: true, 
            data: response.data,
            message: "Active users count fetched successfully" 
        };
    } catch (error) {
        console.error("Active Users Count Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch active users count",
            data: null
        };
    }
};

// Get logged in users
export const getLoggedInUsers = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/users/logged-in`);
        return { 
            success: true, 
            data: response.data,
            message: "Logged in users fetched successfully" 
        };
    } catch (error) {
        console.error("Logged In Users Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch logged in users",
            data: []
        };
    }
};

// Get user role distribution
export const getUserRoleDistribution = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/users/role-distribution`);
        return { 
            success: true, 
            data: response.data,
            message: "User role distribution fetched successfully" 
        };
    } catch (error) {
        console.error("User Role Distribution Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch user role distribution",
            data: null
        };
    }
};

/* -----------------------------
   ✅ SYSTEM SESSION & SECURITY API
------------------------------ */

// Get active sessions
export const getActiveSessions = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/sessions/active`);
        return { 
            success: true, 
            data: response.data,
            message: "Active sessions fetched successfully" 
        };
    } catch (error) {
        console.error("Active Sessions Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch active sessions",
            data: []
        };
    }
};

// Get session activity summary
export const getSessionActivitySummary = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/sessions/summary`);
        return { 
            success: true, 
            data: response.data,
            message: "Session activity summary fetched successfully" 
        };
    } catch (error) {
        console.error("Session Activity Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch session activity summary",
            data: null
        };
    }
};

// Get device login distribution
export const getDeviceLoginDistribution = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/sessions/device-distribution`);
        return { 
            success: true, 
            data: response.data,
            message: "Device login distribution fetched successfully" 
        };
    } catch (error) {
        console.error("Device Login Distribution Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch device login distribution",
            data: []
        };
    }
};

/* -----------------------------
   ✅ SYSTEM ADMIN & AUDIT LOGS API
------------------------------ */

// Get admin activity logs
export const getAdminActivityLogs = async (adminId = null, page = 1, size = 50) => {
    try {
        const params = { page, size };
        if (adminId) params.admin_id = adminId;
        
        const response = await api.get(`${SYSTEM_BASE_URL}/admin/logs`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Admin activity logs fetched successfully" 
        };
    } catch (error) {
        console.error("Admin Activity Logs Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch admin activity logs",
            data: { logs: [], summary: {}, pagination: {} }
        };
    }
};

// Get recent admin actions
export const getRecentAdminActions = async (hours = 24) => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/admin/recent-actions`, { 
            params: { hours } 
        });
        return { 
            success: true, 
            data: response.data,
            message: "Recent admin actions fetched successfully" 
        };
    } catch (error) {
        console.error("Recent Admin Actions Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch recent admin actions",
            data: null
        };
    }
};

// Get critical admin actions
export const getCriticalAdminActions = async (days = 7) => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/admin/critical-actions`, { 
            params: { days } 
        });
        return { 
            success: true, 
            data: response.data,
            message: "Critical admin actions fetched successfully" 
        };
    } catch (error) {
        console.error("Critical Admin Actions Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch critical admin actions",
            data: []
        };
    }
};

/* -----------------------------
   ✅ SYSTEM APPLICATION HEALTH API
------------------------------ */

// Get system health status
export const getSystemHealthStatus = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/health/status`);
        return { 
            success: true, 
            data: response.data,
            message: "System health status fetched successfully" 
        };
    } catch (error) {
        console.error("System Health Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch system health status",
            data: null
        };
    }
};

// Get failed operations summary
export const getFailedOperationsSummary = async (days = 7) => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/health/failed-operations`, { 
            params: { days } 
        });
        return { 
            success: true, 
            data: response.data,
            message: "Failed operations summary fetched successfully" 
        };
    } catch (error) {
        console.error("Failed Operations Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch failed operations summary",
            data: null
        };
    }
};

// Get API usage overview
export const getApiUsageOverview = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/health/api-usage`);
        return { 
            success: true, 
            data: response.data,
            message: "API usage overview fetched successfully" 
        };
    } catch (error) {
        console.error("API Usage Overview Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch API usage overview",
            data: null
        };
    }
};

/* -----------------------------
   ✅ SYSTEM NOTIFICATION STATUS API
------------------------------ */

// Get notification delivery summary
export const getNotificationDeliverySummary = async (days = 7) => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/notifications/delivery-summary`, { 
            params: { days } 
        });
        return { 
            success: true, 
            data: response.data,
            message: "Notification delivery summary fetched successfully" 
        };
    } catch (error) {
        console.error("Notification Delivery Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch notification delivery summary",
            data: null
        };
    }
};

// Get unread notifications count
export const getUnreadNotificationsCount = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/notifications/unread-count`);
        return { 
            success: true, 
            data: response.data,
            message: "Unread notifications count fetched successfully" 
        };
    } catch (error) {
        console.error("Unread Notifications Count Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch unread notifications count",
            data: null
        };
    }
};

/* -----------------------------
   ✅ SYSTEM PERMISSION MANAGEMENT API
------------------------------ */

// Get all permissions
export const getAllPermissions = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/permissions`);
        return { 
            success: true, 
            data: response.data,
            message: "All permissions fetched successfully" 
        };
    } catch (error) {
        console.error("All Permissions Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch permissions",
            data: []
        };
    }
};

// Get permission by ID
export const getPermissionById = async (permissionId) => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/permissions/${permissionId}`);
        return { 
            success: true, 
            data: response.data,
            message: "Permission fetched successfully" 
        };
    } catch (error) {
        console.error("Permission By ID Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch permission",
            data: null
        };
    }
};

// Create permission
export const createPermission = async (permissionData) => {
    try {
        const response = await api.post(`${SYSTEM_BASE_URL}/permissions`, permissionData);
        return { 
            success: true, 
            data: response.data,
            message: "Permission created successfully" 
        };
    } catch (error) {
        console.error("Create Permission Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to create permission",
            data: null
        };
    }
};

// Update permission
export const updatePermission = async (permissionId, updateData) => {
    try {
        const response = await api.put(`${SYSTEM_BASE_URL}/permissions/${permissionId}`, updateData);
        return { 
            success: true, 
            data: response.data,
            message: "Permission updated successfully" 
        };
    } catch (error) {
        console.error("Update Permission Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update permission",
            data: null
        };
    }
};

// Delete permission
export const deletePermission = async (permissionId) => {
    try {
        console.log('API: deletePermission called with permissionId:', permissionId);
        const response = await api.delete(`${SYSTEM_BASE_URL}/permissions/${permissionId}`);
        return { 
            success: true, 
            data: response.data,
            message: "Permission deleted successfully" 
        };
    } catch (error) {
        console.error("Delete Permission Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete permission",
            data: null
        };
    }
};

/* -----------------------------
   ✅ SYSTEM PERMISSION ↔ ROLE MAPPING API
------------------------------ */

// Assign permission to role
export const assignPermissionToRole = async (roleId, permissionId) => {
    try {
        const response = await api.post(`${SYSTEM_BASE_URL}/roles/${roleId}/permissions/${permissionId}`);
        return { 
            success: true, 
            data: response.data,
            message: "Permission assigned to role successfully" 
        };
    } catch (error) {
        console.error("Assign Permission Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to assign permission to role",
            data: null
        };
    }
};

// Remove permission from role
export const removePermissionFromRole = async (roleId, permissionId) => {
    try {
        const response = await api.delete(`${SYSTEM_BASE_URL}/roles/${roleId}/permissions/${permissionId}`);
        return { 
            success: true, 
            data: response.data,
            message: "Permission removed from role successfully" 
        };
    } catch (error) {
        console.error("Remove Permission Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to remove permission from role",
            data: null
        };
    }
};

// Get permissions by role
export const getPermissionsByRole = async (roleId) => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/roles/${roleId}/permissions`);
        return { 
            success: true, 
            data: response.data,
            message: "Permissions by role fetched successfully" 
        };
    } catch (error) {
        console.error("Permissions By Role Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch permissions by role",
            data: null
        };
    }
};

// Get roles by permission
export const getRolesByPermission = async (permissionId) => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/permissions/${permissionId}/roles`);
        return { 
            success: true, 
            data: response.data,
            message: "Roles by permission fetched successfully" 
        };
    } catch (error) {
        console.error("Roles By Permission Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch roles by permission",
            data: null
        };
    }
};

/* -----------------------------
   ✅ SYSTEM PERMISSION USAGE & SAFETY API
------------------------------ */

// Get permission usage summary
export const getPermissionUsageSummary = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/permissions/usage/summary`);
        return { 
            success: true, 
            data: response.data,
            message: "Permission usage summary fetched successfully" 
        };
    } catch (error) {
        console.error("Permission Usage Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch permission usage summary",
            data: []
        };
    }
};

// Check permission dependency
export const checkPermissionDependency = async (permissionId) => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/permissions/${permissionId}/dependencies`);
        return { 
            success: true, 
            data: response.data,
            message: "Permission dependency checked successfully" 
        };
    } catch (error) {
        console.error("Permission Dependency Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to check permission dependency",
            data: null
        };
    }
};

/* -----------------------------
   ✅ SYSTEM DASHBOARD & HEALTH CHECK API
------------------------------ */

// Get system dashboard
export const getSystemDashboard = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/dashboard`);
        return { 
            success: true, 
            data: response.data,
            message: "System dashboard fetched successfully" 
        };
    } catch (error) {
        console.error("System Dashboard Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch system dashboard",
            data: null
        };
    }
};

// Get system health check
export const getSystemHealthCheck = async () => {
    try {
        const response = await api.get(`${SYSTEM_BASE_URL}/health-check`);
        return { 
            success: true, 
            data: response.data,
            message: "System health check completed successfully" 
        };
    } catch (error) {
        console.error("System Health Check Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to perform system health check",
            data: null
        };
    }
};