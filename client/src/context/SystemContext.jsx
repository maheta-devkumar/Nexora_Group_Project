import React, { createContext, useContext, useState, useCallback } from 'react';
import * as systemApi from '../api/system';

const SystemContext = createContext();

export const useSystemContext = () => {
    const context = useContext(SystemContext);
    if (!context) {
        throw new Error('useSystemContext must be used within SystemProvider');
    }
    return context;
};

export const SystemProvider = ({ children }) => {
    // State for User & Access Monitoring
    const [userAccess, setUserAccess] = useState({
        activeUsersCount: null,
        loggedInUsers: [],
        userRoleDistribution: null,
        userAccessSummary: null
    });

    // State for Session & Security
    const [sessions, setSessions] = useState({
        activeSessions: [],
        sessionSummary: null,
        deviceDistribution: []
    });

    // State for Admin & Audit Logs
    const [adminLogs, setAdminLogs] = useState({
        adminActivityLogs: { logs: [], summary: {}, pagination: {} },
        recentAdminActions: null,
        criticalAdminActions: []
    });

    // State for Application Health
    const [systemHealth, setSystemHealth] = useState({
        healthStatus: null,
        failedOperationsSummary: null,
        apiUsageOverview: null
    });

    // State for Notification Status
    const [notifications, setNotifications] = useState({
        deliverySummary: null,
        unreadCount: null
    });

    // State for Permission Management
    const [permissions, setPermissions] = useState({
        allPermissions: [],
        permissionUsageSummary: [],
        permissionDependencies: {}
    });

    // State for Permission ↔ Role Mapping
    const [rolePermissions, setRolePermissions] = useState({
        permissionsByRole: {},
        rolesByPermission: {}
    });

    // State for Dashboard
    const [dashboard, setDashboard] = useState(null);

    // General State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);

    // Utility: Add operation logs
    const addLog = useCallback((message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setOperationLogs(prev => [
            { message, type, timestamp },
            ...prev.slice(0, 19) // Keep last 20 logs
        ]);
    }, []);

    // Utility: Clear error
    const clearError = useCallback(() => setError(null), []);

    // Utility: Clear operation logs
    const clearOperationLogs = useCallback(() => setOperationLogs([]), []);

    // Utility: Clear all data
    const clearAllData = useCallback(() => {
        setUserAccess({
            activeUsersCount: null,
            loggedInUsers: [],
            userRoleDistribution: null,
            userAccessSummary: null
        });
        setSessions({
            activeSessions: [],
            sessionSummary: null,
            deviceDistribution: []
        });
        setAdminLogs({
            adminActivityLogs: { logs: [], summary: {}, pagination: {} },
            recentAdminActions: null,
            criticalAdminActions: []
        });
        setSystemHealth({
            healthStatus: null,
            failedOperationsSummary: null,
            apiUsageOverview: null
        });
        setNotifications({
            deliverySummary: null,
            unreadCount: null
        });
        setPermissions({
            allPermissions: [],
            permissionUsageSummary: [],
            permissionDependencies: {}
        });
        setRolePermissions({
            permissionsByRole: {},
            rolesByPermission: {}
        });
        setDashboard(null);
        setError(null);
        setOperationLogs([]);
        addLog('All system data cleared', 'info');
    }, [addLog]);

    /* ===== USER & ACCESS MONITORING FUNCTIONS ===== */

    const fetchActiveUsersCount = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching active users count...', 'info');
        
        try {
            const result = await systemApi.getActiveUsersCount();
            if (result.success) {
                setUserAccess(prev => ({ ...prev, activeUsersCount: result.data }));
                addLog('Active users count fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch active users count: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch active users count';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch active users count error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchLoggedInUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching logged in users...', 'info');
        
        try {
            const result = await systemApi.getLoggedInUsers();
            if (result.success) {
                setUserAccess(prev => ({ ...prev, loggedInUsers: result.data }));
                addLog('Logged in users fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch logged in users: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch logged in users';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch logged in users error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchUserRoleDistribution = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching user role distribution...', 'info');
        
        try {
            const result = await systemApi.getUserRoleDistribution();
            if (result.success) {
                setUserAccess(prev => ({ ...prev, userRoleDistribution: result.data }));
                addLog('User role distribution fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch user role distribution: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch user role distribution';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch user role distribution error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    /* ===== SESSION & SECURITY FUNCTIONS ===== */

    const fetchActiveSessions = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching active sessions...', 'info');
        
        try {
            const result = await systemApi.getActiveSessions();
            if (result.success) {
                setSessions(prev => ({ ...prev, activeSessions: result.data }));
                addLog('Active sessions fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch active sessions: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch active sessions';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch active sessions error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchSessionActivitySummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching session activity summary...', 'info');
        
        try {
            const result = await systemApi.getSessionActivitySummary();
            if (result.success) {
                setSessions(prev => ({ ...prev, sessionSummary: result.data }));
                addLog('Session activity summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch session activity summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch session activity summary';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch session activity summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchDeviceLoginDistribution = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching device login distribution...', 'info');
        
        try {
            const result = await systemApi.getDeviceLoginDistribution();
            if (result.success) {
                setSessions(prev => ({ ...prev, deviceDistribution: result.data }));
                addLog('Device login distribution fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch device login distribution: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch device login distribution';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch device login distribution error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    /* ===== ADMIN & AUDIT LOGS FUNCTIONS ===== */

    const fetchAdminActivityLogs = useCallback(async (adminId = null, page = 1, size = 50) => {
        setLoading(true);
        setError(null);
        addLog('Fetching admin activity logs...', 'info');
        
        try {
            const result = await systemApi.getAdminActivityLogs(adminId, page, size);
            if (result.success) {
                setAdminLogs(prev => ({ ...prev, adminActivityLogs: result.data }));
                addLog('Admin activity logs fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch admin activity logs: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch admin activity logs';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch admin activity logs error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchRecentAdminActions = useCallback(async (hours = 24) => {
        setLoading(true);
        setError(null);
        addLog('Fetching recent admin actions...', 'info');
        
        try {
            const result = await systemApi.getRecentAdminActions(hours);
            if (result.success) {
                setAdminLogs(prev => ({ ...prev, recentAdminActions: result.data }));
                addLog('Recent admin actions fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch recent admin actions: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch recent admin actions';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch recent admin actions error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchCriticalAdminActions = useCallback(async (days = 7) => {
        setLoading(true);
        setError(null);
        addLog('Fetching critical admin actions...', 'info');
        
        try {
            const result = await systemApi.getCriticalAdminActions(days);
            if (result.success) {
                setAdminLogs(prev => ({ ...prev, criticalAdminActions: result.data }));
                addLog('Critical admin actions fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch critical admin actions: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch critical admin actions';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch critical admin actions error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    /* ===== APPLICATION HEALTH FUNCTIONS ===== */

    const fetchSystemHealthStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching system health status...', 'info');
        
        try {
            const result = await systemApi.getSystemHealthStatus();
            if (result.success) {
                setSystemHealth(prev => ({ ...prev, healthStatus: result.data }));
                addLog('System health status fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch system health status: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch system health status';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch system health status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchFailedOperationsSummary = useCallback(async (days = 7) => {
        setLoading(true);
        setError(null);
        addLog('Fetching failed operations summary...', 'info');
        
        try {
            const result = await systemApi.getFailedOperationsSummary(days);
            if (result.success) {
                setSystemHealth(prev => ({ ...prev, failedOperationsSummary: result.data }));
                addLog('Failed operations summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch failed operations summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch failed operations summary';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch failed operations summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchApiUsageOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching API usage overview...', 'info');
        
        try {
            const result = await systemApi.getApiUsageOverview();
            if (result.success) {
                setSystemHealth(prev => ({ ...prev, apiUsageOverview: result.data }));
                addLog('API usage overview fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch API usage overview: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch API usage overview';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch API usage overview error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    /* ===== NOTIFICATION STATUS FUNCTIONS ===== */

    const fetchNotificationDeliverySummary = useCallback(async (days = 7) => {
        setLoading(true);
        setError(null);
        addLog('Fetching notification delivery summary...', 'info');
        
        try {
            const result = await systemApi.getNotificationDeliverySummary(days);
            if (result.success) {
                setNotifications(prev => ({ ...prev, deliverySummary: result.data }));
                addLog('Notification delivery summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch notification delivery summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch notification delivery summary';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch notification delivery summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchUnreadNotificationsCount = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching unread notifications count...', 'info');
        
        try {
            const result = await systemApi.getUnreadNotificationsCount();
            if (result.success) {
                setNotifications(prev => ({ ...prev, unreadCount: result.data }));
                addLog('Unread notifications count fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch unread notifications count: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch unread notifications count';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch unread notifications count error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    /* ===== PERMISSION MANAGEMENT FUNCTIONS ===== */

    const fetchAllPermissions = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching all permissions...', 'info');
        
        try {
            const result = await systemApi.getAllPermissions();
            if (result.success) {
                setPermissions(prev => ({ ...prev, allPermissions: result.data }));
                addLog('All permissions fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch all permissions: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all permissions';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch all permissions error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchPermissionById = useCallback(async (permissionId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching permission ${permissionId}...`, 'info');
        
        try {
            const result = await systemApi.getPermissionById(permissionId);
            if (result.success) {
                addLog('Permission fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch permission: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch permission';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch permission error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const createPermission = useCallback(async (permissionData) => {
        setLoading(true);
        setError(null);
        addLog('Creating new permission...', 'info');
        
        try {
            const result = await systemApi.createPermission(permissionData);
            if (result.success) {
                // Refresh permissions list
                await fetchAllPermissions();
                addLog('Permission created successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to create permission: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to create permission';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Create permission error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchAllPermissions, addLog]);

    const updatePermission = useCallback(async (permissionId, updateData) => {
        setLoading(true);
        setError(null);
        addLog(`Updating permission ${permissionId}...`, 'info');
        
        try {
            const result = await systemApi.updatePermission(permissionId, updateData);
            if (result.success) {
                // Refresh permissions list
                await fetchAllPermissions();
                addLog('Permission updated successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to update permission: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update permission';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Update permission error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchAllPermissions, addLog]);

    const deletePermission = useCallback(async (permissionId) => {
        console.log('SystemContext: deletePermission called with permissionId:', permissionId);
        setLoading(true);
        setError(null);
        addLog(`Deleting permission ${permissionId}...`, 'info');
        
        try {
            const result = await systemApi.deletePermission(permissionId);
            if (result.success) {
                // Refresh permissions list
                await fetchAllPermissions();
                addLog('Permission deleted successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to delete permission: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to delete permission';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Delete permission error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchAllPermissions, addLog]);

    /* ===== PERMISSION USAGE & SAFETY FUNCTIONS ===== */

    const fetchPermissionUsageSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching permission usage summary...', 'info');
        
        try {
            const result = await systemApi.getPermissionUsageSummary();
            if (result.success) {
                setPermissions(prev => ({ ...prev, permissionUsageSummary: result.data }));
                addLog('Permission usage summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch permission usage summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch permission usage summary';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch permission usage summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const checkPermissionDependency = useCallback(async (permissionId) => {
        setLoading(true);
        setError(null);
        addLog(`Checking permission ${permissionId} dependency...`, 'info');
        
        try {
            const result = await systemApi.checkPermissionDependency(permissionId);
            if (result.success) {
                setPermissions(prev => ({
                    ...prev,
                    permissionDependencies: {
                        ...prev.permissionDependencies,
                        [permissionId]: result.data
                    }
                }));
                addLog('Permission dependency checked successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to check permission dependency: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to check permission dependency';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Check permission dependency error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    /* ===== PERMISSION ↔ ROLE MAPPING FUNCTIONS ===== */

    const assignPermissionToRole = useCallback(async (roleId, permissionId) => {
        setLoading(true);
        setError(null);
        addLog(`Assigning permission ${permissionId} to role ${roleId}...`, 'info');
        
        try {
            const result = await systemApi.assignPermissionToRole(roleId, permissionId);
            if (result.success) {
                addLog('Permission assigned to role successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to assign permission to role: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to assign permission to role';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Assign permission to role error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const removePermissionFromRole = useCallback(async (roleId, permissionId) => {
        setLoading(true);
        setError(null);
        addLog(`Removing permission ${permissionId} from role ${roleId}...`, 'info');
        
        try {
            const result = await systemApi.removePermissionFromRole(roleId, permissionId);
            if (result.success) {
                addLog('Permission removed from role successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to remove permission from role: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to remove permission from role';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Remove permission from role error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchPermissionsByRole = useCallback(async (roleId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching permissions for role ${roleId}...`, 'info');
        
        try {
            const result = await systemApi.getPermissionsByRole(roleId);
            if (result.success) {
                setRolePermissions(prev => ({
                    ...prev,
                    permissionsByRole: { ...prev.permissionsByRole, [roleId]: result.data }
                }));
                addLog('Permissions by role fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch permissions by role: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch permissions by role';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch permissions by role error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchRolesByPermission = useCallback(async (permissionId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching roles for permission ${permissionId}...`, 'info');
        
        try {
            const result = await systemApi.getRolesByPermission(permissionId);
            if (result.success) {
                setRolePermissions(prev => ({
                    ...prev,
                    rolesByPermission: { ...prev.rolesByPermission, [permissionId]: result.data }
                }));
                addLog('Roles by permission fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch roles by permission: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch roles by permission';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch roles by permission error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    /* ===== DASHBOARD & HEALTH CHECK FUNCTIONS ===== */

    const fetchSystemDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching system dashboard...', 'info');
        
        try {
            const result = await systemApi.getSystemDashboard();
            if (result.success) {
                setDashboard(result.data);
                addLog('System dashboard fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`Failed to fetch system dashboard: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch system dashboard';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('Fetch system dashboard error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const fetchSystemHealthCheck = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Performing system health check...', 'info');
        
        try {
            const result = await systemApi.getSystemHealthCheck();
            if (result.success) {
                addLog('System health check completed successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`System health check failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to perform system health check';
            setError(errorMsg);
            addLog(errorMsg, 'error');
            console.error('System health check error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    /* ===== BATCH OPERATIONS ===== */

    const fetchAllSystemData = useCallback(async () => {
        addLog('Fetching all system data...', 'info');
        
        const results = {};
        
        // User & Access Monitoring
        results.activeUsersCount = await fetchActiveUsersCount();
        results.loggedInUsers = await fetchLoggedInUsers();
        results.userRoleDistribution = await fetchUserRoleDistribution();
        
        // Session & Security
        results.activeSessions = await fetchActiveSessions();
        results.sessionSummary = await fetchSessionActivitySummary();
        results.deviceDistribution = await fetchDeviceLoginDistribution();
        
        // System Health
        results.healthStatus = await fetchSystemHealthStatus();
        results.apiUsage = await fetchApiUsageOverview();
        
        // Notifications
        results.notificationSummary = await fetchNotificationDeliverySummary();
        results.unreadCount = await fetchUnreadNotificationsCount();
        
        // Dashboard
        results.dashboard = await fetchSystemDashboard();
        
        addLog('All system data fetched', 'success');
        return results;
    }, [
        fetchActiveUsersCount, fetchLoggedInUsers, fetchUserRoleDistribution,
        fetchActiveSessions, fetchSessionActivitySummary, fetchDeviceLoginDistribution,
        fetchSystemHealthStatus, fetchApiUsageOverview,
        fetchNotificationDeliverySummary, fetchUnreadNotificationsCount,
        fetchSystemDashboard, addLog
    ]);

    const value = {
        // State
        userAccess,
        sessions,
        adminLogs,
        systemHealth,
        notifications,
        permissions,
        rolePermissions,
        dashboard,
        loading,
        error,
        operationLogs,
        
        // User & Access Monitoring Functions
        fetchActiveUsersCount,
        fetchLoggedInUsers,
        fetchUserRoleDistribution,
        
        // Session & Security Functions
        fetchActiveSessions,
        fetchSessionActivitySummary,
        fetchDeviceLoginDistribution,
        
        // Admin & Audit Logs Functions
        fetchAdminActivityLogs,
        fetchRecentAdminActions,
        fetchCriticalAdminActions,
        
        // Application Health Functions
        fetchSystemHealthStatus,
        fetchFailedOperationsSummary,
        fetchApiUsageOverview,
        
        // Notification Status Functions
        fetchNotificationDeliverySummary,
        fetchUnreadNotificationsCount,
        
        // Permission Management Functions
        fetchAllPermissions,
        fetchPermissionById,
        createPermission,
        updatePermission,
        deletePermission,
        
        // Permission Usage & Safety Functions
        fetchPermissionUsageSummary,
        checkPermissionDependency,
        
        // Permission ↔ Role Mapping Functions
        assignPermissionToRole,
        removePermissionFromRole,
        fetchPermissionsByRole,
        fetchRolesByPermission,
        
        // Dashboard & Health Check Functions
        fetchSystemDashboard,
        fetchSystemHealthCheck,
        
        // Batch Operations
        fetchAllSystemData,
        
        // Utility Functions
        clearError,
        clearOperationLogs,
        clearAllData,
        addLog
    };

    return (
        <SystemContext.Provider value={value}>
            {children}
        </SystemContext.Provider>
    );
};