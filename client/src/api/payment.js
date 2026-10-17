import api from './api';

const PAYMENT_BASE_URL = `/payments`;

/* -----------------------------
   ✅ PAYMENT API FUNCTIONS
------------------------------ */

// Initiate payment
export const initiatePayment = async (paymentData) => {
    try {
        const response = await api.post(`${PAYMENT_BASE_URL}/initiate`, paymentData);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || 'Payment initiated successfully'
        };
    } catch (error) {
        console.error("Initiate Payment Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.data?.detail || 'Failed to initiate payment',
            data: null
        };
    }
};

// Verify payment
export const verifyPayment = async (verifyData) => {
    try {
        const response = await api.post(`${PAYMENT_BASE_URL}/verify`, verifyData);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || 'Payment verified successfully'
        };
    } catch (error) {
        console.error("Verify Payment Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.data?.detail || 'Payment verification failed',
            data: null
        };
    }
};

// Get payment history
export const fetchPaymentHistory = async (page = 1, perPage = 20) => {
    try {
        const response = await api.get(`${PAYMENT_BASE_URL}/history`, {
            params: { page, per_page: perPage }
        });
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || 'Payment history fetched successfully'
        };
    } catch (error) {
        console.error("Fetch Payment History Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch payment history',
            data: []
        };
    }
};

// Get payment by ID
export const fetchPaymentById = async (paymentId) => {
    try {
        const response = await api.get(`${PAYMENT_BASE_URL}/${paymentId}`);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || 'Payment details fetched successfully'
        };
    } catch (error) {
        console.error("Fetch Payment by ID Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch payment details',
            data: null
        };
    }
};

// Confirm payment
export const confirmPayment = async (paymentId, gatewayData) => {
    try {
        const response = await api.post(`${PAYMENT_BASE_URL}/${paymentId}/confirm`, {
            gateway_data: gatewayData
        });
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || 'Payment confirmed successfully'
        };
    } catch (error) {
        console.error("Confirm Payment Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.data?.detail || 'Failed to confirm payment',
            data: null
        };
    }
};

// Get payment status
export const fetchPaymentStatus = async (paymentId) => {
    try {
        const response = await api.get(`${PAYMENT_BASE_URL}/${paymentId}/status`);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || 'Payment status fetched successfully'
        };
    } catch (error) {
        console.error("Fetch Payment Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch payment status',
            data: null
        };
    }
};

// Get available payment methods
export const fetchPaymentMethods = async () => {
    try {
        const response = await api.get(`${PAYMENT_BASE_URL}/methods`);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || 'Payment methods fetched successfully'
        };
    } catch (error) {
        console.error("Fetch Payment Methods Error:", error.response?.data || error.message);
        
        // Return mock data for development
        const mockMethods = [
            {
                id: 1,
                method: 'card',
                name: 'Credit/Debit Card',
                icon: 'fa-credit-card',
                description: 'Pay securely with your credit or debit card',
                supported_cards: ['visa', 'mastercard', 'amex']
            },
            {
                id: 2,
                method: 'paypal',
                name: 'PayPal',
                icon: 'fa-paypal',
                description: 'Pay with your PayPal account',
                supported_cards: []
            },
            {
                id: 3,
                method: 'upi',
                name: 'UPI Payment',
                icon: 'fa-mobile-alt',
                description: 'Instant payment using UPI',
                supported_cards: []
            },
            {
                id: 4,
                method: 'netbanking',
                name: 'Net Banking',
                icon: 'fa-university',
                description: 'Pay using your bank account',
                supported_cards: []
            }
        ];
        
        return { 
            success: true, 
            data: mockMethods,
            isMock: true,
            message: 'Using mock payment methods for development'
        };
    }
};