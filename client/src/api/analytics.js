import api from './api';

/* -----------------------------
   📊 ANALYTICS API FUNCTIONS
------------------------------ */

// Base URL for analytics
const ANALYTICS_BASE_URL = `/admin/analytics`;

/* -----------------------------
   📈 DASHBOARD API FUNCTIONS
------------------------------ */

// Get dashboard summary
export const fetchDashboardSummary = async () => {
    try {
        const response = await api.get(`${ANALYTICS_BASE_URL}/dashboard`);
        return { 
            success: true, 
            data: response.data,
            message: "Dashboard summary fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Dashboard Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch dashboard summary",
            data: null
        };
    }
};

/* -----------------------------
   💰 SALES ANALYTICS API FUNCTIONS
------------------------------ */

// Get sales report
export const fetchSalesReport = async (period = "month", startDate = null, endDate = null) => {
    try {
        const params = { period };
        if (startDate && endDate) {
            params.start_date = startDate;
            params.end_date = endDate;
        }
        
        const response = await api.get(`${ANALYTICS_BASE_URL}/sales-summary`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Sales report fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Sales Report Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch sales report",
            data: null
        };
    }
};

/* -----------------------------
   📦 PRODUCT ANALYTICS API FUNCTIONS
------------------------------ */

// Get top selling products
export const fetchTopSellingProducts = async (limit = 10) => {
    try {
        const response = await api.get(`${ANALYTICS_BASE_URL}/top-products`, {
            params: { limit }
        });
        return { 
            success: true, 
            data: response.data,
            message: "Top selling products fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Top Products Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch top products",
            data: []
        };
    }
};

// Get product performance analytics
export const fetchProductPerformance = async (variantId = null) => {
    try {
        const params = {};
        if (variantId) {
            params.variant_id = variantId;
        }
        
        const response = await api.get(`${ANALYTICS_BASE_URL}/product-performance`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Product performance fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Product Performance Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch product performance",
            data: []
        };
    }
};

/* -----------------------------
   👥 CUSTOMER ANALYTICS API FUNCTIONS
------------------------------ */

// Get customer insights
export const fetchCustomerInsights = async () => {
    try {
        const response = await api.get(`${ANALYTICS_BASE_URL}/customer-insights`);
        return { 
            success: true, 
            data: response.data,
            message: "Customer insights fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Customer Insights Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch customer insights",
            data: null
        };
    }
};

/* -----------------------------
   📦 INVENTORY ANALYTICS API FUNCTIONS
------------------------------ */

// Get inventory status
export const fetchInventoryStatus = async () => {
    try {
        const response = await api.get(`${ANALYTICS_BASE_URL}/inventory-status`);
        return { 
            success: true, 
            data: response.data,
            message: "Inventory status fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Inventory Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch inventory status",
            data: []
        };
    }
};

/* -----------------------------
   🔍 SEARCH ANALYTICS API FUNCTIONS
------------------------------ */

// Get search analytics
export const fetchSearchAnalytics = async () => {
    try {
        const response = await api.get(`${ANALYTICS_BASE_URL}/search-analytics`);
        return { 
            success: true, 
            data: response.data,
            message: "Search analytics fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Search Analytics Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch search analytics",
            data: null
        };
    }
};

// Get user behavior analytics
export const fetchUserBehavior = async () => {
    try {
        const response = await api.get(`${ANALYTICS_BASE_URL}/user-behavior`);
        return { 
            success: true, 
            data: response.data,
            message: "User behavior fetched successfully"
        };
    } catch (error) {
        console.error("Fetch User Behavior Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch user behavior",
            data: null
        };
    }
};

/* -----------------------------
   👨‍💼 ADMIN ACTIVITY API FUNCTIONS
------------------------------ */

// Get admin activity logs
export const fetchAdminActivityLogs = async (adminId = null, limit = 50) => {
    try {
        const params = { limit };
        if (adminId) {
            params.admin_id = adminId;
        }
        
        const response = await api.get(`${ANALYTICS_BASE_URL}/activity-log`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Admin activity logs fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Admin Activity Logs Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch admin activity logs",
            data: []
        };
    }
};

/* -----------------------------
   🔄 DATA MANAGEMENT API FUNCTIONS
------------------------------ */

// Refresh analytics data
export const refreshAnalyticsData = async () => {
    try {
        const response = await api.post(`${ANALYTICS_BASE_URL}/refresh`);
        return { 
            success: true, 
            data: response.data,
            message: "Analytics data refreshed successfully"
        };
    } catch (error) {
        console.error("Refresh Analytics Data Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to refresh analytics data",
            data: null
        };
    }
};

/* -----------------------------
   🩺 HEALTH CHECK API FUNCTIONS
------------------------------ */

// Check analytics health
export const checkAnalyticsHealth = async () => {
    try {
        const response = await api.get(`${ANALYTICS_BASE_URL}/health`);
        return { 
            success: true, 
            data: response.data,
            message: "Analytics health check passed"
        };
    } catch (error) {
        console.error("Analytics Health Check Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Analytics health check failed",
            data: null
        };
    }
};