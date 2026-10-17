import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as accountApi from '../api/account';
import { useAuth } from './AuthContext';

const AccountContext = createContext();

export const useAccountContext = () => {
    const context = useContext(AccountContext);
    if (!context) {
        throw new Error('useAccountContext must be used within AccountProvider');
    }
    return context;
};

export const AccountProvider = ({ children }) => {
    // Auth context
    const { isAuthenticated, serverStatus, logout, user } = useAuth();
    
    // State
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);

    // Check if user is admin or delivery
    const isAdminUser = !!(user && Array.isArray(user.roles) && user.roles.includes('admin'));
    const isDeliveryUser = !!(user && Array.isArray(user.roles) && user.roles.includes('delivery'));

    // Utility function to add logs
    const addLog = useCallback((message, type = 'info') => {
        const log = {
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        setOperationLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, []);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setDashboard(null);
        setOperationLogs([]);
        setError(null);
        addLog('All account data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Account operation logs cleared', 'info');
    }, [addLog]);

    // ===== FETCH DASHBOARD =====
    const fetchDashboard = useCallback(async () => {
        // Skip if not authenticated or server is offline
        if (!isAuthenticated || serverStatus !== 'online') {
            addLog('Skipping dashboard fetch: Not authenticated or server offline', 'warning');
            return { success: false, message: 'Not authenticated or server offline' };
        }

        // Skip for admin or delivery users
        if (isAdminUser || isDeliveryUser) {
            addLog('Skipping customer dashboard fetch for admin/delivery user', 'info');
            return { success: false, message: 'Not a customer account' };
        }

        setLoading(true);
        setError(null);
        addLog('Fetching account dashboard...', 'info');
        
        try {
            const result = await accountApi.fetchDashboard();
            if (result.success) {
                const dashboardData = result.data?.data ?? result.data;
                setDashboard(dashboardData);
                addLog('✅ Account dashboard fetched successfully', 'success');
                return { success: true, data: dashboardData };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch dashboard: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch dashboard data';

            // Handle 404 error specifically
            if (status === 404) {
                errorMsg = 'Dashboard endpoint not found';
                addLog(`❌ ${errorMsg}`, 'error');
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors - use logout for 404 as requested
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                logout();
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch dashboard error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, serverStatus, isAdminUser, isDeliveryUser, logout, addLog]);

    // ===== FETCH DASHBOARD TEST =====
    const fetchDashboardTest = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching dashboard test data...', 'info');
        
        try {
            const result = await accountApi.fetchDashboardTest();
            if (result.success) {
                const dashboardData = result.data?.data ?? result.data;
                addLog('✅ Dashboard test data fetched successfully', 'success');
                return { success: true, data: dashboardData };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch dashboard test: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch dashboard test data';

            // Handle 404 error specifically
            if (status === 404) {
                errorMsg = 'Dashboard test endpoint not found';
                addLog(`❌ ${errorMsg}`, 'error');
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors - use logout for 404 as requested
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                logout();
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch dashboard test error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [logout, addLog]);

    // Auto-fetch dashboard on mount when authenticated
    useEffect(() => {
        if (isAuthenticated && serverStatus === 'online') {
            fetchDashboard();
        }
    }, [isAuthenticated, serverStatus, fetchDashboard]);

    const value = {
        // State
        dashboard,
        loading,
        error,
        operationLogs,
        
        // Fetch Functions
        fetchDashboard,
        fetchDashboardTest,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog
    };

    return (
        <AccountContext.Provider value={value}>
            {children}
        </AccountContext.Provider>
    );
};