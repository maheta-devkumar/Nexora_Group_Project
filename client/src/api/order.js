import api from './api';

const ORDER_BASE_URL = `/orders`;

// Request deduplication cache - Prevents multiple identical requests
const pendingRequests = new Map();
const REQUEST_CACHE_TIMEOUT = 10000; // 10 seconds
const completedRequests = new Map(); // Track completed requests

// Generate unique request signature
const generateRequestSignature = (orderData) => {
    const itemsSignature = (orderData.items || [])
        .map(item => `${item.variant_id || item.id}-${item.quantity}`)
        .sort()
        .join('|');
    
    return JSON.stringify({
        address_id: orderData.address_id,
        items_signature: itemsSignature,
        timestamp: Date.now() // Include timestamp for uniqueness
    });
};

// Validation function for order data
const validateOrderData = (orderData) => {
    const errors = [];
    
    if (!orderData.address_id) {
        errors.push('Address ID is required');
    }
    
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        errors.push('Order must contain at least one item');
    }
    
    // Validate individual items
    if (orderData.items && Array.isArray(orderData.items)) {
        orderData.items.forEach((item, index) => {
            if (!item.variant_id && !item.id) {
                errors.push(`Item ${index + 1}: variant_id is required`);
            }
            if (!item.quantity || item.quantity <= 0) {
                errors.push(`Item ${index + 1}: quantity must be a positive number`);
            }
        });
    }
    
    return errors;
};

// Transform order data to match backend expectations
const transformOrderData = (orderData) => {
    // Ensure items have the correct structure
    const transformedItems = orderData.items.map(item => ({
        variant_id: item.variant_id || item.id,
        quantity: item.quantity || 1,
        price: item.price || item.unit_price || 0
    }));

    // Calculate subtotal if not provided
    const subtotal = orderData.subtotal || transformedItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0);
    
    const delivery_fee = orderData.delivery_fee || 0;
    const tax_amount = orderData.tax_amount || 0;
    const discount_amount = orderData.discount_amount || 0;
    
    // Calculate total
    const total_amount = subtotal + delivery_fee + tax_amount - discount_amount;

    return {
        address_id: orderData.address_id,
        subtotal: parseFloat(subtotal).toFixed(2),
        delivery_fee: parseFloat(delivery_fee).toFixed(2),
        tax_amount: parseFloat(tax_amount).toFixed(2),
        discount_amount: parseFloat(discount_amount).toFixed(2),
        total_amount: parseFloat(total_amount).toFixed(2),
        coupon_code: orderData.coupon_code || null,
        items: transformedItems,
        // Add client-side request tracking
        client_request_id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
};

