// src/api/dp/earnings.js
import api from '../api';

const DELIVERY_EARNINGS_BASE_URL = `/delivery_panel/earnings`;

/* -----------------------------
   ✅ DELIVERY EARNINGS API FUNCTIONS
------------------------------ */

// Get earnings overview
export const fetchEarningsOverview = async () => {
    try {
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/overview`);
        return { 
            success: true, 
            data: response.data,
            message: "Earnings overview fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Earnings Overview Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch earnings overview",
            data: null
        };
    }
};

// Get earnings summary
export const fetchEarningsSummary = async () => {
    try {
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/summary`);
        return { 
            success: true, 
            data: response.data,
            message: "Earnings summary fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Earnings Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch earnings summary",
            data: null
        };
    }
};

// Get chart data
export const fetchChartData = async (startDate = null, endDate = null, grouping = "daily") => {
    try {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (grouping) params.grouping = grouping;
        
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/chart`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Chart data fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Chart Data Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch chart data",
            data: null
        };
    }
};

// Get transactions
export const fetchTransactions = async (startDate = null, endDate = null, period = null, 
                                        type = null, status = null, page = 1, perPage = 20) => {
    try {
        const params = { page, per_page: perPage };
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (period) params.period = period;
        if (type) params.type = type;
        if (status) params.status = status;
        
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/transactions`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Transactions fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Transactions Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch transactions",
            data: null
        };
    }
};

// Get bank info
export const fetchBankInfo = async () => {
    try {
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/bank`);
        return { 
            success: true, 
            data: response.data,
            message: "Bank information fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Bank Info Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch bank information",
            data: null
        };
    }
};

// Get payout history
export const fetchPayoutHistory = async (startDate = null, endDate = null, page = 1, perPage = 20) => {
    try {
        const params = { page, per_page: perPage };
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/payouts`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Payout history fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Payout History Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch payout history",
            data: null
        };
    }
};

// Get today's earnings
export const fetchTodayEarnings = async () => {
    try {
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/today`);
        return { 
            success: true, 
            data: response.data,
            message: "Today's earnings fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Today Earnings Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch today's earnings",
            data: null
        };
    }
};

// Get weekly earnings
export const fetchWeeklyEarnings = async () => {
    try {
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/week`);
        return { 
            success: true, 
            data: response.data,
            message: "Weekly earnings fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Weekly Earnings Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch weekly earnings",
            data: null
        };
    }
};

// Get monthly earnings
export const fetchMonthlyEarnings = async () => {
    try {
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/month`);
        return { 
            success: true, 
            data: response.data,
            message: "Monthly earnings fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Monthly Earnings Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch monthly earnings",
            data: null
        };
    }
};

// Get period earnings
export const fetchPeriodEarnings = async (period, customStart = null, customEnd = null) => {
    try {
        const params = {};
        if (customStart) params.custom_start = customStart;
        if (customEnd) params.custom_end = customEnd;
        
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/period/${period}`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Period earnings fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Period Earnings Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch period earnings",
            data: null
        };
    }
};

// Get custom period earnings
export const fetchCustomPeriodEarnings = async (startDate, endDate) => {
    try {
        const params = { start_date: startDate, end_date: endDate };
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/custom`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Custom period earnings fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Custom Period Earnings Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch custom period earnings",
            data: null
        };
    }
};

// Download statement
export const downloadStatement = async (startDate, endDate, format = "csv", includePending = false) => {
    try {
        const requestData = {
            start_date: startDate,
            end_date: endDate,
            format: format,
            include_pending: includePending
        };
        
        const response = await api.post(`${DELIVERY_EARNINGS_BASE_URL}/statement/download`, requestData);
        return { 
            success: true, 
            data: response.data,
            message: "Statement download initiated successfully"
        };
    } catch (error) {
        console.error("Download Statement Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to download statement",
            data: null
        };
    }
};

// Export CSV statement
export const exportCSVStatement = async (startDate, endDate) => {
    try {
        const params = { start_date: startDate, end_date: endDate };
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/export/csv`, { 
            params,
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `earnings_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return { 
            success: true, 
            data: response.data,
            message: "CSV exported successfully"
        };
    } catch (error) {
        console.error("Export CSV Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to export CSV",
            data: null
        };
    }
};

// Health check
export const checkEarningsHealth = async () => {
    try {
        const response = await api.get(`${DELIVERY_EARNINGS_BASE_URL}/overview`);
        return { 
            success: true, 
            data: response.data,
            message: "Earnings module is healthy"
        };
    } catch (error) {
        console.error("Earnings Health Check Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Earnings module health check failed",
            data: null
        };
    }
};