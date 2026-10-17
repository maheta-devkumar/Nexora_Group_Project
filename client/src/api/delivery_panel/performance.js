// src/api/delivery_panel/performance.js
import api from '../api';

const DELIVERY_PERFORMANCE_BASE_URL = `/delivery_panel/performance`;

/* -----------------------------
   ✅ DELIVERY PERFORMANCE API FUNCTIONS
------------------------------ */

// Health check
export const checkPerformanceHealth = async () => {
    try {
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/health`);
        return { 
            success: true, 
            data: response.data,
            message: "Performance module is healthy"
        };
    } catch (error) {
        console.error("Performance Health Check Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Performance module health check failed",
            data: null
        };
    }
};

// Get performance metrics
export const fetchPerformanceMetrics = async (period = null, startDate = null, endDate = null) => {
    try {
        const params = {};
        if (period) params.period = period;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/metrics`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Performance metrics fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Performance Metrics Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch performance metrics",
            data: null
        };
    }
};

// Get performance charts
export const fetchPerformanceCharts = async (period = null, startDate = null, endDate = null, groupBy = 'day') => {
    try {
        const params = { group_by: groupBy };
        if (period) params.period = period;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/charts`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Performance charts fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Performance Charts Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch performance charts",
            data: null
        };
    }
};

// Get rating history
export const fetchRatingHistory = async (period = null, startDate = null, endDate = null, limit = 50, offset = 0) => {
    try {
        const params = { limit, offset };
        if (period) params.period = period;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/ratings`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Rating history fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Rating History Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch rating history",
            data: null
        };
    }
};

// Get performance badges
export const fetchPerformanceBadges = async () => {
    try {
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/badges`);
        return { 
            success: true, 
            data: response.data,
            message: "Performance badges fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Performance Badges Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch performance badges",
            data: null
        };
    }
};

// Get performance trends
export const fetchPerformanceTrends = async () => {
    try {
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/trends`);
        return { 
            success: true, 
            data: response.data,
            message: "Performance trends fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Performance Trends Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch performance trends",
            data: null
        };
    }
};

// Get peer comparison
export const fetchPeerComparison = async (period = null, startDate = null, endDate = null) => {
    try {
        const params = {};
        if (period) params.period = period;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/comparison`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Peer comparison fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Peer Comparison Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch peer comparison",
            data: null
        };
    }
};

// Get detailed delivery records
export const fetchDetailedDeliveryRecords = async (period = null, startDate = null, endDate = null, status = null, page = 1, pageSize = 50) => {
    try {
        const params = { page, page_size: pageSize };
        if (period) params.period = period;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (status) params.status = status;
        
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/deliveries`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Detailed delivery records fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Delivery Records Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch delivery records",
            data: null
        };
    }
};

// Get period summary
export const fetchPeriodSummary = async (periodType = 'monthly', months = 6) => {
    try {
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/summary`, {
            params: { period_type: periodType, months }
        });
        return { 
            success: true, 
            data: response.data,
            message: "Period summary fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Period Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch period summary",
            data: null
        };
    }
};

// Get achievement milestones
export const fetchAchievementMilestones = async () => {
    try {
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/milestones`);
        return { 
            success: true, 
            data: response.data,
            message: "Achievement milestones fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Achievement Milestones Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch achievement milestones",
            data: null
        };
    }
};

// Get complete performance data
export const fetchCompletePerformanceData = async (period = null, startDate = null, endDate = null) => {
    try {
        const params = {};
        if (period) params.period = period;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/complete`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Complete performance data fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Complete Performance Data Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch complete performance data",
            data: null
        };
    }
};

// Get on-time metrics specifically
export const fetchOnTimeMetrics = async (period = null, startDate = null, endDate = null) => {
    try {
        const params = {};
        if (period) params.period = period;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/metrics/on-time`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "On-time metrics fetched successfully"
        };
    } catch (error) {
        console.error("Fetch On-Time Metrics Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch on-time metrics",
            data: null
        };
    }
};

// Get rating metrics specifically
export const fetchRatingMetrics = async (period = null, startDate = null, endDate = null) => {
    try {
        const params = {};
        if (period) params.period = period;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        
        const response = await api.get(`${DELIVERY_PERFORMANCE_BASE_URL}/metrics/ratings`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Rating metrics fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Rating Metrics Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch rating metrics",
            data: null
        };
    }
};