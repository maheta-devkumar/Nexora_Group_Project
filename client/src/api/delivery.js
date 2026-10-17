import api from './api';

const DELIVERY_BASE_URL = `/delivery`;

/* -----------------------------
   ✅ NEW AUTO ASSIGNMENT ADMIN API FUNCTIONS
------------------------------ */

// Webhook for order creation - auto create delivery + notifications
export const handleOrderCreatedWebhook = async (payload) => {
    try {
        const response = await api.post(`${DELIVERY_BASE_URL}/admin/webhook/order-created`, payload);
        return {
            success: true,
            data: response.data,
            message: response.data?.message || 'Delivery created successfully'
        };
    } catch (error) {
        console.error("Webhook Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to process order webhook",
            data: null
        };
    }
};

// Get available delivery persons (admin view)
export const adminGetAvailableDeliveryPersons = async () => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/available-delivery-persons`);
        return {
            success: true,
            data: response.data || [],
            message: response.data?.message || 'Available delivery persons fetched successfully'
        };
    } catch (error) {
        console.error("Get Available Delivery Persons Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch available delivery persons",
            data: []
        };
    }
};

// Get delivery pool (available deliveries)
export const adminGetDeliveryPool = async () => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/delivery-pool`);
        return {
            success: true,
            data: response.data || [],
            message: response.data?.message || 'Delivery pool fetched successfully'
        };
    } catch (error) {
        console.error("Get Delivery Pool Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery pool",
            data: []
        };
    }
};

// Admin manually send notification to delivery person
export const adminNotifyDeliveryPerson = async (payload) => {
    try {
        const response = await api.post(`${DELIVERY_BASE_URL}/admin/notify-delivery-person`, payload);
        return {
            success: true,
            data: response.data,
            message: response.data?.message || 'Notification sent successfully'
        };
    } catch (error) {
        console.error("Notify Delivery Person Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to send notification",
            data: null
        };
    }
};

// Admin cancel delivery (make available again)
export const adminCancelDeliveryToPool = async (deliveryId) => {
    try {
        const response = await api.post(`${DELIVERY_BASE_URL}/admin/${deliveryId}/cancel`);
        return {
            success: true,
            data: response.data,
            message: response.data?.message || 'Delivery cancelled and made available'
        };
    } catch (error) {
        console.error("Admin Cancel to Pool Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to cancel delivery",
            data: null
        };
    }
};
/* -----------------------------
   ✅ REGULAR DELIVERY API FUNCTIONS
------------------------------ */

// Get all deliveries (Admin only) - with pagination
export const fetchAllDeliveries = async (params = {}) => {
    try {
        const { page = 1, per_page = 20, status } = params;
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/all`, {
            params: {
                page,
                per_page,
                ...(status && { status })
            }
        });

        // Backend returns { success, message, data }
        return {
            success: response.data?.success || true,
            data: response.data?.data || [],
            message: response.data?.message || 'Deliveries fetched successfully',
            pagination: {
                page,
                per_page,
                total_items: response.data?.data?.length || 0,
                total_pages: Math.ceil((response.data?.data?.length || 0) / per_page)
            }
        };
    } catch (error) {
        console.error("Fetch All Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch deliveries",
            data: []
        };
    }
};

// Assign delivery person to order (Admin only) - NEW ENDPOINT
export const assignDeliveryPerson = async (payload) => {
    try {
        const response = await api.post(`${DELIVERY_BASE_URL}/admin/assign`, payload);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Delivery person assigned successfully'
        };
    } catch (error) {
        console.error("Assign Delivery Person Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to assign delivery person",
            data: null
        };
    }
};

// ADMIN: Get Delivery Overview (Optimized)
export const adminGetDeliveryOverview = async () => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/overview`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Overview fetched successfully'
        };
    } catch (error) {
        console.error("Admin Get Overview Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch overview",
            data: null
        };
    }
};

