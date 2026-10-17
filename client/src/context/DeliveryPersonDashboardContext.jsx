import React, { createContext, useContext, useState, useCallback } from 'react';
import * as deliveryApi from '../api/dp_dashboard';

const DeliveryDashboardContext = createContext();

export const useDeliveryDashboardContext = () => {
    const context = useContext(DeliveryDashboardContext);
    if (!context) {
        throw new Error('useDeliveryDashboardContext must be used within DeliveryDashboardProvider');
    }
    return context;
};

export const DeliveryDashboardProvider = ({ children }) => {
    // State
    const [dashboardStats, setDashboardStats] = useState(null);
    const [activeDeliveries, setActiveDeliveries] = useState([]);
    const [earningsOverview, setEarningsOverview] = useState(null);
    const [todaySchedule, setTodaySchedule] = useState(null);
    const [performanceMetrics, setPerformanceMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);

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
        setDashboardStats(null);
        setActiveDeliveries([]);
        setEarningsOverview(null);
        setTodaySchedule(null);
        setPerformanceMetrics(null);
        setOperationLogs([]);
        setError(null);
        addLog('All data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Operation logs cleared', 'info');
    }, [addLog]);

    // ===== DASHBOARD STATISTICS =====
    const fetchDashboardStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching dashboard statistics...', 'test');

        try {
            const result = await deliveryApi.fetchDashboardStats();
            if (result.success) {
                setDashboardStats(result.data);
                addLog('✅ Dashboard stats fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch dashboard stats: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch dashboard stats';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch dashboard stats error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== ACTIVE DELIVERIES =====
    const fetchActiveDeliveries = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching active deliveries...', 'test');

        try {
            const result = await deliveryApi.fetchActiveDeliveries();
            if (result.success) {
                setActiveDeliveries(result.data.active_orders || []);
                addLog(`✅ Active deliveries fetched: ${result.data.active_orders?.length || 0} orders`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch active deliveries: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch active deliveries';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch active deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== EARNINGS OVERVIEW =====
    const fetchEarningsOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching earnings overview...', 'test');

        try {
            const result = await deliveryApi.fetchEarningsOverview();
            if (result.success) {
                setEarningsOverview(result.data);
                addLog('✅ Earnings overview fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch earnings overview: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch earnings overview';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch earnings overview error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== TODAY'S SCHEDULE =====
    const fetchTodaySchedule = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching today\'s schedule...', 'test');

        try {
            const result = await deliveryApi.fetchTodaySchedule();
            if (result.success) {
                setTodaySchedule(result.data);
                addLog('✅ Today\'s schedule fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch today\'s schedule: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch today\'s schedule';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch today schedule error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== DELIVERY ACTIONS =====
    const markAsPicked = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        addLog(`Marking order ${orderId} as picked...`, 'info');

        try {
            const result = await deliveryApi.markDeliveryAsPicked(orderId);
            if (result.success) {
                addLog(`✅ Order ${orderId} marked as picked successfully`, 'success');
                // Refresh active deliveries
                await fetchActiveDeliveries();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to mark order as picked: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = `Failed to mark order ${orderId} as picked`;
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Mark as picked error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchActiveDeliveries, addLog]);

    const markAsDelivered = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        addLog(`Marking order ${orderId} as delivered...`, 'info');

        try {
            const result = await deliveryApi.markDeliveryAsDelivered(orderId);
            if (result.success) {
                addLog(`✅ Order ${orderId} marked as delivered successfully`, 'success');
                // Refresh active deliveries and dashboard stats
                await fetchActiveDeliveries();
                await fetchDashboardStats();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to mark order as delivered: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = `Failed to mark order ${orderId} as delivered`;
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Mark as delivered error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchActiveDeliveries, fetchDashboardStats, addLog]);

    // ===== QUICK ACTIONS =====


    const reportIssue = useCallback(async (orderId, issueType, description, priority = "MEDIUM") => {
        setLoading(true);
        setError(null);
        addLog(`Reporting issue for order ${orderId}...`, 'info');

        try {
            const result = await deliveryApi.reportDeliveryIssue(orderId, issueType, description, priority);
            if (result.success) {
                addLog('✅ Issue reported successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to report issue: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to report issue';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Report issue error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PERFORMANCE METRICS =====
    const fetchPerformanceMetrics = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching performance metrics...', 'test');

        try {
            const result = await deliveryApi.fetchPerformanceMetrics();
            if (result.success) {
                setPerformanceMetrics(result.data.data || result.data);
                addLog('✅ Performance metrics fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch performance metrics: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch performance metrics';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch performance metrics error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== BATCH OPERATIONS =====
    const fetchAllDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching all dashboard data...', 'test');

        try {
            const results = await Promise.all([
                fetchDashboardStats(),
                fetchActiveDeliveries(),
                fetchEarningsOverview(),
                fetchTodaySchedule(),
                fetchPerformanceMetrics()
            ]);

            const allSuccess = results.every(result => result.success);

            if (allSuccess) {
                addLog('✅ All dashboard data fetched successfully', 'success');
                return { success: true, message: 'All data fetched successfully' };
            } else {
                const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
                setError(`Some data failed to load: ${errorMessages}`);
                addLog(`⚠️ Some data failed to load: ${errorMessages}`, 'warning');
                return { success: false, message: errorMessages };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all dashboard data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [
        fetchDashboardStats,
        fetchActiveDeliveries,
        fetchEarningsOverview,
        fetchTodaySchedule,
        fetchPerformanceMetrics,
        addLog
    ]);

    // ===== HEALTH CHECK =====
    const checkDashboardHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Checking dashboard health...', 'test');

        try {
            const result = await deliveryApi.checkDeliveryDashboardHealth();
            if (result.success) {
                addLog('✅ Delivery dashboard is healthy', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Dashboard health check failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to check dashboard health';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Health check error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const value = {
        // State
        dashboardStats,
        activeDeliveries,
        earningsOverview,
        todaySchedule,
        performanceMetrics,
        loading,
        error,
        operationLogs,

        // Dashboard Functions
        fetchDashboardStats,
        fetchActiveDeliveries,
        fetchEarningsOverview,
        fetchTodaySchedule,
        fetchPerformanceMetrics,

        // Delivery Actions
        markAsPicked,
        markAsDelivered,

        // Quick Actions

        reportIssue,

        // Batch Operations
        fetchAllDashboardData,

        // Health Check
        checkDashboardHealth,

        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog
    };

    return (
        <DeliveryDashboardContext.Provider value={value}>
            {children}
        </DeliveryDashboardContext.Provider>
    );
};