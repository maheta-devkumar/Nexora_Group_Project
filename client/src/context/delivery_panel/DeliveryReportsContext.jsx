// src/context/delivery_panel/DeliveryReportsContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as reportsApi from '../../api/delivery_panel/reports';

const DeliveryReportsContext = createContext();

export const useDeliveryReportsContext = () => {
    const context = useContext(DeliveryReportsContext);
    if (!context) {
        throw new Error('useDeliveryReportsContext must be used within DeliveryReportsProvider');
    }
    return context;
};

export const DeliveryReportsProvider = ({ children }) => {
    // State
    const [reportsData, setReportsData] = useState(null);
    const [summaryData, setSummaryData] = useState(null);
    const [trendData, setTrendData] = useState(null);
    const [ordersData, setOrdersData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        range: 'overall',
        startDate: null,
        endDate: null,
        status: null,
        limit: 100
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
    const clearError = useCallback(() => {
        setError(null);
        setExportSuccess(false);
    }, []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setReportsData(null);
        setSummaryData(null);
        setTrendData(null);
        setOrdersData([]);
        setOperationLogs([]);
        setError(null);
        setExportSuccess(false);
        addLog('All reports data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Operation logs cleared', 'info');
    }, [addLog]);

    // Update filters
    const updateFilters = useCallback((newFilters) => {
        setActiveFilters(prev => ({ ...prev, ...newFilters }));
        addLog(`Filters updated: ${JSON.stringify(newFilters)}`, 'info');
    }, [addLog]);

    // ===== GET DELIVERY REPORTS =====
    const fetchDeliveryReports = useCallback(async (customFilters = {}) => {
        setLoading(true);
        setError(null);

        const filters = { ...activeFilters, ...customFilters };
        addLog(`Fetching delivery reports with filters: ${JSON.stringify(filters)}`, 'info');

        try {
            const result = await reportsApi.getDeliveryReports(filters);
            if (result.success) {
                setReportsData(result.data);
                setReportsData(result.data);

                // Also populate individual state pieces if available in the comprehensive report
                if (result.data.summary) setSummaryData(result.data.summary);
                if (result.data.trend) setTrendData(result.data.trend);
                if (result.data.orders) setOrdersData(result.data.orders);

                setActiveFilters(filters);
                addLog('✅ Delivery reports fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch reports: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery reports';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}`, 'error');
            console.error('Fetch delivery reports error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [activeFilters, addLog]);

    // ===== EXPORT DELIVERY REPORT =====
    const exportReport = useCallback(async (exportParams = {}) => {
        setExporting(true);
        setError(null);
        setExportSuccess(false);

        // Merge with active filters
        const filters = { ...activeFilters, ...exportParams };
        addLog(`Exporting delivery report with params: ${JSON.stringify(filters)}`, 'info');

        try {
            const result = await reportsApi.exportDeliveryReport(filters);
            if (result.success) {
                // Trigger file download
                const downloadSuccess = reportsApi.downloadFile(result.data);

                if (downloadSuccess) {
                    setExportSuccess(true);
                    addLog(`✅ Report exported successfully: ${result.data.filename} (${(result.data.size / 1024).toFixed(2)} KB)`, 'success');
                    return { success: true, data: result.data };
                } else {
                    setError('Failed to download exported file');
                    addLog('❌ Failed to download exported file', 'error');
                    return { success: false, message: 'Failed to download exported file' };
                }
            } else {
                setError(result.message);
                addLog(`❌ Failed to export report: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to export delivery report';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}`, 'error');
            console.error('Export report error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setExporting(false);
        }
    }, [activeFilters, addLog]);

    // ===== GET QUICK SUMMARY =====
    const fetchDeliverySummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching delivery summary...', 'info');

        try {
            const result = await reportsApi.getDeliverySummary();
            if (result.success) {
                setSummaryData(result.data);
                addLog('✅ Delivery summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch delivery summary';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== GET TREND DATA =====
    const fetchDeliveryTrend = useCallback(async (days = 30) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching delivery trend data (last ${days} days)...`, 'info');

        try {
            const result = await reportsApi.getDeliveryTrend(days);
            if (result.success) {
                setTrendData(result.data);
                addLog(`✅ Delivery trend data fetched (${days} days)`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch trend data: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch delivery trend data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch trend data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== GET ORDER-WISE REPORT =====
    const fetchOrderWiseReport = useCallback(async (customFilters = {}) => {
        setLoading(true);
        setError(null);

        const filters = { ...activeFilters, ...customFilters };
        addLog(`Fetching order-wise report with filters: ${JSON.stringify(filters)}`, 'info');

        try {
            const result = await reportsApi.getOrderWiseReport(filters);
            if (result.success) {
                setOrdersData(result.data.orders || []);
                addLog(`✅ Order-wise report fetched: ${result.data.orders?.length || 0} orders`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch order-wise report: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch order-wise report';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch order-wise report error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [activeFilters, addLog]);

    // ===== BATCH OPERATIONS =====
    const fetchAllReportsData = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        addLog('Fetching all reports data...', 'info');

        try {
            // Update active filters
            if (Object.keys(filters).length > 0) {
                setActiveFilters(prev => ({ ...prev, ...filters }));
            }

            // Fetch comprehensive reports
            const reportsResult = await fetchDeliveryReports(filters);

            if (reportsResult.success) {
                addLog('✅ All reports data fetched successfully', 'success');
                return { success: true, message: 'All reports data fetched successfully' };
            } else {
                setError(reportsResult.message);
                addLog(`⚠️ Failed to fetch complete reports: ${reportsResult.message}`, 'warning');
                return { success: false, message: reportsResult.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all reports data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all reports data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchDeliveryReports]);

    // ===== SIMULATION FUNCTIONS =====
    const simulateReportData = useCallback(() => {
        const mockData = {
            summary: {
                total_deliveries: 128,
                completed_deliveries: 118,
                pending_deliveries: 5,
                failed_deliveries: 3,
                cancelled_deliveries: 2,
                total_earnings: 24500,
                average_delivery_time: 2.5,
                success_rate: 92.2
            },
            period_breakdown: [
                {
                    period: "This Week",
                    period_start: new Date().toISOString(),
                    period_end: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
                    total_orders: 42,
                    completed: 38,
                    failed: 3,
                    cancelled: 1,
                    earnings: 8750,
                    average_distance: 4.5
                },
                {
                    period: "This Month",
                    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                    period_end: new Date().toISOString(),
                    total_orders: 128,
                    completed: 118,
                    failed: 8,
                    cancelled: 2,
                    earnings: 24500,
                    average_distance: 5.2
                }
            ],
            trend: {
                labels: ['Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16'],
                delivery_data: [8, 7, 9, 6, 10, 8, 9],
                earnings_data: [1500, 1300, 1700, 1200, 1800, 1600, 1700]
            },
            orders: Array.from({ length: 10 }, (_, i) => ({
                order_id: 2100 + i,
                delivery_id: 1000 + i,
                customer_name: `Customer ${i + 1}`,
                delivery_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                status: i % 3 === 0 ? 'DELIVERED' : i % 3 === 1 ? 'OUT_FOR_DELIVERY' : 'ASSIGNED',
                distance_km: 5.5 + (i * 0.5),
                earning_amount: 250 + (i * 20),
                delivery_time_minutes: 45 + (i * 5),
                address: `Address ${i + 1}, City`
            }))
        };

        setReportsData(mockData);
        addLog('Simulated report data loaded', 'info');
        return mockData;
    }, [addLog]);

    const value = {
        // State
        reportsData,
        summaryData,
        trendData,
        ordersData,
        loading,
        exporting,
        error,
        operationLogs,
        exportSuccess,
        activeFilters,

        // Main Functions
        fetchDeliveryReports,
        exportReport,
        fetchDeliverySummary,
        fetchDeliveryTrend,
        fetchOrderWiseReport,

        // Batch Operations
        fetchAllReportsData,

        // Utility Functions
        updateFilters,
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog,

        // Simulation
        simulateReportData
    };

    return (
        <DeliveryReportsContext.Provider value={value}>
            {children}
        </DeliveryReportsContext.Provider>
    );
};