// Get all deliveries for admin dashboard
export const adminGetAllDeliveries = async () => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/all`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data || [],
            message: response.data?.message || 'Deliveries fetched successfully'
        };
    } catch (error) {
        console.error("Admin Get All Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch deliveries",
            data: []
        };
    }
};

// Get delivery statistics
export const adminGetDeliveryStats = async () => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/stats`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Stats fetched successfully'
        };
    } catch (error) {
        console.error("Admin Get Delivery Stats Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery stats",
            data: null
        };
    }
};

// Update delivery status (Admin)
export const adminUpdateDeliveryStatus = async (deliveryId, status) => {
    try {
        const response = await api.patch(`${DELIVERY_BASE_URL}/admin/${deliveryId}/status`, { status });
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Delivery status updated successfully'
        };
    } catch (error) {
        console.error("Admin Update Delivery Status Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update delivery status",
            data: null
        };
    }
};

// Reassign delivery person
export const adminReassignDeliveryPerson = async (payload) => {
    try {
        const response = await api.put(`${DELIVERY_BASE_URL}/admin/reassign`, payload);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Delivery person reassigned successfully'
        };
    } catch (error) {
        console.error("Admin Reassign Delivery Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to reassign delivery person",
            data: null
        };
    }
};

// Get delivery earnings
export const adminGetDeliveryEarnings = async () => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/earnings`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data || [],
            message: response.data?.message || 'Earnings fetched successfully'
        };
    } catch (error) {
        console.error("Admin Get Delivery Earnings Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery earnings",
            data: []
        };
    }
};

// Get delivery person performance
export const adminGetDeliveryPersonPerformance = async () => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/performance`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data || [],
            message: response.data?.message || 'Performance data fetched successfully'
        };
    } catch (error) {
        console.error("Admin Get Performance Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch performance data",
            data: []
        };
    }
};

// Search deliveries
export const adminSearchDeliveries = async (filters = {}) => {
    try {
        const response = await api.post(`${DELIVERY_BASE_URL}/admin/search`, filters);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data || [],
            message: response.data?.message || 'Search completed successfully'
        };
    } catch (error) {
        console.error("Admin Search Deliveries Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to search deliveries",
            data: []
        };
    }
};

// Get delivery timeline
export const adminGetDeliveryTimeline = async (deliveryId) => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/${deliveryId}/timeline`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data || [],
            message: response.data?.message || 'Timeline fetched successfully'
        };
    } catch (error) {
        console.error("Admin Get Delivery Timeline Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery timeline",
            data: []
        };
    }
};

// Cancel delivery (admin delete endpoint)
export const adminCancelDelivery = async (deliveryId) => {
    try {
        const response = await api.delete(`${DELIVERY_BASE_URL}/admin/${deliveryId}`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Delivery cancelled successfully'
        };
    } catch (error) {
        console.error("Admin Cancel Delivery Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to cancel delivery",
            data: null
        };
    }
};

// Validate delivery completion
export const adminValidateDeliveryCompletion = async (deliveryId) => {
    try {
        const response = await api.post(`${DELIVERY_BASE_URL}/admin/${deliveryId}/validate`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Delivery validated successfully'
        };
    } catch (error) {
        console.error("Admin Validate Delivery Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to validate delivery",
            data: null
        };
    }
};

// Get delivery issues
export const adminGetDeliveryIssues = async () => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/issues`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data || [],
            message: response.data?.message || 'Issues fetched successfully'
        };
    } catch (error) {
        console.error("Admin Get Delivery Issues Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery issues",
            data: []
        };
    }
};

// Get all delivery persons (for dropdowns)
export const adminGetAllDeliveryPersons = async (params = {}) => {
    try {
        const { page = 1, per_page = 20 } = params;
        const response = await api.get(`${DELIVERY_BASE_URL}/admin/persons`, {
            params: { page, per_page }
        });
        return {
            success: response.data?.success || true,
            data: response.data?.data || [],
            message: response.data?.message || 'Delivery persons fetched successfully',
            pagination: {
                page,
                per_page,
                total_items: response.data?.data?.length || 0,
                total_pages: Math.ceil((response.data?.data?.length || 0) / per_page)
            }
        };
    } catch (error) {
        console.error("Get Delivery Persons Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery persons",
            data: []
        };
    }
};

