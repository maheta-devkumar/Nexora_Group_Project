import api from './api';

const OFFER_BASE_URL = `/marketing/offers`;

/* -----------------------------
   ✅ OFFER API FUNCTIONS
------------------------------ */

// Public: Get active offers
export const fetchActiveOffers = async () => {
    try {
        const response = await api.get(`${OFFER_BASE_URL}/active`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Active offers fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Active Offers Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to load active offers",
            data: []
        };
    }
};

// Admin: Get all offers
export const fetchAllOffers = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(OFFER_BASE_URL, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Offers fetched successfully"
        };
    } catch (error) {
        console.error("Fetch All Offers Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to load offers",
            data: []
        };
    }
};

// Admin: Get offer by ID
export const fetchOfferById = async (offerId) => {
    try {
        const response = await api.get(`${OFFER_BASE_URL}/${offerId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Offer fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Offer by ID Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to load offer",
            data: null
        };
    }
};

// Admin: Create offer
export const createOffer = async (offerData) => {
    try {
        const response = await api.post(OFFER_BASE_URL, offerData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Offer created successfully"
        };
    } catch (error) {
        console.error("Create Offer Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to create offer",
            data: null
        };
    }
};

// Admin: Update offer
export const updateOffer = async (offerId, offerData) => {
    try {
        const response = await api.patch(`${OFFER_BASE_URL}/${offerId}`, offerData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Offer updated successfully"
        };
    } catch (error) {
        console.error("Update Offer Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to update offer",
            data: null
        };
    }
};

// Admin: Update offer status
export const updateOfferStatus = async (offerId, isActive) => {
    try {
        const response = await api.patch(`${OFFER_BASE_URL}/${offerId}/status`, {
            is_active: isActive
        });
        return { 
            success: true, 
            message: response.data.message || "Offer status updated successfully"
        };
    } catch (error) {
        console.error("Update Offer Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to update offer status"
        };
    }
};

// Admin: Delete offer
export const deleteOffer = async (offerId) => {
    try {
        const response = await api.delete(`${OFFER_BASE_URL}/${offerId}`);
        return { 
            success: true, 
            message: response.data.message || "Offer deleted successfully"
        };
    } catch (error) {
        console.error("Delete Offer Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to delete offer"
        };
    }
};