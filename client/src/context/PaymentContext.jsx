import React, { createContext, useContext, useState, useCallback } from 'react';
import * as paymentApi from '../api/payment';

const PaymentContext = createContext();

export const usePaymentContext = () => {
    const context = useContext(PaymentContext);
    if (!context) {
        throw new Error('usePaymentContext must be used within PaymentProvider');
    }
    return context;
};

export const PaymentProvider = ({ children }) => {
    // State
    const [payments, setPayments] = useState([]);
    const [currentPayment, setCurrentPayment] = useState(null);
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

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setPayments([]);
        setCurrentPayment(null);
        setOperationLogs([]);
        setError(null);
        addLog('All payment data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Payment operation logs cleared', 'info');
    }, [addLog]);

    // Clear current payment
    const clearCurrentPayment = useCallback(() => {
        setCurrentPayment(null);
        addLog('Current payment cleared', 'info');
    }, [addLog]);

    // ===== INITIATE PAYMENT =====
    const initiatePayment = useCallback(async (paymentData) => {
        setLoading(true);
        setError(null);
        addLog('Initiating payment...', 'info');
        
        try {
            const result = await paymentApi.initiatePayment(paymentData);
            if (result.success) {
                setCurrentPayment(result.data);
                addLog('✅ Payment initiated successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to initiate payment: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to initiate payment';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Initiate payment endpoint not found';
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
            console.error('Initiate payment error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== VERIFY PAYMENT =====
    const verifyPayment = useCallback(async (verifyData) => {
        setLoading(true);
        setError(null);
        addLog('Verifying payment...', 'info');
        
        try {
            const result = await paymentApi.verifyPayment(verifyData);
            if (result.success) {
                addLog('✅ Payment verified successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to verify payment: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to verify payment';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Verify payment endpoint not found';
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
            console.error('Verify payment error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH PAYMENT HISTORY =====
    const fetchPaymentHistory = useCallback(async (page = 1, perPage = 20) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching payment history (page: ${page}, perPage: ${perPage})...`, 'info');
        
        try {
            const result = await paymentApi.fetchPaymentHistory(page, perPage);
            if (result.success) {
                if (page === 1) {
                    setPayments(result.data);
                } else {
                    setPayments(prev => [...prev, ...result.data]);
                }
                addLog(`✅ Payment history fetched: ${result.data.length} payments`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch payment history: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch payment history';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Payment history endpoint not found';
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
            console.error('Fetch payment history error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH PAYMENT BY ID =====
    const fetchPaymentById = useCallback(async (paymentId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching payment ID: ${paymentId}...`, 'info');
        
        try {
            const result = await paymentApi.fetchPaymentById(paymentId);
            if (result.success) {
                setCurrentPayment(result.data);
                addLog(`✅ Payment ${paymentId} details fetched`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch payment details: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch payment details';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Payment endpoint not found';
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
            console.error('Fetch payment by ID error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== CONFIRM PAYMENT =====
    const confirmPayment = useCallback(async (paymentId, gatewayData) => {
        setLoading(true);
        setError(null);
        addLog(`Confirming payment ID: ${paymentId}...`, 'info');
        
        try {
            const result = await paymentApi.confirmPayment(paymentId, gatewayData);
            if (result.success) {
                addLog('✅ Payment confirmed successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to confirm payment: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to confirm payment';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Confirm payment endpoint not found';
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
            console.error('Confirm payment error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH PAYMENT STATUS =====
    const fetchPaymentStatus = useCallback(async (paymentId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching payment status for ID: ${paymentId}...`, 'info');
        
        try {
            const result = await paymentApi.fetchPaymentStatus(paymentId);
            if (result.success) {
                addLog(`✅ Payment ${paymentId} status fetched`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch payment status: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch payment status';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Payment status endpoint not found';
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
            console.error('Fetch payment status error:', err);
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
            const result = await paymentApi.fetchPaymentMethods();
            if (result.success) {
                addLog(`✅ Payment methods fetched: ${result.data.length} methods`, 'success');
                return { success: true, data: result.data, isMock: result.isMock };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch payment methods: ${result.message}`, 'error');
                return { success: false, message: result.message };
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

    const value = {
        // State
        payments,
        currentPayment,
        loading,
        error,
        operationLogs,
        
        // Payment Functions
        initiatePayment,
        verifyPayment,
        fetchPaymentHistory,
        fetchPaymentById,
        confirmPayment,
        fetchPaymentStatus,
        fetchPaymentMethods,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        clearCurrentPayment,
        addLog
    };

    return (
        <PaymentContext.Provider value={value}>
            {children}
        </PaymentContext.Provider>
    );
};