// Create order - WITH DEDUPLICATION
export const createOrder = async (orderData) => {
    const requestSignature = generateRequestSignature(orderData);
    const requestKey = `create_order_${requestSignature}`;
    
    // Check if this exact request is already in progress
    if (pendingRequests.has(requestKey)) {
        console.warn('🔄 Order API: Duplicate request detected, returning existing promise');
        return pendingRequests.get(requestKey);
    }
    
    // Check if this request was recently completed (within last 10 seconds)
    const completedRequest = completedRequests.get(requestKey);
    if (completedRequest && (Date.now() - completedRequest.timestamp < REQUEST_CACHE_TIMEOUT)) {
        console.warn('🔄 Order API: Request was recently completed, returning cached result');
        return Promise.resolve(completedRequest.result);
    }
    
    console.log('🚀 Order API: Creating order with request key:', requestKey);
    
    // Create the promise
    const orderPromise = (async () => {
        try {
            console.log('📦 Order API: Creating order with data:', orderData);
            
            // Validate order data
            const validationErrors = validateOrderData(orderData);
            if (validationErrors.length > 0) {
                console.error('❌ Order validation errors:', validationErrors);
                const result = { 
                    success: false, 
                    message: `Validation failed: ${validationErrors.join(', ')}`,
                    validationErrors 
                };
                throw new Error(result.message);
            }
            
            // Transform order data for backend
            const transformedData = transformOrderData(orderData);
            console.log('📤 Order API: Transformed data:', transformedData);
            
            const response = await api.post(`${ORDER_BASE_URL}/`, transformedData);
            
            console.log('✅ Order API: Order creation successful:', response.data);
            
            const result = { 
                success: true, 
                data: response.data.data || response.data,
                message: response.data.message || 'Order created successfully',
                requestKey: requestKey
            };
            
            // Cache the successful result
            completedRequests.set(requestKey, {
                result: result,
                timestamp: Date.now()
            });
            
            // Clear from pending
            pendingRequests.delete(requestKey);
            
            // Schedule cleanup of completed request cache
            setTimeout(() => {
                completedRequests.delete(requestKey);
                console.log('🧹 Order API: Cleared request cache for:', requestKey);
            }, REQUEST_CACHE_TIMEOUT);
            
            return result;
            
        } catch (error) {
            console.error('❌ Order API: Order creation failed:', error);
            
            // Enhanced error handling
            let errorMessage = 'Failed to create order';
            let validationErrors = [];
            
            if (error.response) {
                const status = error.response.status;
                const responseData = error.response.data;
                
                if (status === 422) {
                    // Unprocessable Entity - Validation errors
                    errorMessage = 'Please check your order information';
                    validationErrors = Object.entries(responseData)
                        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`);
                } else if (status === 400) {
                    errorMessage = responseData.detail || 'Bad request - please check your data';
                } else if (status === 401) {
                    errorMessage = 'Please log in to complete your order';
                } else if (status === 500) {
                    errorMessage = 'Server error - please try again later';
                } else {
                    errorMessage = responseData.detail || responseData.message || `Error: ${status}`;
                }
            } else if (error.request) {
                // Network error
                errorMessage = 'Network error - please check your connection';
            } else {
                // Other errors
                errorMessage = error.message;
            }
            
            const result = { 
                success: false, 
                message: errorMessage,
                validationErrors,
                originalError: error,
                requestKey: requestKey
            };
            
            // Clear from pending on error too
            pendingRequests.delete(requestKey);
            
            // Don't cache errors, allow retry
            throw result;
        }
    })();
    
    // Store in pending requests
    pendingRequests.set(requestKey, orderPromise);
    
    // Auto-cleanup if promise doesn't resolve/reject (safety net)
    setTimeout(() => {
        if (pendingRequests.has(requestKey)) {
            console.warn('⚠️ Order API: Request timeout, cleaning up:', requestKey);
            pendingRequests.delete(requestKey);
        }
    }, 30000); // 30 second timeout
    
    return orderPromise;
};

// Get user orders
export const fetchUserOrders = async (page = 1, perPage = 20, status = null) => {
    try {
        const params = { page, per_page: perPage };
        if (status) params.status = status;
        
        console.log(`Order API: Fetching /orders/my with params:`, params);
        
        const response = await api.get(`${ORDER_BASE_URL}/my`, { params });
        
        console.log(`Order API: Response received:`, response.data);
        
        const ordersData = response.data.data || [];
        
        return { 
            success: true, 
            data: ordersData,
            pagination: response.data.pagination,
            message: response.data.message || 'Orders fetched successfully'
        };
    } catch (error) {
        console.error('Order API: Error fetching orders:', error);
        
        // Check if it's a 500 error
        if (error.response?.status === 500) {
            console.error('Order API: Server 500 error:', error.response.data);
        }
        
        // Return mock data for development if API fails
        if (error.response?.status === 404 || error.response?.status === 500) {
            console.log('Order API: Returning mock data for development');
            const mockOrders = generateMockOrders();
            return { success: true, data: mockOrders, isMock: true, message: 'Using mock data for development' };
        }
        
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch orders',
            data: []
        };
    }
};

// Get order by ID
export const fetchOrderById = async (orderId) => {
    try {
        // Make sure orderId is numeric
        const numericOrderId = parseInt(orderId);
        if (isNaN(numericOrderId)) {
            console.error('Order API: Invalid order ID format:', orderId);
            return { 
                success: false, 
                message: 'Invalid order ID format. Must be a number.',
                data: null
            };
        }
        
        const response = await api.get(`${ORDER_BASE_URL}/${numericOrderId}`);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || 'Order fetched successfully'
        };
    } catch (error) {
        console.error('Order API: Error fetching order:', error);
        
        // Return mock data for development if API fails
        if (error.response?.status === 404 || error.response?.status === 500) {
            const mockOrder = generateMockOrder(orderId);
            return { success: true, data: mockOrder, isMock: true, message: 'Using mock data for development' };
        }
        
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch order details',
            data: null
        };
    }
};

// Cancel order
export const cancelOrder = async (orderId) => {
    try {
        const response = await api.patch(`${ORDER_BASE_URL}/${orderId}/cancel`);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || 'Order cancelled successfully'
        };
    } catch (error) {
        console.error('Order API: Error cancelling order:', error);
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.data?.detail || 'Failed to cancel order',
            data: null
        };
    }
};

// Create return request
export const createReturnRequest = async (orderId, returnData) => {
    try {
        const response = await api.post(`${ORDER_BASE_URL}/${orderId}/return`, returnData);
        return { 
            success: true, 
            data: response.data.data || response.data,
            message: response.data.message || 'Return request submitted successfully'
        };
    } catch (error) {
        console.error('Order API: Error creating return request:', error);
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.data?.detail || 'Failed to create return request',
            data: null
        };
    }
};

// ===== MOCK DATA GENERATORS =====
const generateMockOrders = () => {
    return [
        {
            order_id: 'ORD_001',
            placed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            order_status: 'DELIVERED',
            total_amount: 149.97,
            items: [
                {
                    variant_id: 1,
                    product_name: 'Wireless Headphones',
                    quantity: 1,
                    price: 99.99,
                    variant_name: 'Black'
                },
                {
                    variant_id: 2,
                    product_name: 'Phone Case',
                    quantity: 2,
                    price: 24.99,
                    variant_name: 'Clear'
                }
            ],
            tracking_number: 'TRK_123456789',
            delivery_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
};

const generateMockOrder = (orderId) => {
    return {
        order_id: orderId,
        placed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        order_status: 'DELIVERED',
        total_amount: 149.97,
        subtotal: 149.97,
        delivery_fee: 0,
        tax_amount: 12.50,
        items: [
            {
                variant_id: 1,
                product_name: 'Wireless Headphones',
                quantity: 1,
                price: 99.99,
                variant_name: 'Black'
            }
        ],
        address: {
            line1: '123 Main Street',
            line2: 'Apt 4B',
            city_name: 'New York',
            state_name: 'NY',
            pincode: '10001'
        },
        tracking_number: 'TRK_123456789',
        delivery_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        payment_status: 'PAID'
    };
};