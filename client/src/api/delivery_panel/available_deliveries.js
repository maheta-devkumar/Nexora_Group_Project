import api from '../api';

const DELIVERY_BASE_URL = `/delivery_panel`;

/* -----------------------------
   ✅ AVAILABLE DELIVERIES API FUNCTIONS
   (Based on your exact backend routes)
------------------------------ */

// Get available deliveries for delivery person
export const fetchAvailableDeliveries = async () => {
    try {
        const response = await api.get(`${DELIVERY_BASE_URL}/available`);
        return { 
            success: true, 
            data: response.data || [],
            message: "Available deliveries fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Available Deliveries Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch available deliveries",
            data: []
        };
    }
};

// Accept an available delivery
export const acceptAvailableDelivery = async (deliveryId) => {
    try {
        const response = await api.post(`${DELIVERY_BASE_URL}/available/${deliveryId}/accept`);
        return { 
            success: true, 
            data: response.data,
            message: response.data?.message || "Delivery accepted successfully"
        };
    } catch (error) {
        console.error("Accept Delivery Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to accept delivery",
            data: null
        };
    }
};

// Cancel/Reject a delivery
export const cancelDelivery = async (deliveryId) => {
    try {
        const response = await api.post(`${DELIVERY_BASE_URL}/${deliveryId}/cancel`);
        return { 
            success: true, 
            data: response.data,
            message: response.data?.message || "Delivery cancelled successfully"
        };
    } catch (error) {
        console.error("Cancel Delivery Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to cancel delivery",
            data: null
        };
    }
};

// Export all functions
export default {
    fetchAvailableDeliveries,
    acceptAvailableDelivery,
    cancelDelivery
};