import api from './api';

const DELIVERY_DASHBOARD_BASE_URL = `/delivery_panel/delivery_dashboard`;

/* -----------------------------
   ✅ DELIVERY DASHBOARD API FUNCTIONS
------------------------------ */

// Get dashboard statistics
export const fetchDashboardStats = async () => {
    try {
        const response = await api.get(`${DELIVERY_DASHBOARD_BASE_URL}/dashboard/stats`);
        return {
            success: true,
            data: response.data,
            message: "Dashboard stats fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Dashboard Stats Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch dashboard stats",
            data: null
        };
    }
};

// Get active deliveries
export const fetchActiveDeliveries = async () => {
    try {
        const response = await api.get(`${DELIVERY_DASHBOARD_BASE_URL}/deliveries/active`);
        return {
            success: true,
            data: response.data,
            message: "Active deliveries fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Active Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch active deliveries",
            data: { active_orders: [] }
        };
    }
};

// Get earnings overview
export const fetchEarningsOverview = async () => {
    try {
        const response = await api.get(`${DELIVERY_DASHBOARD_BASE_URL}/earnings/overview`);
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
            data: { periods: [], pending_settlement: 0 }
        };
    }
};

// Get today's schedule
export const fetchTodaySchedule = async () => {
    try {
        const response = await api.get(`${DELIVERY_DASHBOARD_BASE_URL}/schedule/today`);
        return {
            success: true,
            data: response.data,
            message: "Today's schedule fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Today Schedule Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch today's schedule",
            data: { date: "", upcoming_shifts: [], next_delivery: null }
        };
    }
};

// Mark delivery as picked up
export const markDeliveryAsPicked = async (orderId) => {
    try {
        const response = await api.post(`${DELIVERY_DASHBOARD_BASE_URL}/orders/${orderId}/mark-picked`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Delivery marked as picked up successfully"
        };
    } catch (error) {
        console.error("Mark Delivery Picked Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to mark delivery as picked up",
            data: null
        };
    }
};

// Mark delivery as delivered
export const markDeliveryAsDelivered = async (orderId) => {
    try {
        const response = await api.post(`${DELIVERY_DASHBOARD_BASE_URL}/orders/${orderId}/mark-delivered`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Delivery marked as delivered successfully"
        };
    } catch (error) {
        console.error("Mark Delivery Delivered Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to mark delivery as delivered",
            data: null
        };
    }
};

// Update delivery progress
export const updateDeliveryProgress = async (deliveryId, progress) => {
    try {
        const response = await api.post(
            `${DELIVERY_DASHBOARD_BASE_URL}/deliveries/${deliveryId}/update-progress?progress=${progress}`
        );
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Delivery progress updated successfully"
        };
    } catch (error) {
        console.error("Update Delivery Progress Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update delivery progress",
            data: null
        };
    }
};

// Report issue
export const reportDeliveryIssue = async (orderId, issueType, description, priority = "MEDIUM") => {
    try {
        const requestData = {
            order_id: orderId,
            issue_type: issueType,
            description: description,
            priority: priority
        };

        const response = await api.post(`${DELIVERY_DASHBOARD_BASE_URL}/issues/report`, requestData);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Issue reported successfully"
        };
    } catch (error) {
        console.error("Report Issue Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to report issue",
            data: null
        };
    }
};

// Upload POD (Proof of Delivery)
export const uploadPOD = async (orderId, imageUrl, signatureUrl = null, notes = null) => {
    try {
        const requestData = {
            order_id: orderId,
            image_url: imageUrl,
            signature_url: signatureUrl,
            notes: notes
        };

        const response = await api.post(`${DELIVERY_DASHBOARD_BASE_URL}/pod/upload`, requestData);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "POD uploaded successfully"
        };
    } catch (error) {
        console.error("Upload POD Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to upload POD",
            data: null
        };
    }
};

// Get navigation details
export const fetchNavigationDetails = async (orderId) => {
    try {
        const response = await api.get(`${DELIVERY_DASHBOARD_BASE_URL}/orders/${orderId}/navigation`);
        return {
            success: true,
            data: response.data,
            message: "Navigation details fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Navigation Details Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch navigation details",
            data: null
        };
    }
};

// Initiate call to customer
export const initiateCustomerCall = async (orderId) => {
    try {
        const response = await api.post(`${DELIVERY_DASHBOARD_BASE_URL}/orders/${orderId}/initiate-call`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Call initiated successfully"
        };
    } catch (error) {
        console.error("Initiate Call Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to initiate call",
            data: null
        };
    }
};

// Get performance metrics
export const fetchPerformanceMetrics = async () => {
    try {
        const response = await api.get(`${DELIVERY_DASHBOARD_BASE_URL}/performance`);
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

// Health check
export const checkDeliveryDashboardHealth = async () => {
    try {
        const response = await api.get(`${DELIVERY_DASHBOARD_BASE_URL}/health`);
        return {
            success: true,
            data: response.data,
            message: "Delivery dashboard is healthy"
        };
    } catch (error) {
        console.error("Health Check Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Delivery dashboard health check failed",
            data: null
        };
    }
};