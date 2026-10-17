import React, { createContext, useContext, useState, useCallback } from 'react';
import * as orderAdminApi from '../api/order_admin';

const OrderAdminContext = createContext();

export const useOrderAdminContext = () => {
    const context = useContext(OrderAdminContext);
    if (!context) {
        throw new Error('useOrderAdminContext must be used within OrderAdminProvider');
    }
    return context;
};

export const OrderAdminProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [returns, setReturns] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 1
    });

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear current order
    const clearCurrentOrder = useCallback(() => setCurrentOrder(null), []);

    /* ================================
       📦 ORDER MANAGEMENT
    ================================ */

    // Fetch all orders
    const fetchAllOrders = useCallback(async (page = 1, perPage = 20, status = null) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchAllOrders(page, perPage, status);
            if (result.success) {
                setOrders(result.data || []);
                // Update pagination if available
                if (result.data?.pagination) {
                    setPagination(result.data.pagination);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch orders';
            setError(errorMsg);
            console.error('Fetch orders error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch order by ID
    const fetchOrderById = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchOrderById(orderId);
            if (result.success) {
                setCurrentOrder(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch order';
            setError(errorMsg);
            console.error('Fetch order error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update order
    const updateOrder = useCallback(async (orderId, updateData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.updateOrder(orderId, updateData);
            if (result.success) {
                // Update in orders list
                setOrders(prev => prev.map(order => 
                    order.order_id === orderId ? { ...order, ...result.data } : order
                ));
                // Update current order if it's the one being updated
                if (currentOrder?.order_id === orderId) {
                    setCurrentOrder(prev => ({ ...prev, ...result.data }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update order';
            setError(errorMsg);
            console.error('Update order error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentOrder]);

    // Cancel order
    const cancelOrder = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.cancelOrder(orderId);
            if (result.success) {
                // Update in orders list
                setOrders(prev => prev.map(order => 
                    order.order_id === orderId ? { ...order, order_status: 'CANCELLED' } : order
                ));
                // Update current order if it's the one being cancelled
                if (currentOrder?.order_id === orderId) {
                    setCurrentOrder(prev => ({ ...prev, order_status: 'CANCELLED' }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to cancel order';
            setError(errorMsg);
            console.error('Cancel order error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentOrder]);

    // Delete order
    const deleteOrder = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.deleteOrder(orderId);
            if (result.success) {
                // Remove from orders list
                setOrders(prev => prev.filter(order => order.order_id !== orderId));
                // Clear current order if it's the one being deleted
                if (currentOrder?.order_id === orderId) {
                    setCurrentOrder(null);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to delete order';
            setError(errorMsg);
            console.error('Delete order error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentOrder]);

    // Fetch order items
    const fetchOrderItems = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchOrderItems(orderId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch order items';
            setError(errorMsg);
            console.error('Fetch order items error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update order item quantity
    const updateOrderItemQty = useCallback(async (orderId, variantId, quantity) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.updateOrderItemQty(orderId, variantId, quantity);
            if (result.success) {
                // Update order items in current order if loaded
                if (currentOrder?.order_id === orderId) {
                    setCurrentOrder(prev => {
                        const updatedItems = prev.items?.map(item => 
                            item.variant_id === variantId ? { ...item, quantity, total: item.price * quantity } : item
                        );
                        return { ...prev, items: updatedItems };
                    });
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update item quantity';
            setError(errorMsg);
            console.error('Update item quantity error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentOrder]);

    // Remove order item
    const removeOrderItem = useCallback(async (orderId, variantId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.removeOrderItem(orderId, variantId);
            if (result.success) {
                // Remove item from current order if loaded
                if (currentOrder?.order_id === orderId) {
                    setCurrentOrder(prev => ({
                        ...prev,
                        items: prev.items?.filter(item => item.variant_id !== variantId)
                    }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to remove item';
            setError(errorMsg);
            console.error('Remove item error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentOrder]);

    // Fetch order history
    const fetchOrderHistory = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchOrderHistory(orderId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch order history';
            setError(errorMsg);
            console.error('Fetch order history error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Add order history
    const addOrderHistory = useCallback(async (orderId, status) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.addOrderHistory(orderId, status);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to add order history';
            setError(errorMsg);
            console.error('Add order history error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* ================================
       🔄 RETURNS MANAGEMENT
    ================================ */

    // Fetch all returns
    const fetchAllReturns = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchAllReturns();
            if (result.success) {
                setReturns(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch returns';
            setError(errorMsg);
            console.error('Fetch returns error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch return by ID
    const fetchReturnById = useCallback(async (returnId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchReturnById(returnId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch return';
            setError(errorMsg);
            console.error('Fetch return error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch return items
    const fetchReturnItems = useCallback(async (returnId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchReturnItems(returnId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch return items';
            setError(errorMsg);
            console.error('Fetch return items error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Approve return
    const approveReturn = useCallback(async (returnId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.approveReturn(returnId);
            if (result.success) {
                // Update in returns list
                setReturns(prev => prev.map(ret => 
                    ret.return_id === returnId ? { ...ret, status: 'APPROVED' } : ret
                ));
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to approve return';
            setError(errorMsg);
            console.error('Approve return error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Reject return
    const rejectReturn = useCallback(async (returnId, reason) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.rejectReturn(returnId, reason);
            if (result.success) {
                // Update in returns list
                setReturns(prev => prev.map(ret => 
                    ret.return_id === returnId ? { ...ret, status: 'REJECTED' } : ret
                ));
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to reject return';
            setError(errorMsg);
            console.error('Reject return error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* ================================
       💰 REFUNDS MANAGEMENT
    ================================ */

    // Fetch all refunds
    const fetchAllRefunds = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchAllRefunds();
            if (result.success) {
                setRefunds(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch refunds';
            setError(errorMsg);
            console.error('Fetch refunds error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch refund by ID
    const fetchRefundById = useCallback(async (refundId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchRefundById(refundId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch refund';
            setError(errorMsg);
            console.error('Fetch refund error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create refund
    const createRefund = useCallback(async (returnId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.createRefund(returnId);
            if (result.success) {
                // Add to refunds list
                setRefunds(prev => [...prev, result.data]);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to create refund';
            setError(errorMsg);
            console.error('Create refund error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update refund status
    const updateRefundStatus = useCallback(async (refundId, status) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.updateRefundStatus(refundId, status);
            if (result.success) {
                // Update in refunds list
                setRefunds(prev => prev.map(refund => 
                    refund.refund_id === refundId ? { ...refund, status } : refund
                ));
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update refund status';
            setError(errorMsg);
            console.error('Update refund status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Retry refund
    const retryRefund = useCallback(async (refundId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.retryRefund(refundId);
            if (result.success) {
                // Update in refunds list
                setRefunds(prev => prev.map(refund => 
                    refund.refund_id === refundId ? { ...refund, status: 'PROCESSING' } : refund
                ));
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to retry refund';
            setError(errorMsg);
            console.error('Retry refund error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* ================================
       🚚 DELIVERY MANAGEMENT
    ================================ */

    // Assign delivery person
    const assignDeliveryPerson = useCallback(async (orderId, deliveryUserId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.assignDeliveryPerson(orderId, deliveryUserId);
            if (result.success) {
                // Update order delivery info
                setOrders(prev => prev.map(order => 
                    order.order_id === orderId ? { ...order, delivery_user_id: deliveryUserId } : order
                ));
                if (currentOrder?.order_id === orderId) {
                    setCurrentOrder(prev => ({ ...prev, delivery_user_id: deliveryUserId }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to assign delivery person';
            setError(errorMsg);
            console.error('Assign delivery person error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentOrder]);

    // Update delivery person
    const updateDeliveryPerson = useCallback(async (orderId, deliveryUserId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.updateDeliveryPerson(orderId, deliveryUserId);
            if (result.success) {
                // Update order delivery info
                setOrders(prev => prev.map(order => 
                    order.order_id === orderId ? { ...order, delivery_user_id: deliveryUserId } : order
                ));
                if (currentOrder?.order_id === orderId) {
                    setCurrentOrder(prev => ({ ...prev, delivery_user_id: deliveryUserId }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update delivery person';
            setError(errorMsg);
            console.error('Update delivery person error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentOrder]);

    // Fetch delivery details
    const fetchDeliveryDetails = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchDeliveryDetails(orderId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch delivery details';
            setError(errorMsg);
            console.error('Fetch delivery details error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* ================================
       ⚠️ ISSUES & FEEDBACK
    ================================ */

    // Fetch order issues
    const fetchOrderIssues = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchOrderIssues(orderId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch order issues';
            setError(errorMsg);
            console.error('Fetch order issues error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Resolve order issue
    const resolveOrderIssue = useCallback(async (orderId, issueId, resolutionNote) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.resolveOrderIssue(orderId, issueId, resolutionNote);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to resolve issue';
            setError(errorMsg);
            console.error('Resolve issue error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch order feedback
    const fetchOrderFeedback = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchOrderFeedback(orderId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch order feedback';
            setError(errorMsg);
            console.error('Fetch order feedback error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* ================================
       📊 ANALYTICS & STATS
    ================================ */

    // Fetch order stats
    const fetchOrderStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchOrderStats();
            if (result.success) {
                setStats(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch order stats';
            setError(errorMsg);
            console.error('Fetch order stats error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch orders by date
    const fetchOrdersByDate = useCallback(async (startDate, endDate) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchOrdersByDate(startDate, endDate);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch orders by date';
            setError(errorMsg);
            console.error('Fetch orders by date error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch orders by payment status
    const fetchOrdersByPaymentStatus = useCallback(async (paymentStatus) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchOrdersByPaymentStatus(paymentStatus);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch orders by payment status';
            setError(errorMsg);
            console.error('Fetch orders by payment status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch orders by delivery status
    const fetchOrdersByDeliveryStatus = useCallback(async (deliveryStatus) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.fetchOrdersByDeliveryStatus(deliveryStatus);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch orders by delivery status';
            setError(errorMsg);
            console.error('Fetch orders by delivery status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);
    // Search orders
    const searchOrders = useCallback(async (searchTerm, page = 1, perPage = 20) => {
        setLoading(true);
        setError(null);
        try {
            const result = await orderAdminApi.searchOrders(searchTerm, page, perPage);
            if (result.success) {
                setOrders(result.data || []);
                if (result.data?.pagination) {
                    setPagination(result.data.pagination);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to search orders';
            setError(errorMsg);
            console.error('Search orders error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);
    const value = {
        // State
        orders,
        currentOrder,
        returns,
        refunds,
        stats,
        loading,
        error,
        pagination,
        
        // Order Management
        fetchAllOrders,
        fetchOrderById,
        updateOrder,
        cancelOrder,
        deleteOrder,
        fetchOrderItems,
        updateOrderItemQty,
        removeOrderItem,
        fetchOrderHistory,
        addOrderHistory,
        
        // Returns Management
        fetchAllReturns,
        fetchReturnById,
        fetchReturnItems,
        approveReturn,
        rejectReturn,
        
        // Refunds Management
        fetchAllRefunds,
        fetchRefundById,
        createRefund,
        updateRefundStatus,
        retryRefund,
        
        // Delivery Management
        assignDeliveryPerson,
        updateDeliveryPerson,
        fetchDeliveryDetails,
        
        // Issues & Feedback
        fetchOrderIssues,
        resolveOrderIssue,
        fetchOrderFeedback,
        
        // Analytics & Stats
        fetchOrderStats,
        fetchOrdersByDate,
        fetchOrdersByPaymentStatus,
        fetchOrdersByDeliveryStatus,
        
        // Utility
        clearError,
        clearCurrentOrder,
        setPagination,
        searchOrders
    };

    return (
        <OrderAdminContext.Provider value={value}>
            {children}
        </OrderAdminContext.Provider>
    );
};