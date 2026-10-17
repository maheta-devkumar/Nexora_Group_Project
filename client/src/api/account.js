import api from './api';

const ACCOUNT_BASE_URL = `/account`;

/* -----------------------------
   ✅ ACCOUNT API FUNCTIONS
------------------------------ */

// Get dashboard data
export const fetchDashboard = async () => {
    try {
        const response = await api.get(`${ACCOUNT_BASE_URL}/dashboard`);
        return { 
            success: true, 
            data: response.data,
            message: response.data.message || "Dashboard data fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Dashboard Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch dashboard data",
            data: null
        };
    }
};

// Get dashboard data (test endpoint - no auth)
export const fetchDashboardTest = async () => {
    try {
        const response = await api.get(`${ACCOUNT_BASE_URL}/dashboard`);
        return { 
            success: true, 
            data: response.data,
            message: response.data.message || "Dashboard test data fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Dashboard Test Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch dashboard test data",
            data: null
        };
    }
};