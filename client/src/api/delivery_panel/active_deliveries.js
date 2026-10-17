// src/api/delivery_panel/active_deliveries.js
import api from '../api';

const ACTIVE_DELIVERIES_BASE_URL = `/delivery_panel/active`;

/* -----------------------------
   ✅ ACTIVE DELIVERIES API FUNCTIONS
------------------------------ */

// Get active deliveries
export const fetchActiveDeliveries = async () => {
    try {
        const response = await api.get(`${ACTIVE_DELIVERIES_BASE_URL}/`);
        console.log(response.data);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Active deliveries fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Active Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch active deliveries",
            data: { active_deliveries: [], count: 0 }
        };
    }
};

// Get delivery by ID
export const fetchDeliveryById = async (deliveryId) => {
    try {
        const response = await api.get(`${ACTIVE_DELIVERIES_BASE_URL}/${deliveryId}`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Delivery details fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Delivery by ID Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch delivery details",
            data: null
        };
    }
};

// Get delivery statistics
export const fetchDeliveryStatistics = async () => {
    try {
        const response = await api.get(`${ACTIVE_DELIVERIES_BASE_URL}/statistics`);
        return {
            success: true,
            data: response.data,
            message: "Delivery statistics fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Delivery Statistics Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch delivery statistics",
            data: null
        };
    }
};

// Get today's deliveries
export const fetchTodayDeliveries = async () => {
    try {
        const response = await api.get(`${ACTIVE_DELIVERIES_BASE_URL}/today`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Today's deliveries fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Today's Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch today's deliveries",
            data: { active_deliveries: [], count: 0 }
        };
    }
};

// Get deliveries by status
export const fetchDeliveriesByStatus = async (status) => {
    try {
        const response = await api.get(`${ACTIVE_DELIVERIES_BASE_URL}/status/${status}`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Deliveries by status fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Deliveries by Status Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch deliveries by status",
            data: { active_deliveries: [], count: 0 }
        };
    }
};

// Update delivery status
export const updateDeliveryStatus = async (deliveryId, status, notes = null, latitude = null, longitude = null) => {
    try {
        const requestData = {
            status: status,
            notes: notes,
            ...(latitude && { latitude: latitude }),
            ...(longitude && { longitude: longitude })
        };

        const response = await api.put(
            `${ACTIVE_DELIVERIES_BASE_URL}/${deliveryId}/status`,
            requestData
        );
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Delivery status updated successfully"
        };
    } catch (error) {
        console.error("Update Delivery Status Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to update delivery status",
            data: null
        };
    }
};

// Mark delivery as delivered (Dedicated endpoint)
export const markDeliveryDelivered = async (deliveryId, notes = null, latitude = null, longitude = null) => {
    try {
        const requestData = {
            status: "DELIVERED",
            notes: notes,
            ...(latitude && { latitude: latitude }),
            ...(longitude && { longitude: longitude })
        };

        const response = await api.patch(
            `${ACTIVE_DELIVERIES_BASE_URL}/${deliveryId}/mark-delivered`,
            requestData
        );
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Delivery marked as completed successfully"
        };
    } catch (error) {
        console.error("Mark Delivered Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || error.response?.data?.detail || "Failed to mark delivery as completed",
            data: null
        };
    }
};

// Request OTP
export const requestDeliveryOTP = async (deliveryId) => {
    try {
        const response = await api.post(`${ACTIVE_DELIVERIES_BASE_URL}/${deliveryId}/request-otp`);
        return {
            success: true,
            data: response.data,
            message: response.data.message
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to request OTP"
        };
    }
};

// Confirm Delivery with OTP
export const confirmDeliveryOTP = async (deliveryId, otp) => {
    try {
        const response = await api.post(`${ACTIVE_DELIVERIES_BASE_URL}/${deliveryId}/confirm-delivery`, { otp });
        return {
            success: true,
            data: response.data,
            message: response.data.message
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to confirm delivery"
        };
    }
};

// Validate status transition
export const validateStatusTransition = async (deliveryId, targetStatus) => {
    try {
        const response = await api.get(
            `${ACTIVE_DELIVERIES_BASE_URL}/${deliveryId}/validate-status/${targetStatus}`
        );
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Status transition validated"
        };
    } catch (error) {
        console.error("Validate Status Transition Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to validate status transition",
            data: null
        };
    }
};

// Update delivery progress
export const updateDeliveryProgress = async (deliveryId, progressPercentage, notes = null, latitude = null, longitude = null) => {
    try {
        const requestData = {
            progress_percentage: progressPercentage,
            notes: notes,
            ...(latitude && { latitude: latitude }),
            ...(longitude && { longitude: longitude })
        };

        const response = await api.put(
            `${ACTIVE_DELIVERIES_BASE_URL}/${deliveryId}/progress`,
            requestData
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
            message: error.response?.data?.detail || "Failed to update delivery progress",
            data: null
        };
    }
};

// Update delivery person location
export const updateDeliveryPersonLocation = async (latitude, longitude, accuracy = null) => {
    try {
        let url = `${ACTIVE_DELIVERIES_BASE_URL}/location?latitude=${latitude}&longitude=${longitude}`;
        if (accuracy !== null) {
            url += `&accuracy=${accuracy}`;
        }

        const response = await api.put(url);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Location updated successfully"
        };
    } catch (error) {
        console.error("Update Location Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to update location",
            data: null
        };
    }
};

// Get customer contact info
export const getCustomerContactInfo = async (deliveryId) => {
    try {
        const response = await api.get(`${ACTIVE_DELIVERIES_BASE_URL}/${deliveryId}/call`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Customer contact info fetched"
        };
    } catch (error) {
        console.error("Get Customer Contact Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to get customer contact info",
            data: null
        };
    }
};

// Get delivery navigation data
export const getDeliveryNavigationData = async (deliveryId) => {
    try {
        const response = await api.get(`${ACTIVE_DELIVERIES_BASE_URL}/${deliveryId}/navigation`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Navigation data fetched"
        };
    } catch (error) {
        console.error("Get Navigation Data Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to get navigation data",
            data: null
        };
    }
};

// Bulk update delivery status
export const bulkUpdateDeliveryStatus = async (deliveryIds, status, notes = null) => {
    try {
        const queryParams = new URLSearchParams({
            delivery_ids: deliveryIds.join(','),
            status: status
        });
        if (notes) {
            queryParams.append('notes', notes);
        }

        const response = await api.put(
            `${ACTIVE_DELIVERIES_BASE_URL}/bulk/status?${queryParams}`
        );
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Bulk status update completed"
        };
    } catch (error) {
        console.error("Bulk Update Status Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to bulk update status",
            data: null
        };
    }
};

// Refresh deliveries
export const refreshDeliveries = async () => {
    try {
        const response = await api.get(`${ACTIVE_DELIVERIES_BASE_URL}/refresh`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Deliveries refreshed"
        };
    } catch (error) {
        console.error("Refresh Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to refresh deliveries",
            data: null
        };
    }
};

// Health check
export const checkActiveDeliveriesHealth = async () => {
    try {
        const response = await api.get(`${ACTIVE_DELIVERIES_BASE_URL}/health`);
        return {
            success: true,
            data: response.data,
            message: "Active deliveries module is healthy"
        };
    } catch (error) {
        console.error("Health Check Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Active deliveries health check failed",
            data: null
        };
    }
};