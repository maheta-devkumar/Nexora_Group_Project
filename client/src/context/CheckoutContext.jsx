import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as checkoutApi from '../api/checkout';

const CheckoutContext = createContext();

export const useCheckoutContext = () => {
    const context = useContext(CheckoutContext);
    if (!context) {
        throw new Error('useCheckoutContext must be used within CheckoutProvider');
    }
    return context;
};

export const CheckoutProvider = ({ children }) => {
    // State
    const [checkoutSummary, setCheckoutSummary] = useState(() => {
        const saved = localStorage.getItem('checkoutSummary');
        return saved ? JSON.parse(saved) : null;
    });

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [verifiedAddress, setVerifiedAddress] = useState(() => {
        const saved = localStorage.getItem('verifiedAddress');
        return saved ? JSON.parse(saved) : null;
    });

    const [currentStep, setCurrentStep] = useState(() => {
        const saved = localStorage.getItem('currentStep');
        return saved ? parseInt(saved) : 1;
    });

    const [selectedPayment, setSelectedPayment] = useState(() => {
        const saved = localStorage.getItem('selectedPayment');
        return saved ? JSON.parse(saved) : null;
    });

    const [orderNotes, setOrderNotes] = useState(() => {
        const saved = localStorage.getItem('orderNotes');
        return saved ? JSON.parse(saved) : '';
    });

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);

    // Utility function to add logs
    const addLog = useCallback((message, type = 'info') => {
        const log = {
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        setOperationLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, []);

    // Save to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('checkoutSummary', JSON.stringify(checkoutSummary));
    }, [checkoutSummary]);

    useEffect(() => {
        localStorage.setItem('verifiedAddress', JSON.stringify(verifiedAddress));
    }, [verifiedAddress]);

    useEffect(() => {
        localStorage.setItem('currentStep', currentStep.toString());
    }, [currentStep]);

    useEffect(() => {
        localStorage.setItem('selectedPayment', JSON.stringify(selectedPayment));
    }, [selectedPayment]);

    useEffect(() => {
        localStorage.setItem('orderNotes', JSON.stringify(orderNotes));
    }, [orderNotes]);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setCheckoutSummary(null);
        setPaymentMethods([]);
        setVerifiedAddress(null);
        setCurrentStep(1);
        setSelectedPayment(null);
        setOrderNotes('');
        setCartItems([]);
        setOperationLogs([]);
        setError(null);

        // Clear localStorage
        localStorage.removeItem('checkoutSummary');
        localStorage.removeItem('verifiedAddress');
        localStorage.removeItem('currentStep');
        localStorage.removeItem('selectedPayment');
        localStorage.removeItem('orderNotes');

        addLog('All checkout data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Checkout operation logs cleared', 'info');
    }, [addLog]);

    // ===== INITIATE CHECKOUT =====
    const initiateCheckout = useCallback(async (addressId) => {
        setLoading(true);
        setError(null);
        addLog(`Initiating checkout with address ID: ${addressId}...`, 'info');

        try {
            const result = await checkoutApi.initiateCheckout(addressId);
            if (result.success) {
                setCheckoutSummary(result.data);
                addLog('✅ Checkout initiated successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to initiate checkout: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to initiate checkout';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Checkout endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Initiate checkout error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== CONFIRM CHECKOUT =====
    const confirmCheckout = useCallback(async (checkoutData) => {
        setLoading(true);
        setError(null);
        addLog('Confirming checkout and creating order...', 'info');

        try {
            const result = await checkoutApi.confirmCheckout(checkoutData);
            if (result.success) {
                addLog('✅ Order placed successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to confirm checkout: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to confirm checkout';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Confirm checkout endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Confirm checkout error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH PAYMENT METHODS =====
    const fetchPaymentMethods = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching payment methods...', 'info');

        try {
            const result = await checkoutApi.fetchPaymentMethods();
            if (result.success) {
                setPaymentMethods(result.data);
                addLog(`✅ Payment methods fetched: ${result.data.length} methods`, 'success');
                return { success: true, data: result.data };
            } else {
                // Fallback to mock data if API fails
                const mockPaymentMethods = [
                    {
                        id: 1,
                        method: 'COD',
                        name: 'Cash on Delivery',
                        icon: 'fa-money-bill-wave',
                        description: 'Pay when you receive your order',
                        available: true
                    },
                    {
                        id: 2,
                        method: 'ONLINE', // Updated to match backend requirement
                        name: 'Razorpay / UPI / Cards',
                        icon: 'fa-credit-card',
                        description: 'Pay securely with Razorpay, UPI, or Cards',
                        available: true
                    }
                ];

                setPaymentMethods(mockPaymentMethods);
                addLog(`⚠️ Using mock payment methods (${mockPaymentMethods.length})`, 'warning');
                return { success: true, data: mockPaymentMethods, isMock: true };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch payment methods';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Payment methods endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch payment methods error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PROCESS PAYMENT =====
    const processPayment = useCallback(async (paymentData) => {
        setLoading(true);
        setError(null);
        addLog('Processing payment...', 'info');

        try {
            const result = await checkoutApi.processPayment(paymentData);
            if (result.success) {
                addLog('✅ Payment processed successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to process payment: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to process payment';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Process payment endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Process payment error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== VALIDATE CHECKOUT =====
    const validateCheckout = useCallback(async (checkoutData) => {
        setLoading(true);
        setError(null);
        addLog('Validating checkout data...', 'info');

        try {
            const result = await checkoutApi.validateCheckout(checkoutData);
            if (result.success) {
                const isValid = result.data?.is_valid || result.data?.isValid || false;
                const errors = result.data?.errors || [];

                if (isValid) {
                    addLog('✅ Checkout validation passed', 'success');
                } else {
                    addLog(`⚠️ Checkout validation failed: ${errors.join(', ')}`, 'warning');
                }

                return {
                    success: true,
                    data: result.data,
                    isValid,
                    errors
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to validate checkout: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to validate checkout';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Validate checkout endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Validate checkout error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH ORDER SUMMARY =====
    const fetchOrderSummary = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching order summary for order: ${orderId}...`, 'info');

        try {
            const result = await checkoutApi.fetchOrderSummary(orderId);
            if (result.success) {
                addLog('✅ Order summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch order summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch order summary';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Order summary endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch order summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== APPLY COUPON =====
    const applyCoupon = useCallback(async (couponCode) => {
        setLoading(true);
        setError(null);
        addLog(`Applying coupon: ${couponCode}...`, 'info');

        try {
            const result = await checkoutApi.applyCoupon(couponCode);
            if (result.success) {
                addLog('✅ Coupon applied successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to apply coupon: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to apply coupon';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Apply coupon endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Apply coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== REMOVE COUPON =====
    const removeCoupon = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Removing coupon...', 'info');

        try {
            const result = await checkoutApi.removeCoupon();
            if (result.success) {
                addLog('✅ Coupon removed successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to remove coupon: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to remove coupon';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Remove coupon endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Remove coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH SHIPPING METHODS =====
    const fetchShippingMethods = useCallback(async (addressId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching shipping methods for address: ${addressId}...`, 'info');

        try {
            const result = await checkoutApi.fetchShippingMethods(addressId);
            if (result.success) {
                addLog(`✅ Shipping methods fetched: ${result.data.length} methods`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch shipping methods: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch shipping methods';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Shipping methods endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch shipping methods error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== UPDATE SHIPPING METHOD =====
    const updateShippingMethod = useCallback(async (shippingMethodId) => {
        setLoading(true);
        setError(null);
        addLog(`Updating shipping method: ${shippingMethodId}...`, 'info');

        try {
            const result = await checkoutApi.updateShippingMethod(shippingMethodId);
            if (result.success) {
                addLog('✅ Shipping method updated successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update shipping method: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to update shipping method';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Update shipping method endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update shipping method error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH CHECKOUT DETAILS =====
    const fetchCheckoutDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching checkout details...', 'info');

        try {
            const result = await checkoutApi.fetchCheckoutDetails();
            if (result.success) {
                addLog('✅ Checkout details fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch checkout details: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch checkout details';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Checkout details endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch checkout details error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== UPDATE CHECKOUT ADDRESS =====
    const updateCheckoutAddress = useCallback(async (addressId) => {
        setLoading(true);
        setError(null);
        addLog(`Updating checkout address: ${addressId}...`, 'info');

        try {
            const result = await checkoutApi.updateCheckoutAddress(addressId);
            if (result.success) {
                setVerifiedAddress(result.data?.address || null);
                addLog('✅ Checkout address updated successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update checkout address: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to update checkout address';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Update checkout address endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update checkout address error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // Helper function for client-side validation
    const validateCheckoutData = useCallback(() => {
        const errors = [];

        if (!verifiedAddress) {
            errors.push('Shipping address is required');
        }

        if (currentStep >= 2 && !selectedPayment) {
            errors.push('Payment method is required');
        }

        if (orderNotes && orderNotes.length > 500) {
            errors.push('Order notes cannot exceed 500 characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }, [verifiedAddress, selectedPayment, orderNotes, currentStep]);

    // Get checkout progress
    const getCheckoutProgress = useCallback(() => {
        const steps = [
            { number: 1, title: 'Address', completed: !!verifiedAddress },
            { number: 2, title: 'Payment', completed: !!selectedPayment },
            { number: 3, title: 'Review', completed: false }
        ];

        const completedSteps = steps.filter(step => step.completed).length;
        const progress = (completedSteps / steps.length) * 100;

        return {
            steps,
            completedSteps,
            progress,
            canProceedToPayment: !!verifiedAddress,
            canProceedToReview: !!verifiedAddress && !!selectedPayment,
            canPlaceOrder: !!verifiedAddress && !!selectedPayment
        };
    }, [verifiedAddress, selectedPayment]);

    // State setters
    const setVerifiedAddressHandler = useCallback((address) => {
        setVerifiedAddress(address);
        addLog(`Address set: ${address?.address_line1 || 'Unknown'}`, 'info');
    }, [addLog]);

    const setCurrentStepHandler = useCallback((step) => {
        setCurrentStep(step);
        addLog(`Step changed to: ${step}`, 'info');
    }, [addLog]);

    const setSelectedPaymentHandler = useCallback((payment) => {
        setSelectedPayment(payment);
        addLog(`Payment method selected: ${payment?.name || 'Unknown'}`, 'info');
    }, [addLog]);

    const setOrderNotesHandler = useCallback((notes) => {
        setOrderNotes(notes);
        addLog(`Order notes updated (${notes.length} chars)`, 'info');
    }, [addLog]);

    const setCartItemsHandler = useCallback((cart) => {
        setCartItems(cart?.items || []);
        addLog(`Cart items updated: ${cart?.items?.length || 0} items`, 'info');
    }, [addLog]);

    // Reset checkout (alias for clearAllData)
    const resetCheckout = useCallback(() => {
        clearAllData();
        addLog('Checkout reset', 'info');
    }, [clearAllData, addLog]);

    const value = {
        // State
        checkoutSummary,
        paymentMethods,
        verifiedAddress,
        currentStep,
        selectedPayment,
        orderNotes,
        cartItems,
        loading,
        error,
        operationLogs,
        setCheckoutSummary,
        // State setters
        setVerifiedAddress: setVerifiedAddressHandler,
        setCurrentStep: setCurrentStepHandler,
        setSelectedPayment: setSelectedPaymentHandler,
        setOrderNotes: setOrderNotesHandler,
        setCartItems: setCartItemsHandler,

        // API Functions
        initiateCheckout,
        confirmCheckout,
        fetchPaymentMethods,
        processPayment,
        validateCheckout,
        fetchOrderSummary,
        applyCoupon,
        removeCoupon,
        fetchShippingMethods,
        updateShippingMethod,
        fetchCheckoutDetails,
        updateCheckoutAddress,

        // Utility Functions
        validateCheckoutData,
        getCheckoutProgress,
        resetCheckout,
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog
    };

    return (
        <CheckoutContext.Provider value={value}>
            {children}
        </CheckoutContext.Provider>
    );
};