// Get my assigned orders (Delivery Person)
export const fetchMyAssignedOrders = async (params = {}) => {
    try {
        const { page = 1, per_page = 20 } = params;
        const response = await api.get(`${DELIVERY_BASE_URL}/my-orders`, {
            params: { page, per_page }
        });

        return {
            success: response.data?.success || true,
            data: response.data?.data || [],
            message: response.data?.message || 'Assigned orders fetched successfully',
            pagination: {
                page,
                per_page,
                total_items: response.data?.data?.length || 0,
                total_pages: Math.ceil((response.data?.data?.length || 0) / per_page)
            }
        };
    } catch (error) {
        console.error("Fetch My Assigned Orders Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch assigned orders",
            data: []
        };
    }
};

// Get my earnings (Delivery Person)
export const fetchMyEarnings = async () => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/my-earnings`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Earnings fetched successfully'
        };
    } catch (error) {
        console.error("Fetch My Earnings Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch earnings",
            data: null
        };
    }
};

// Update delivery status (Delivery Person)
export const updateDeliveryStatus = async (deliveryId, status) => {
    try {
        const response = await api.patch(`${DELIVERY_BASE_URL}/${deliveryId}/status`, { status });
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Delivery status updated successfully'
        };
    } catch (error) {
        console.error("Update Delivery Status Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update delivery status",
            data: null
        };
    }
};

// Track delivery by order ID (Customer)
export const trackDelivery = async (orderId) => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/track/${orderId}`);
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Delivery tracked successfully'
        };
    } catch (error) {
        console.error("Track Delivery Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to track delivery",
            data: null
        };
    }
};

// Legacy assign endpoint for backward compatibility
export const legacyAssignDeliveryPerson = async (orderId, deliveryPersonId) => {
    try {
        const response = await api.post(`${DELIVERY_BASE_URL}/assign/${orderId}`, null, {
            params: { delivery_person_id: deliveryPersonId }
        });
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Delivery person assigned successfully'
        };
    } catch (error) {
        console.error("Legacy Assign Delivery Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to assign delivery person",
            data: null
        };
    }
};

// Admin assign delivery person (legacy endpoint - same as above)
export const adminAssignDelivery = async (orderId, deliveryPersonId) => {
    try {
        const response = await api.post(`${DELIVERY_BASE_URL}/assign/${orderId}`, null, {
            params: { delivery_person_id: deliveryPersonId }
        });
        return {
            success: response.data?.success || true,
            data: response.data?.data || response.data,
            message: response.data?.message || 'Delivery person assigned successfully'
        };
    } catch (error) {
        console.error("Admin Assign Delivery Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to assign delivery person",
            data: null
        };
    }
};

// Export all functions
export default {
    // Regular functions
    fetchAllDeliveries,
    assignDeliveryPerson,
    trackDelivery,

    // Delivery person functions
    fetchMyAssignedOrders,
    fetchMyEarnings,
    updateDeliveryStatus,

    // Admin functions
    adminAssignDeliveryPerson: adminAssignDelivery, // Alias
    adminGetAllDeliveries,
    adminGetDeliveryStats,
    adminUpdateDeliveryStatus,
    adminReassignDeliveryPerson,
    adminGetDeliveryEarnings,
    adminGetDeliveryPersonPerformance,
    adminSearchDeliveries,
    adminGetDeliveryTimeline,
    adminCancelDelivery,
    adminValidateDeliveryCompletion,
    adminGetDeliveryIssues,
    adminGetAllDeliveryPersons,

    // New admin functions
    handleOrderCreatedWebhook,
    adminGetAvailableDeliveryPersons,
    adminGetDeliveryPool,
    adminNotifyDeliveryPerson,
    adminCancelDeliveryToPool
};