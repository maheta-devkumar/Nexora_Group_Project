import React, { createContext, useContext, useState, useCallback } from 'react';
import * as completedApi from '../../api/delivery_panel/completed_deliveries';

const CompletedDeliveriesContext = createContext();

export const useCompletedDeliveriesContext = () => {
    const context = useContext(CompletedDeliveriesContext);
    if (!context) {
        throw new Error('useCompletedDeliveriesContext must be used within CompletedDeliveriesProvider');
    }
    return context;
};

export const CompletedDeliveriesProvider = ({ children }) => {
    // State
    const [completedDeliveries, setCompletedDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [summaryStatistics, setSummaryStatistics] = useState(null);
    const [todayDeliveries, setTodayDeliveries] = useState([]);
    const [weekDeliveries, setWeekDeliveries] = useState([]);
    const [monthDeliveries, setMonthDeliveries] = useState([]);
    const [deliveriesByDateRange, setDeliveriesByDateRange] = useState([]);
    const [proofOfDelivery, setProofOfDelivery] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);
    const [filters, setFilters] = useState({
        start_date: null,
        end_date: null,
        period: null,
        status: null,
        min_earning: null,
        max_earning: null,
        page: 1,
        per_page: 20
    });

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
        setCompletedDeliveries([]);
        setSelectedDelivery(null);
        setSummaryStatistics(null);
        setTodayDeliveries([]);
        setWeekDeliveries([]);
        setMonthDeliveries([]);
        setDeliveriesByDateRange([]);
        setProofOfDelivery(null);
        setOperationLogs([]);
        setError(null);
        setFilters({
            start_date: null,
            end_date: null,
            period: null,
            status: null,
            min_earning: null,
            max_earning: null,
            page: 1,
            per_page: 20
        });
        addLog('All completed deliveries data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Operation logs cleared', 'info');
    }, [addLog]);

    // Update filters
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        addLog(`Filters updated: ${JSON.stringify(newFilters)}`, 'info');
    }, [addLog]);

    // ===== COMPLETED DELIVERIES =====
    const fetchCompletedDeliveries = useCallback(async (customFilters = null) => {
        setLoading(true);
        setError(null);
        addLog('Fetching completed deliveries...', 'test');
        
        try {
            const activeFilters = customFilters || filters;
            const result = await completedApi.fetchCompletedDeliveries(activeFilters);
            if (result.success) {
                setCompletedDeliveries(result.data.data || []);
                addLog(`✅ Completed deliveries fetched: ${result.data.data?.length || 0} deliveries`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch completed deliveries: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch completed deliveries';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch completed deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [filters, addLog]);

    // ===== SINGLE DELIVERY DETAIL =====
    const fetchCompletedDeliveryDetail = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching delivery details for ID: ${deliveryId}...`, 'test');
        
        try {
            const result = await completedApi.fetchCompletedDeliveryDetail(deliveryId);
            if (result.success) {
                setSelectedDelivery(result.data.data);
                addLog('✅ Delivery details fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch delivery details: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch delivery details';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch delivery detail error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PROOF OF DELIVERY =====
    const fetchProofOfDelivery = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching proof of delivery for ID: ${deliveryId}...`, 'test');
        
        try {
            const result = await completedApi.fetchProofOfDelivery(deliveryId);
            if (result.success) {
                setProofOfDelivery(result.data.data);
                addLog('✅ Proof of Delivery fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch Proof of Delivery: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch Proof of Delivery';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch POD error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== SUMMARY STATISTICS =====
    const fetchSummaryStatistics = useCallback(async (customFilters = null) => {
        setLoading(true);
        setError(null);
        addLog('Fetching summary statistics...', 'test');
        
        try {
            const { start_date, end_date, period } = customFilters || filters;
            const result = await completedApi.fetchSummaryStatistics({ start_date, end_date, period });
            if (result.success) {
                setSummaryStatistics(result.data.data);
                addLog('✅ Summary statistics fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch summary statistics: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch summary statistics';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch summary statistics error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [filters, addLog]);

    // ===== TODAY'S DELIVERIES =====
    const fetchTodayCompletedDeliveries = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog("Fetching today's completed deliveries...", 'test');
        
        try {
            const result = await completedApi.fetchTodayCompletedDeliveries();
            if (result.success) {
                setTodayDeliveries(result.data.data || []);
                addLog(`✅ Today's deliveries fetched: ${result.data.data?.length || 0} deliveries`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch today's deliveries: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = "Failed to fetch today's deliveries";
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch today deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== WEEK'S DELIVERIES =====
    const fetchWeekCompletedDeliveries = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog("Fetching week's completed deliveries...", 'test');
        
        try {
            const result = await completedApi.fetchWeekCompletedDeliveries();
            if (result.success) {
                setWeekDeliveries(result.data.data || []);
                addLog(`✅ Week's deliveries fetched: ${result.data.data?.length || 0} deliveries`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch week's deliveries: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = "Failed to fetch week's deliveries";
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch week deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== MONTH'S DELIVERIES =====
    const fetchMonthCompletedDeliveries = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog("Fetching month's completed deliveries...", 'test');
        
        try {
            const result = await completedApi.fetchMonthCompletedDeliveries();
            if (result.success) {
                setMonthDeliveries(result.data.data || []);
                addLog(`✅ Month's deliveries fetched: ${result.data.data?.length || 0} deliveries`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch month's deliveries: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = "Failed to fetch month's deliveries";
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch month deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== DATE RANGE DELIVERIES =====
    const fetchDeliveriesByDateRange = useCallback(async (startDate, endDate) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching deliveries from ${startDate} to ${endDate}...`, 'test');
        
        try {
            const result = await completedApi.fetchDeliveriesByDateRange(startDate, endDate);
            if (result.success) {
                setDeliveriesByDateRange(result.data.data || []);
                addLog(`✅ Date range deliveries fetched: ${result.data.data?.length || 0} deliveries`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch date range deliveries: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch date range deliveries';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch date range deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== BATCH OPERATIONS =====
    const fetchAllCompletedDeliveryData = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching all completed delivery data...', 'test');
        
        try {
            const results = await Promise.all([
                fetchCompletedDeliveries(),
                fetchSummaryStatistics(),
                fetchTodayCompletedDeliveries(),
                fetchWeekCompletedDeliveries(),
                fetchMonthCompletedDeliveries()
            ]);
            
            const allSuccess = results.every(result => result.success);
            
            if (allSuccess) {
                addLog('✅ All completed delivery data fetched successfully', 'success');
                return { success: true, message: 'All data fetched successfully' };
            } else {
                const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
                setError(`Some data failed to load: ${errorMessages}`);
                addLog(`⚠️ Some data failed to load: ${errorMessages}`, 'warning');
                return { success: false, message: errorMessages };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all completed delivery data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all completed delivery data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [
        fetchCompletedDeliveries,
        fetchSummaryStatistics,
        fetchTodayCompletedDeliveries,
        fetchWeekCompletedDeliveries,
        fetchMonthCompletedDeliveries,
        addLog
    ]);

    // ===== HEALTH CHECK =====
    const checkCompletedDeliveriesHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Checking completed deliveries API health...', 'test');
        
        try {
            const result = await completedApi.checkCompletedDeliveriesHealth();
            if (result.success) {
                addLog('✅ Completed deliveries API is healthy', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Completed deliveries API health check failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to check completed deliveries API health';
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
        completedDeliveries,
        selectedDelivery,
        summaryStatistics,
        todayDeliveries,
        weekDeliveries,
        monthDeliveries,
        deliveriesByDateRange,
        proofOfDelivery,
        loading,
        error,
        operationLogs,
        filters,
        
        // Fetch Functions
        fetchCompletedDeliveries,
        fetchCompletedDeliveryDetail,
        fetchProofOfDelivery,
        fetchSummaryStatistics,
        fetchTodayCompletedDeliveries,
        fetchWeekCompletedDeliveries,
        fetchMonthCompletedDeliveries,
        fetchDeliveriesByDateRange,
        
        // Batch Operations
        fetchAllCompletedDeliveryData,
        
        // Health Check
        checkCompletedDeliveriesHealth,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog,
        updateFilters,
        setSelectedDelivery
    };

    return (
        <CompletedDeliveriesContext.Provider value={value}>
            {children}
        </CompletedDeliveriesContext.Provider>
    );
};