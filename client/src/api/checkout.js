import api from './api';

const CHECKOUT_BASE_URL = `/checkout`;
const PAYMENTS_BASE_URL = `/payments`;

/* -----------------------------
   ✅ CHECKOUT API FUNCTIONS
------------------------------ */

// Initiate checkout
export const initiateCheckout = async (addressId) => {
    try {
        const response = await api.get(`${CHECKOUT_BASE_URL}/initiate/${addressId}`);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Checkout initiated successfully"
        };
    } catch (error) {
        console.error("Initiate Checkout Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to initiate checkout",
            data: null
        };
    }
};

// Confirm checkout
export const confirmCheckout = async (checkoutData) => {
    try {
        const response = await api.post(`${CHECKOUT_BASE_URL}/confirm`, checkoutData);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Order placed successfully"
        };
    } catch (error) {
        console.error("Confirm Checkout Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to confirm checkout",
            data: null
        };
    }
};

// Get payment methods
export const fetchPaymentMethods = async () => {
    try {
        const response = await api.get(`${PAYMENTS_BASE_URL}/methods`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Payment methods fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Payment Methods Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Failed to fetch payment methods",
            data: []
        };
    }
};

// Process payment
export const processPayment = async (paymentData) => {
    try {
        const response = await api.post(`${PAYMENTS_BASE_URL}/process`, paymentData);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Payment processed successfully"
        };
    } catch (error) {
        console.error("Process Payment Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to process payment",
            data: null
        };
    }
};

// Validate checkout
export const validateCheckout = async (checkoutData) => {
    try {
        const response = await api.post(`${CHECKOUT_BASE_URL}/validate`, checkoutData);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Checkout validated successfully"
        };
    } catch (error) {
        console.error("Validate Checkout Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to validate checkout",
            data: null
        };
    }
};

// Get order summary
export const fetchOrderSummary = async (orderId) => {
    try {
        const response = await api.get(`${CHECKOUT_BASE_URL}/orders/${orderId}/summary`);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Order summary fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Order Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch order summary",
            data: null
        };
    }
};

// Apply coupon
export const applyCoupon = async (couponCode) => {
    try {
        const response = await api.post(`${CHECKOUT_BASE_URL}/apply-coupon`, {
            coupon_code: couponCode
        });
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Coupon applied successfully"
        };
    } catch (error) {
        console.error("Apply Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to apply coupon",
            data: null
        };
    }
};

// Remove coupon
export const removeCoupon = async () => {
    try {
        const response = await api.delete(`${CHECKOUT_BASE_URL}/remove-coupon`);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Coupon removed successfully"
        };
    } catch (error) {
        console.error("Remove Coupon Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to remove coupon",
            data: null
        };
    }
};

// Get shipping methods
export const fetchShippingMethods = async (addressId) => {
    try {
        const response = await api.get(`${CHECKOUT_BASE_URL}/shipping-methods/${addressId}`);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Shipping methods fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Shipping Methods Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch shipping methods",
            data: []
        };
    }
};

// Update shipping method
export const updateShippingMethod = async (shippingMethodId) => {
    try {
        const response = await api.post(`${CHECKOUT_BASE_URL}/update-shipping`, {
            shipping_method_id: shippingMethodId
        });
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Shipping method updated successfully"
        };
    } catch (error) {
        console.error("Update Shipping Method Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update shipping method",
            data: null
        };
    }
};

// Get checkout details
export const fetchCheckoutDetails = async () => {
    try {
        const response = await api.get(`${CHECKOUT_BASE_URL}/details`);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Checkout details fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Checkout Details Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch checkout details",
            data: null
        };
    }
};

// Update checkout address
export const updateCheckoutAddress = async (addressId) => {
    try {
        const response = await api.post(`${CHECKOUT_BASE_URL}/update-address`, {
            address_id: addressId
        });
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || "Address updated successfully"
        };
    } catch (error) {
        console.error("Update Checkout Address Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update address",
            data: null
        };
    }
};