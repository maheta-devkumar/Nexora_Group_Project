import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as orderApi from '../api/order';

const OrderContext = createContext();

export const useOrderContext = () => {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrderContext must be used within OrderProvider');
    }
    return context;
};

export const OrderProvider = ({ children }) => {
    // State
    const [orders, setOrders] = useState([]);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);
    
    // Refs for preventing duplicate calls
    const isProcessingOrder = useRef(false);
    const lastOrderRequest = useRef(null);
    const orderRequestTimeout = useRef(null);

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
        setOrders([]);
        setCurrentOrder(null);
        setOperationLogs([]);
        setError(null);
        isProcessingOrder.current = false;
        lastOrderRequest.current = null;
        if (orderRequestTimeout.current) {
            clearTimeout(orderRequestTimeout.current);
            orderRequestTimeout.current = null;
        }
        addLog('All order data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Order operation logs cleared', 'info');
    }, [addLog]);

    // Clear current order
    const clearCurrentOrder = useCallback(() => {
        setCurrentOrder(null);
        addLog('Current order cleared', 'info');
    }, [addLog]);

    // Generate request signature for deduplication
    const generateOrderSignature = useCallback((orderData) => {
        const itemsSignature = (orderData.items || [])
            .map(item => `${item.variant_id || item.id}-${item.quantity}`)
            .sort()
            .join('|');
        
        return JSON.stringify({
            address_id: orderData.address_id,
            items_signature: itemsSignature
        });
    }, []);

    // ===== CREATE ORDER ===== (WITH DEDUPLICATION)
    const createOrder = useCallback(async (orderData) => {
        // Prevent multiple simultaneous order creations
        if (isProcessingOrder.current) {
            const errorMsg = 'Order creation already in progress. Please wait...';
            console.warn('⚠️ OrderContext: ' + errorMsg);
            addLog('⚠️ ' + errorMsg, 'warning');
            return { 
                success: false, 
                message: errorMsg,
                isDuplicate: true
            };
        }
        
        // Check for identical recent request (within last 5 seconds)
        const requestSignature = generateOrderSignature(orderData);
        const currentTime = Date.now();
        
        if (lastOrderRequest.current && 
            lastOrderRequest.current.signature === requestSignature &&
            (currentTime - lastOrderRequest.current.timestamp < 5000)) {
            
            const errorMsg = 'Similar order request was recently processed. Please wait 5 seconds.';
            console.warn('⚠️ OrderContext: ' + errorMsg);
            addLog('⚠️ ' + errorMsg, 'warning');
            return { 
                success: false, 
                message: errorMsg,
                isDuplicate: true
            };
        }
        
        // Set processing flag
        isProcessingOrder.current = true;
        lastOrderRequest.current = {
            signature: requestSignature,
            timestamp: currentTime
        };
        
        setLoading(true);
        setError(null);
        addLog('🚀 Creating new order...', 'info');
        
        try {
            console.log('📝 OrderContext: Creating order with data:', orderData);
            
            const result = await orderApi.createOrder(orderData);
            
            if (result.success) {
                setOrders(prev => [result.data, ...prev]);
                setCurrentOrder(result.data);
                addLog('✅ Order created successfully', 'success');
                
                // Reset processing flag after successful creation
                setTimeout(() => {
                    isProcessingOrder.current = false;
                }, 2000); // Keep blocked for 2 seconds after success
                
                return { 
                    success: true, 
                    data: result.data, 
                    message: result.message 
                };
            } else {
                // Enhanced error handling
                let errorMessage = result.message;
                
                if (result.validationErrors && result.validationErrors.length > 0) {
                    errorMessage = `Validation errors: ${result.validationErrors.join(', ')}`;
                }
                
                setError(errorMessage);
                addLog(`❌ Failed to create order: ${errorMessage}`, 'error');
                
                // Reset processing flag on error
                isProcessingOrder.current = false;
                
                return { 
                    success: false, 
                    message: errorMessage,
                    validationErrors: result.validationErrors || []
                };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'An unexpected error occurred while creating your order';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Create order endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            } else if (status === 401 || status === 403) {
                // Handle 401/403 errors
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            } else {
                setError(errorMsg);
                addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
                console.error('OrderContext: Unexpected error:', err);
            }
            
            // Reset processing flag on error
            isProcessingOrder.current = false;
            
            return { 
                success: false, 
                message: errorMsg 
            };
        } finally {
            setLoading(false);
            
            // Clear the last request cache after 10 seconds
            if (orderRequestTimeout.current) {
                clearTimeout(orderRequestTimeout.current);
            }
            orderRequestTimeout.current = setTimeout(() => {
                lastOrderRequest.current = null;
                console.log('🧹 OrderContext: Cleared request cache');
            }, 10000);
        }
    }, [addLog, generateOrderSignature]);

    // ===== FETCH USER ORDERS =====
    const fetchUserOrders = useCallback(async (page = 1, perPage = 20, status = null) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching orders page ${page}, perPage ${perPage}, status ${status}...`, 'info');
        
        try {
            console.log(`📋 OrderContext: Fetching orders...`);
            
            const result = await orderApi.fetchUserOrders(page, perPage, status);
            
            console.log(`✅ OrderContext: API result:`, result);
            
            if (result.success) {
                console.log(`📦 OrderContext: Received ${result.data?.length || 0} orders`);
                
                if (page === 1) {
                    setOrders(result.data || []);
                } else {
                    setOrders(prev => [...prev, ...(result.data || [])]);
                }
                
                addLog(`✅ Orders fetched: ${result.data?.length || 0} orders`, 'success');
                return { 
                    success: true, 
                    data: result.data || [],
                    pagination: result.pagination,
                    isMock: result.isMock 
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch orders: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch orders';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Orders endpoint not found';
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
            console.error('OrderContext: Unexpected error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH ORDER BY ID =====
    const fetchOrderById = useCallback(async (orderId) => {
        // Reset current order first
        setCurrentOrder(null);
        setError(null);
        setLoading(true);
        
        addLog(`Fetching order ID: ${orderId}...`, 'info');
        
        try {
            console.log(`🔍 OrderContext: Fetching order with ID: ${orderId}`);
            
            const result = await orderApi.fetchOrderById(orderId);
            
            if (result.success) {
                console.log('✅ OrderContext: Order fetched successfully:', result.data);
                setCurrentOrder(result.data);
                setError(null);
                addLog(`✅ Order ${orderId} fetched successfully`, 'success');
                return { 
                    success: true, 
                    data: result.data,
                    isMock: result.isMock 
                };
            } else {
                console.error('❌ OrderContext: Failed to fetch order:', result.message);
                setError(result.message);
                setCurrentOrder(null);
                addLog(`❌ Failed to fetch order: ${result.message}`, 'error');
                return { 
                    success: false, 
                    message: result.message 
                };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch order details';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Order endpoint not found';
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
            setCurrentOrder(null);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('🔥 OrderContext: Unexpected error in fetchOrderById:', err);
            return { 
                success: false, 
                message: errorMsg 
            };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== CANCEL ORDER =====
    const cancelOrder = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        addLog(`Cancelling order ID: ${orderId}...`, 'info');
        
        try {
            const result = await orderApi.cancelOrder(orderId);
            if (result.success) {
                setOrders(prev => 
                    prev.map(order => 
                        order.order_id === orderId 
                            ? { ...order, order_status: 'CANCELLED' }
                            : order
                    )
                );
                if (currentOrder?.order_id === orderId) {
                    setCurrentOrder(prev => ({ ...prev, order_status: 'CANCELLED' }));
                }
                addLog(`✅ Order ${orderId} cancelled successfully`, 'success');
                return { 
                    success: true, 
                    data: result.data,
                    message: result.message 
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to cancel order: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to cancel order';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Cancel order endpoint not found';
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
            console.error('Cancel order error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentOrder, addLog]);

    // ===== CREATE RETURN REQUEST =====
    const createReturnRequest = useCallback(async (orderId, returnData) => {
        setLoading(true);
        setError(null);
        addLog(`Creating return request for order ID: ${orderId}...`, 'info');
        
        try {
            const result = await orderApi.createReturnRequest(orderId, returnData);
            if (result.success) {
                addLog('✅ Return request submitted successfully', 'success');
                return { 
                    success: true, 
                    data: result.data, 
                    message: result.message 
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to create return request: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to create return request';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Return request endpoint not found';
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
            console.error('Create return request error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const value = {
        // State
        orders,
        currentOrder,
        loading,
        error,
        operationLogs,
        
        // Order Functions
        createOrder,
        fetchUserOrders,
        fetchOrderById,
        cancelOrder,
        createReturnRequest,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        clearCurrentOrder,
        addLog
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
};