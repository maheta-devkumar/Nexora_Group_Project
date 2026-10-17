// src/api/delivery_panel/pending_pickups.js
import api from '../api';

const DELIVERY_PICKUP_BASE_URL = `/delivery_panel/pickups`;

/* -----------------------------
   ✅ DELIVERY PICKUPS API FUNCTIONS
------------------------------ */

// Get all pending pickups
export const fetchPendingPickups = async (filters = {}) => {
    try {
        const params = new URLSearchParams();

        if (filters.vendor_type) params.append('vendor_type', filters.vendor_type);
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.pickup_location_id) params.append('pickup_location_id', filters.pickup_location_id);

        const url = `${DELIVERY_PICKUP_BASE_URL}/pending${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await api.get(url);
        return {
            success: true,
            data: response.data,
            message: "Pending pickups fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Pending Pickups Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch pending pickups",
            data: { pending_pickups: [], grouped_by_location: [], stats: {}, total_count: 0 }
        };
    }
};

// Get specific pickup details
export const fetchPickupDetails = async (deliveryId) => {
    try {
        const response = await api.get(`${DELIVERY_PICKUP_BASE_URL}/${deliveryId}`);
        return {
            success: true,
            data: response.data,
            message: "Pickup details fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Pickup Details Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch pickup details",
            data: { pickup: null, order_details: {}, vendor_contact: null, pickup_instructions: "", qr_requirements: [] }
        };
    }
};

// Confirm pickup after QR verification
export const confirmPickup = async (deliveryId, notes = null, podImageUrl = null, signatureUrl = null) => {
    try {
        const requestData = {
            delivery_id: deliveryId,
            notes: notes,
            pod_image_url: podImageUrl,
            signature_url: signatureUrl
        };

        const response = await api.post(`${DELIVERY_PICKUP_BASE_URL}/${deliveryId}/confirm`, requestData);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Pickup confirmed successfully"
        };
    } catch (error) {
        console.error("Confirm Pickup Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to confirm pickup",
            data: null
        };
    }
};

// Get vendor contact information
export const fetchVendorContact = async (deliveryId) => {
    try {
        const response = await api.get(`${DELIVERY_PICKUP_BASE_URL}/${deliveryId}/call`);
        return {
            success: true,
            data: response.data,
            message: "Vendor contact fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Vendor Contact Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch vendor contact",
            data: null
        };
    }
};

// Get navigation details
export const fetchPickupNavigation = async (deliveryId) => {
    try {
        const response = await api.get(`${DELIVERY_PICKUP_BASE_URL}/${deliveryId}/navigation`);
        return {
            success: true,
            data: response.data,
            message: "Navigation details fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Navigation Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch navigation details",
            data: null
        };
    }
};

// Get optimized route
export const fetchOptimizedRoute = async () => {
    try {
        const response = await api.get(`${DELIVERY_PICKUP_BASE_URL}/optimize/route`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Optimized route fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Optimized Route Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch optimized route",
            data: null
        };
    }
};

// Get pickup statistics
export const fetchPickupStatistics = async () => {
    try {
        const response = await api.get(`${DELIVERY_PICKUP_BASE_URL}/statistics/summary`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Pickup statistics fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Pickup Statistics Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch pickup statistics",
            data: null
        };
    }
};

// Health check
export const checkPickupHealth = async () => {
    try {
        const response = await api.get(`${DELIVERY_PICKUP_BASE_URL}/health`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Pickup module is healthy"
        };
    } catch (error) {
        console.error("Pickup Health Check Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Pickup module health check failed",
            data: null
        };
    }
};