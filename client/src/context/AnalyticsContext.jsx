import React, { createContext, useContext, useState, useCallback } from 'react';
import * as analyticsApi from '../api/analytics';

const AnalyticsContext = createContext();

export const useAnalyticsContext = () => {
    const context = useContext(AnalyticsContext);
    if (!context) {
        throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
    }
    return context;
};

export const AnalyticsProvider = ({ children }) => {
    // Dashboard State
    const [dashboardSummary, setDashboardSummary] = useState(null);
    
    // Sales Analytics State
    const [salesReport, setSalesReport] = useState(null);
    
    // Product Analytics State
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const [productPerformance, setProductPerformance] = useState([]);
    
    // Customer Analytics State
    const [customerInsights, setCustomerInsights] = useState(null);
    
    // Inventory Analytics State
    const [inventoryStatus, setInventoryStatus] = useState([]);
    
    // Search & Behavior Analytics State
    const [searchAnalytics, setSearchAnalytics] = useState(null);
    const [userBehavior, setUserBehavior] = useState(null);
    
    // Admin Activity State
    const [adminActivityLogs, setAdminActivityLogs] = useState([]);
    
    // Common State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /* -----------------------------
       📈 DASHBOARD FUNCTIONS
    ------------------------------ */

    // Fetch dashboard summary
    const fetchDashboardSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.fetchDashboardSummary();
            if (result.success) {
                setDashboardSummary(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch dashboard summary';
            setError(errorMsg);
            console.error('Fetch dashboard summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* -----------------------------
       💰 SALES ANALYTICS FUNCTIONS
    ------------------------------ */

    // Fetch sales report
    const fetchSalesReport = useCallback(async (period = "month", startDate = null, endDate = null) => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.fetchSalesReport(period, startDate, endDate);
            if (result.success) {
                setSalesReport(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch sales report';
            setError(errorMsg);
            console.error('Fetch sales report error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* -----------------------------
       📦 PRODUCT ANALYTICS FUNCTIONS
    ------------------------------ */

    // Fetch top selling products
    const fetchTopSellingProducts = useCallback(async (limit = 10) => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.fetchTopSellingProducts(limit);
            if (result.success) {
                setTopSellingProducts(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch top selling products';
            setError(errorMsg);
            console.error('Fetch top selling products error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch product performance
    const fetchProductPerformance = useCallback(async (variantId = null) => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.fetchProductPerformance(variantId);
            if (result.success) {
                setProductPerformance(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch product performance';
            setError(errorMsg);
            console.error('Fetch product performance error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* -----------------------------
       👥 CUSTOMER ANALYTICS FUNCTIONS
    ------------------------------ */

    // Fetch customer insights
    const fetchCustomerInsights = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.fetchCustomerInsights();
            if (result.success) {
                setCustomerInsights(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch customer insights';
            setError(errorMsg);
            console.error('Fetch customer insights error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* -----------------------------
       📦 INVENTORY ANALYTICS FUNCTIONS
    ------------------------------ */

    // Fetch inventory status
    const fetchInventoryStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.fetchInventoryStatus();
            if (result.success) {
                setInventoryStatus(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch inventory status';
            setError(errorMsg);
            console.error('Fetch inventory status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* -----------------------------
       🔍 SEARCH ANALYTICS FUNCTIONS
    ------------------------------ */

    // Fetch search analytics
    const fetchSearchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.fetchSearchAnalytics();
            if (result.success) {
                setSearchAnalytics(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch search analytics';
            setError(errorMsg);
            console.error('Fetch search analytics error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch user behavior
    const fetchUserBehavior = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.fetchUserBehavior();
            if (result.success) {
                setUserBehavior(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch user behavior';
            setError(errorMsg);
            console.error('Fetch user behavior error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* -----------------------------
       👨‍💼 ADMIN ACTIVITY FUNCTIONS
    ------------------------------ */

    // Fetch admin activity logs
    const fetchAdminActivityLogs = useCallback(async (adminId = null, limit = 50) => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.fetchAdminActivityLogs(adminId, limit);
            if (result.success) {
                setAdminActivityLogs(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch admin activity logs';
            setError(errorMsg);
            console.error('Fetch admin activity logs error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* -----------------------------
       🔄 DATA MANAGEMENT FUNCTIONS
    ------------------------------ */

    // Refresh analytics data
    const refreshAnalyticsData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.refreshAnalyticsData();
            if (result.success) {
                // Refresh all data after successful refresh
                await Promise.all([
                    fetchDashboardSummary(),
                    fetchSalesReport(),
                    fetchTopSellingProducts(),
                    fetchCustomerInsights(),
                    fetchInventoryStatus()
                ]);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to refresh analytics data';
            setError(errorMsg);
            console.error('Refresh analytics data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchDashboardSummary, fetchSalesReport, fetchTopSellingProducts, fetchCustomerInsights, fetchInventoryStatus]);

    /* -----------------------------
       🩺 HEALTH CHECK FUNCTIONS
    ------------------------------ */

    // Check analytics health
    const checkAnalyticsHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyticsApi.checkAnalyticsHealth();
            return { 
                success: result.success, 
                data: result.data,
                message: result.message 
            };
        } catch (err) {
            const errorMsg = 'Analytics health check failed';
            setError(errorMsg);
            console.error('Analytics health check error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* -----------------------------
       🧹 UTILITY FUNCTIONS
    ------------------------------ */

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear all analytics data
    const clearAnalyticsData = useCallback(() => {
        setDashboardSummary(null);
        setSalesReport(null);
        setTopSellingProducts([]);
        setProductPerformance([]);
        setCustomerInsights(null);
        setInventoryStatus([]);
        setSearchAnalytics(null);
        setUserBehavior(null);
        setAdminActivityLogs([]);
    }, []);

    // Fetch all analytics data at once
    const fetchAllAnalyticsData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([
                fetchDashboardSummary(),
                fetchSalesReport(),
                fetchTopSellingProducts(),
                fetchCustomerInsights(),
                fetchInventoryStatus(),
                fetchSearchAnalytics(),
                fetchUserBehavior(),
                fetchAdminActivityLogs()
            ]);
            return { success: true, message: "All analytics data fetched successfully" };
        } catch (err) {
            const errorMsg = 'Failed to fetch all analytics data';
            setError(errorMsg);
            console.error('Fetch all analytics data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchDashboardSummary, fetchSalesReport, fetchTopSellingProducts, fetchCustomerInsights, fetchInventoryStatus, fetchSearchAnalytics, fetchUserBehavior, fetchAdminActivityLogs]);

    const value = {
        // State
        dashboardSummary,
        salesReport,
        topSellingProducts,
        productPerformance,
        customerInsights,
        inventoryStatus,
        searchAnalytics,
        userBehavior,
        adminActivityLogs,
        loading,
        error,

        // Dashboard Functions
        fetchDashboardSummary,

        // Sales Analytics Functions
        fetchSalesReport,

        // Product Analytics Functions
        fetchTopSellingProducts,
        fetchProductPerformance,

        // Customer Analytics Functions
        fetchCustomerInsights,

        // Inventory Analytics Functions
        fetchInventoryStatus,

        // Search & Behavior Analytics Functions
        fetchSearchAnalytics,
        fetchUserBehavior,

        // Admin Activity Functions
        fetchAdminActivityLogs,

        // Data Management Functions
        refreshAnalyticsData,

        // Health Check Functions
        checkAnalyticsHealth,

        // Utility Functions
        clearError,
        clearAnalyticsData,
        fetchAllAnalyticsData
    };

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
};