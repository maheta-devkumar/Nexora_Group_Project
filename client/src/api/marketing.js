import api from './api';

const MARKETING_BASE_URL = `/marketing`;

// ==================== COUPONS ====================
export const fetchAllCoupons = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(`${MARKETING_BASE_URL}/coupons?skip=${skip}&limit=${limit}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Coupons Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch coupons",
            data: []
        };
    }
};

export const fetchActiveCoupons = async () => {
    try {
        const response = await api.get(`${MARKETING_BASE_URL}/coupons/active`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Active Coupons Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch active coupons",
            data: []
        };
    }
};

export const fetchCouponById = async (couponId) => {
    try {
        const response = await api.get(`${MARKETING_BASE_URL}/coupons/${couponId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch coupon"
        };
    }
};

export const createCoupon = async (couponData) => {
    try {
        const response = await api.post(`${MARKETING_BASE_URL}/coupons`, couponData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Create Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to create coupon"
        };
    }
};

export const updateCoupon = async (couponId, updateData) => {
    try {
        const response = await api.patch(`${MARKETING_BASE_URL}/coupons/${couponId}`, updateData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update coupon"
        };
    }
};

export const updateCouponStatus = async (couponId, isActive) => {
    try {
        const response = await api.patch(`${MARKETING_BASE_URL}/coupons/${couponId}/status`, { is_active: isActive });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Coupon Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update coupon status"
        };
    }
};

export const deleteCoupon = async (couponId) => {
    try {
        const response = await api.delete(`${MARKETING_BASE_URL}/coupons/${couponId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Delete Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete coupon"
        };
    }
};

export const validateCoupon = async (couponCode, variantIds, orderTotal) => {
    try {
        const response = await api.post(`${MARKETING_BASE_URL}/coupons/validate`, {
            coupon_code: couponCode,
            variant_ids: variantIds,
            order_total: orderTotal
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Validate Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to validate coupon",
            data: { valid: false, discount_amount: 0, message: "Validation failed" }
        };
    }
};

// ==================== OFFERS ====================
export const fetchAllOffers = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(`${MARKETING_BASE_URL}/offers?skip=${skip}&limit=${limit}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Offers Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch offers",
            data: []
        };
    }
};

export const fetchActiveOffers = async () => {
    try {
        const response = await api.get(`${MARKETING_BASE_URL}/offers/active`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Active Offers Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch active offers",
            data: []
        };
    }
};

export const fetchOfferById = async (offerId) => {
    try {
        const response = await api.get(`${MARKETING_BASE_URL}/offers/${offerId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Offer Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch offer"
        };
    }
};

export const createOffer = async (offerData) => {
    try {
        const response = await api.post(`${MARKETING_BASE_URL}/offers`, offerData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Create Offer Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to create offer"
        };
    }
};

export const updateOffer = async (offerId, updateData) => {
    try {
        const response = await api.patch(`${MARKETING_BASE_URL}/offers/${offerId}`, updateData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Offer Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update offer"
        };
    }
};

export const updateOfferStatus = async (offerId, isActive) => {
    try {
        const response = await api.patch(`${MARKETING_BASE_URL}/offers/${offerId}/status`, { is_active: isActive });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Offer Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update offer status"
        };
    }
};

export const deleteOffer = async (offerId) => {
    try {
        const response = await api.delete(`${MARKETING_BASE_URL}/offers/${offerId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Delete Offer Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete offer"
        };
    }
};