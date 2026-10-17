import api from './api';

const COUPON_BASE_URL = `/marketing/coupons`;

/* -----------------------------
   ✅ COUPON API FUNCTIONS
------------------------------ */

// Public: Get active coupons
export const fetchActiveCoupons = async () => {
    try {
        const response = await api.get(`${COUPON_BASE_URL}/active`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Active coupons fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Active Coupons Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to load active coupons",
            data: []
        };
    }
};

// Public: Validate coupon
export const validateCoupon = async (couponCode, variantIds, orderTotal) => {
    try {
        const response = await api.post(`${COUPON_BASE_URL}/validate`, {
            coupon_code: couponCode,
            variant_ids: variantIds,
            order_total: parseFloat(orderTotal)
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Coupon validated successfully"
        };
    } catch (error) {
        console.error("Validate Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Coupon validation failed",
            data: null
        };
    }
};

// Admin: Get all coupons
export const fetchAllCoupons = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(COUPON_BASE_URL, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Coupons fetched successfully"
        };
    } catch (error) {
        console.error("Fetch All Coupons Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to load coupons",
            data: []
        };
    }
};

// Admin: Get coupon by ID
export const fetchCouponById = async (couponId) => {
    try {
        const response = await api.get(`${COUPON_BASE_URL}/${couponId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Coupon fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Coupon by ID Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to load coupon",
            data: null
        };
    }
};

// Admin: Create coupon
export const createCoupon = async (couponData) => {
    try {
        const response = await api.post(COUPON_BASE_URL, couponData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Coupon created successfully"
        };
    } catch (error) {
        console.error("Create Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to create coupon",
            data: null
        };
    }
};

// Admin: Update coupon
export const updateCoupon = async (couponId, couponData) => {
    try {
        const response = await api.patch(`${COUPON_BASE_URL}/${couponId}`, couponData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Coupon updated successfully"
        };
    } catch (error) {
        console.error("Update Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to update coupon",
            data: null
        };
    }
};

// Admin: Update coupon status
export const updateCouponStatus = async (couponId, isActive) => {
    try {
        const response = await api.patch(`${COUPON_BASE_URL}/${couponId}/status`, {
            is_active: isActive
        });
        return { 
            success: true, 
            message: response.data.message || "Coupon status updated successfully"
        };
    } catch (error) {
        console.error("Update Coupon Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to update coupon status"
        };
    }
};

// Admin: Delete coupon
export const deleteCoupon = async (couponId) => {
    try {
        const response = await api.delete(`${COUPON_BASE_URL}/${couponId}`);
        return { 
            success: true, 
            message: response.data.message || "Coupon deleted successfully"
        };
    } catch (error) {
        console.error("Delete Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to delete coupon"
        };
    }
};