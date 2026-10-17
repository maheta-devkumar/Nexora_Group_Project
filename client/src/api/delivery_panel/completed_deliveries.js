import api from '../api';

const DELIVERY_COMPLETED_BASE_URL = `/delivery_panel`;

/* -----------------------------
   ✅ COMPLETED DELIVERIES API FUNCTIONS
------------------------------ */

// Get completed deliveries with filters
export const fetchCompletedDeliveries = async ({
    start_date = null,
    end_date = null,
    period = null,
    status = null,
    min_earning = null,
    max_earning = null,
    page = 1,
    per_page = 20
} = {}) => {
    try {
        const params = {};
        if (start_date) params.start_date = start_date;
        if (end_date) params.end_date = end_date;
        if (period) params.period = period;
        if (status) params.status = status;
        if (min_earning) params.min_earning = min_earning;
        if (max_earning) params.max_earning = max_earning;
        if (page) params.page = page;
        if (per_page) params.per_page = per_page;

        const response = await api.get(`${DELIVERY_COMPLETED_BASE_URL}/completed`, { params });
        return {
            success: true,
            data: response.data,
            message: "Completed deliveries fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Completed Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch completed deliveries",
            data: null
        };
    }
};

// Get single completed delivery details
export const fetchCompletedDeliveryDetail = async (deliveryId) => {
    try {
        const response = await api.get(`${DELIVERY_COMPLETED_BASE_URL}/completed/${deliveryId}`);
        return {
            success: true,
            data: response.data,
            message: "Delivery details fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Delivery Detail Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch delivery details",
            data: null
        };
    }
};

// Get proof of delivery (POD)
export const fetchProofOfDelivery = async (deliveryId) => {
    try {
        const response = await api.get(`${DELIVERY_COMPLETED_BASE_URL}/completed/${deliveryId}/pod`);
        return {
            success: true,
            data: response.data,
            message: "Proof of Delivery fetched successfully"
        };
    } catch (error) {
        console.error("Fetch POD Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch Proof of Delivery",
            data: null
        };
    }
};

// Get summary statistics
export const fetchSummaryStatistics = async ({
    start_date = null,
    end_date = null,
    period = null
} = {}) => {
    try {
        const params = {};
        if (start_date) params.start_date = start_date;
        if (end_date) params.end_date = end_date;
        if (period) params.period = period;

        const response = await api.get(`${DELIVERY_COMPLETED_BASE_URL}/completed/summary`, { params });
        return {
            success: true,
            data: response.data,
            message: "Summary statistics fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Summary Statistics Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch summary statistics",
            data: null
        };
    }
};

// Get today's completed deliveries
export const fetchTodayCompletedDeliveries = async () => {
    try {
        const response = await api.get(`${DELIVERY_COMPLETED_BASE_URL}/completed/today`);
        return {
            success: true,
            data: response.data,
            message: "Today's completed deliveries fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Today's Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch today's deliveries",
            data: null
        };
    }
};

// Get this week's completed deliveries
export const fetchWeekCompletedDeliveries = async () => {
    try {
        const response = await api.get(`${DELIVERY_COMPLETED_BASE_URL}/completed/week`);
        return {
            success: true,
            data: response.data,
            message: "Week's completed deliveries fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Week's Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch week's deliveries",
            data: null
        };
    }
};

// Get this month's completed deliveries
export const fetchMonthCompletedDeliveries = async () => {
    try {
        const response = await api.get(`${DELIVERY_COMPLETED_BASE_URL}/completed/month`);
        return {
            success: true,
            data: response.data,
            message: "Month's completed deliveries fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Month's Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch month's deliveries",
            data: null
        };
    }
};

// Get deliveries by date range
export const fetchDeliveriesByDateRange = async (startDate, endDate) => {
    try {
        const response = await api.get(`${DELIVERY_COMPLETED_BASE_URL}/completed/date-range`, {
            params: { start_date: startDate, end_date: endDate }
        });
        return {
            success: true,
            data: response.data,
            message: "Date range deliveries fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Date Range Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch date range deliveries",
            data: null
        };
    }
};

// Health check
export const checkCompletedDeliveriesHealth = async () => {
    try {
        // We'll use the completed endpoint without filters as health check
        const response = await api.get(`${DELIVERY_COMPLETED_BASE_URL}/completed`, {
            params: { page: 1, per_page: 1 }
        });
        return {
            success: true,
            data: response.data,
            message: "Completed deliveries API is healthy"
        };
    } catch (error) {
        console.error("Health Check Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Completed deliveries API health check failed",
            data: null
        };
    }
};