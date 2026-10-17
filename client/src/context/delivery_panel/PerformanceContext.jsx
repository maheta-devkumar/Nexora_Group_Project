// src/context/delivery_panel/PerformanceContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as performanceApi from '../../api/delivery_panel/performance';

const PerformanceContext = createContext();

export const usePerformanceContext = () => {
    const context = useContext(PerformanceContext);
    if (!context) {
        throw new Error('usePerformanceContext must be used within PerformanceProvider');
    }
    return context;
};

export const PerformanceProvider = ({ children }) => {
    // State
    const [performanceMetrics, setPerformanceMetrics] = useState(null);
    const [performanceCharts, setPerformanceCharts] = useState(null);
    const [ratingHistory, setRatingHistory] = useState(null);
    const [performanceBadges, setPerformanceBadges] = useState(null);
    const [performanceTrends, setPerformanceTrends] = useState(null);
    const [peerComparison, setPeerComparison] = useState(null);
    const [detailedRecords, setDetailedRecords] = useState(null);
    const [periodSummary, setPeriodSummary] = useState(null);
    const [achievementMilestones, setAchievementMilestones] = useState(null);
    const [completeData, setCompleteData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('last_7_days');
    const [selectedGroupBy, setSelectedGroupBy] = useState('day');
    const [selectedDateRange, setSelectedDateRange] = useState({
        start_date: null,
        end_date: null
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
        setPerformanceMetrics(null);
        setPerformanceCharts(null);
        setRatingHistory(null);
        setPerformanceBadges(null);
        setPerformanceTrends(null);
        setPeerComparison(null);
        setDetailedRecords(null);
        setPeriodSummary(null);
        setAchievementMilestones(null);
        setCompleteData(null);
        setOperationLogs([]);
        setError(null);
        addLog('All performance data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Performance operation logs cleared', 'info');
    }, [addLog]);

    // Update period
    const updatePeriod = useCallback((period) => {
        setSelectedPeriod(period);
        addLog(`Performance period updated to: ${period}`, 'info');
    }, [addLog]);

    // Update date range
    const updateDateRange = useCallback((startDate, endDate) => {
        setSelectedDateRange({ start_date: startDate, end_date: endDate });
        addLog(`Date range updated: ${startDate} to ${endDate}`, 'info');
    }, [addLog]);

    // Update group by
    const updateGroupBy = useCallback((groupBy) => {
        setSelectedGroupBy(groupBy);
        addLog(`Chart grouping updated to: ${groupBy}`, 'info');
    }, [addLog]);

    // ===== HEALTH CHECK =====
    const checkPerformanceHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Checking performance module health...', 'test');
        
        try {
            const result = await performanceApi.checkPerformanceHealth();
            if (result.success) {
                addLog('✅ Performance module is healthy', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Performance health check failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to check performance health';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Performance health check error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PERFORMANCE METRICS =====
    const fetchPerformanceMetrics = useCallback(async (period = null, startDate = null, endDate = null) => {
        setLoading(true);
        setError(null);
        const effectivePeriod = period || selectedPeriod;
        const effectiveStartDate = startDate || selectedDateRange.start_date;
        const effectiveEndDate = endDate || selectedDateRange.end_date;
        
        addLog(`Fetching performance metrics (${effectivePeriod})...`, 'test');
        
        try {
            const result = await performanceApi.fetchPerformanceMetrics(effectivePeriod, effectiveStartDate, effectiveEndDate);
            if (result.success) {
                setPerformanceMetrics(result.data);
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
    }, [selectedPeriod, selectedDateRange, addLog]);

    // ===== PERFORMANCE CHARTS =====
    const fetchPerformanceCharts = useCallback(async (period = null, startDate = null, endDate = null, groupBy = null) => {
        setLoading(true);
        setError(null);
        const effectivePeriod = period || selectedPeriod;
        const effectiveStartDate = startDate || selectedDateRange.start_date;
        const effectiveEndDate = endDate || selectedDateRange.end_date;
        const effectiveGroupBy = groupBy || selectedGroupBy;
        
        addLog(`Fetching performance charts (${effectivePeriod}, group by ${effectiveGroupBy})...`, 'test');
        
        try {
            const result = await performanceApi.fetchPerformanceCharts(
                effectivePeriod, effectiveStartDate, effectiveEndDate, effectiveGroupBy
            );
            if (result.success) {
                setPerformanceCharts(result.data);
                addLog('✅ Performance charts fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch performance charts: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch performance charts';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch performance charts error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, selectedDateRange, selectedGroupBy, addLog]);

    // ===== RATING HISTORY =====
    const fetchRatingHistory = useCallback(async (period = null, startDate = null, endDate = null, limit = 50, offset = 0) => {
        setLoading(true);
        setError(null);
        const effectivePeriod = period || selectedPeriod;
        const effectiveStartDate = startDate || selectedDateRange.start_date;
        const effectiveEndDate = endDate || selectedDateRange.end_date;
        
        addLog(`Fetching rating history (${effectivePeriod}, limit: ${limit})...`, 'test');
        
        try {
            const result = await performanceApi.fetchRatingHistory(
                effectivePeriod, effectiveStartDate, effectiveEndDate, limit, offset
            );
            if (result.success) {
                setRatingHistory(result.data);
                addLog(`✅ Rating history fetched: ${result.data.ratings?.length || 0} ratings`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch rating history: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch rating history';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch rating history error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, selectedDateRange, addLog]);

    // ===== PERFORMANCE BADGES =====
    const fetchPerformanceBadges = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching performance badges...', 'test');
        
        try {
            const result = await performanceApi.fetchPerformanceBadges();
            if (result.success) {
                setPerformanceBadges(result.data);
                addLog(`✅ Performance badges fetched: ${result.data.earned_badges || 0} earned`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch performance badges: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch performance badges';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch performance badges error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PERFORMANCE TRENDS =====
    const fetchPerformanceTrends = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching performance trends...', 'test');
        
        try {
            const result = await performanceApi.fetchPerformanceTrends();
            if (result.success) {
                setPerformanceTrends(result.data);
                addLog('✅ Performance trends fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch performance trends: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch performance trends';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch performance trends error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PEER COMPARISON =====
    const fetchPeerComparison = useCallback(async (period = null, startDate = null, endDate = null) => {
        setLoading(true);
        setError(null);
        const effectivePeriod = period || selectedPeriod;
        const effectiveStartDate = startDate || selectedDateRange.start_date;
        const effectiveEndDate = endDate || selectedDateRange.end_date;
        
        addLog(`Fetching peer comparison (${effectivePeriod})...`, 'test');
        
        try {
            const result = await performanceApi.fetchPeerComparison(
                effectivePeriod, effectiveStartDate, effectiveEndDate
            );
            if (result.success) {
                setPeerComparison(result.data);
                addLog('✅ Peer comparison fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch peer comparison: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch peer comparison';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch peer comparison error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, selectedDateRange, addLog]);

    // ===== DETAILED DELIVERY RECORDS =====
    const fetchDetailedDeliveryRecords = useCallback(async (period = null, startDate = null, endDate = null, status = null, page = 1, pageSize = 50) => {
        setLoading(true);
        setError(null);
        const effectivePeriod = period || selectedPeriod;
        const effectiveStartDate = startDate || selectedDateRange.start_date;
        const effectiveEndDate = endDate || selectedDateRange.end_date;
        
        addLog(`Fetching detailed delivery records (${effectivePeriod}, page: ${page})...`, 'test');
        
        try {
            const result = await performanceApi.fetchDetailedDeliveryRecords(
                effectivePeriod, effectiveStartDate, effectiveEndDate, status, page, pageSize
            );
            if (result.success) {
                setDetailedRecords(result.data);
                addLog(`✅ Delivery records fetched: ${result.data.deliveries?.length || 0} records`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch delivery records: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch delivery records';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch delivery records error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, selectedDateRange, addLog]);

    // ===== PERIOD SUMMARY =====
    const fetchPeriodSummary = useCallback(async (periodType = 'monthly', months = 6) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching ${periodType} summary (${months} periods)...`, 'test');
        
        try {
            const result = await performanceApi.fetchPeriodSummary(periodType, months);
            if (result.success) {
                setPeriodSummary(result.data);
                addLog(`✅ ${periodType} summary fetched: ${result.data.summaries?.length || 0} periods`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch period summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch period summary';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch period summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== ACHIEVEMENT MILESTONES =====
    const fetchAchievementMilestones = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching achievement milestones...', 'test');
        
        try {
            const result = await performanceApi.fetchAchievementMilestones();
            if (result.success) {
                setAchievementMilestones(result.data);
                addLog(`✅ Achievement milestones fetched: ${result.data.milestones?.length || 0} milestones`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch achievement milestones: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch achievement milestones';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch achievement milestones error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== COMPLETE PERFORMANCE DATA =====
    const fetchCompletePerformanceData = useCallback(async (period = null, startDate = null, endDate = null) => {
        setLoading(true);
        setError(null);
        const effectivePeriod = period || selectedPeriod;
        const effectiveStartDate = startDate || selectedDateRange.start_date;
        const effectiveEndDate = endDate || selectedDateRange.end_date;
        
        addLog(`Fetching complete performance data (${effectivePeriod})...`, 'test');
        
        try {
            const result = await performanceApi.fetchCompletePerformanceData(
                effectivePeriod, effectiveStartDate, effectiveEndDate
            );
            if (result.success) {
                setCompleteData(result.data);
                addLog('✅ Complete performance data fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch complete performance data: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch complete performance data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch complete performance data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, selectedDateRange, addLog]);

    // ===== BATCH OPERATIONS =====
    const fetchAllPerformanceData = useCallback(async (period = null, startDate = null, endDate = null) => {
        setLoading(true);
        setError(null);
        const effectivePeriod = period || selectedPeriod;
        const effectiveStartDate = startDate || selectedDateRange.start_date;
        const effectiveEndDate = endDate || selectedDateRange.end_date;
        
        addLog(`Fetching all performance data (${effectivePeriod})...`, 'test');
        
        try {
            const results = await Promise.all([
                fetchPerformanceMetrics(effectivePeriod, effectiveStartDate, effectiveEndDate),
                fetchPerformanceCharts(effectivePeriod, effectiveStartDate, effectiveEndDate, selectedGroupBy),
                fetchPerformanceBadges(),
                fetchRatingHistory(effectivePeriod, effectiveStartDate, effectiveEndDate, 10, 0),
                fetchPerformanceTrends(),
                fetchPeerComparison(effectivePeriod, effectiveStartDate, effectiveEndDate),
            ]);
            
            const allSuccess = results.every(result => result.success);
            
            if (allSuccess) {
                addLog('✅ All performance data fetched successfully', 'success');
                return { success: true, message: 'All performance data fetched successfully' };
            } else {
                const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
                setError(`Some data failed to load: ${errorMessages}`);
                addLog(`⚠️ Some data failed to load: ${errorMessages}`, 'warning');
                return { success: false, message: errorMessages };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all performance data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all performance data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [
        selectedPeriod, 
        selectedDateRange, 
        selectedGroupBy,
        fetchPerformanceMetrics, 
        fetchPerformanceCharts, 
        fetchPerformanceBadges, 
        fetchRatingHistory, 
        fetchPerformanceTrends, 
        fetchPeerComparison, 
        addLog
    ]);

    const value = {
        // State
        performanceMetrics,
        performanceCharts,
        ratingHistory,
        performanceBadges,
        performanceTrends,
        peerComparison,
        detailedRecords,
        periodSummary,
        achievementMilestones,
        completeData,
        loading,
        error,
        operationLogs,
        selectedPeriod,
        selectedGroupBy,
        selectedDateRange,
        
        // Fetch Functions
        fetchPerformanceMetrics,
        fetchPerformanceCharts,
        fetchRatingHistory,
        fetchPerformanceBadges,
        fetchPerformanceTrends,
        fetchPeerComparison,
        fetchDetailedDeliveryRecords,
        fetchPeriodSummary,
        fetchAchievementMilestones,
        fetchCompletePerformanceData,
        
        // Batch Operations
        fetchAllPerformanceData,
        
        // Health Check
        checkPerformanceHealth,
        
        // Configuration Functions
        updatePeriod,
        updateDateRange,
        updateGroupBy,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog
    };

    return (
        <PerformanceContext.Provider value={value}>
            {children}
        </PerformanceContext.Provider>
    );
};