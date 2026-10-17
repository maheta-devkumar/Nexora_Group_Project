import api from './api';

const ORDER_ADMIN_BASE_URL = `/admin/orders`;

/* ================================
   📦 ORDER MANAGEMENT
================================ */

// Get all orders with pagination
export const fetchAllOrders = async (page = 1, perPage = 20, status = null) => {
    try {
        const params = { page, per_page: perPage, ...(status && { status }) };
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Orders fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Orders Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch orders",
            data: []
        };
    }
};

// Get order by ID
export const fetchOrderById = async (orderId) => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/${orderId}`);
        return { 
            success: true, 
            data: response.data,
            message: "Order fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Order Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch order"
        };
    }
};

// Update order
export const updateOrder = async (orderId, updateData) => {
    try {
        const response = await api.patch(`${ORDER_ADMIN_BASE_URL}/${orderId}`, updateData);
        return { 
            success: true, 
            data: response.data,
            message: "Order updated successfully" 
        };
    } catch (error) {
        console.error("Update Order Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update order"
        };
    }
};

// Cancel order (admin)
export const cancelOrder = async (orderId) => {
    try {
        const response = await api.patch(`${ORDER_ADMIN_BASE_URL}/${orderId}/cancel`);
        return { 
            success: true, 
            data: response.data,
            message: "Order cancelled successfully" 
        };
    } catch (error) {
        console.error("Cancel Order Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to cancel order"
        };
    }
};

// Delete order
export const deleteOrder = async (orderId) => {
    try {
        const response = await api.delete(`${ORDER_ADMIN_BASE_URL}/${orderId}`);
        return { 
            success: true, 
            data: response.data,
            message: "Order deleted successfully" 
        };
    } catch (error) {
        console.error("Delete Order Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete order"
        };
    }
};

// Get order items
export const fetchOrderItems = async (orderId) => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/${orderId}/items`);
        return { 
            success: true, 
            data: response.data,
            message: "Order items fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Order Items Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch order items",
            data: []
        };
    }
};

// Update order item quantity
export const updateOrderItemQty = async (orderId, variantId, quantity) => {
    try {
        const response = await api.patch(`${ORDER_ADMIN_BASE_URL}/${orderId}/items/${variantId}`, { quantity });
        return { 
            success: true, 
            data: response.data,
            message: "Item quantity updated successfully" 
        };
    } catch (error) {
        console.error("Update Item Qty Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update item quantity"
        };
    }
};

// Remove order item
export const removeOrderItem = async (orderId, variantId) => {
    try {
        const response = await api.delete(`${ORDER_ADMIN_BASE_URL}/${orderId}/items/${variantId}`);
        return { 
            success: true, 
            data: response.data,
            message: "Item removed successfully" 
        };
    } catch (error) {
        console.error("Remove Item Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to remove item"
        };
    }
};

// Get order history
export const fetchOrderHistory = async (orderId) => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/${orderId}/history`);
        return { 
            success: true, 
            data: response.data,
            message: "Order history fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Order History Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch order history",
            data: []
        };
    }
};

// Add order history
export const addOrderHistory = async (orderId, status) => {
    try {
        const response = await api.post(`${ORDER_ADMIN_BASE_URL}/${orderId}/history`, { status });
        return { 
            success: true, 
            data: response.data,
            message: "History added successfully" 
        };
    } catch (error) {
        console.error("Add History Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to add history"
        };
    }
};

/* ================================
   🔄 RETURNS MANAGEMENT
================================ */

// Get all returns
export const fetchAllReturns = async () => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/returns`);
        return { 
            success: true, 
            data: response.data,
            message: "Returns fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Returns Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch returns",
            data: []
        };
    }
};

// Get return by ID
export const fetchReturnById = async (returnId) => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/returns/${returnId}`);
        return { 
            success: true, 
            data: response.data,
            message: "Return fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Return Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch return"
        };
    }
};

// Get return items
export const fetchReturnItems = async (returnId) => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/returns/${returnId}/items`);
        return { 
            success: true, 
            data: response.data,
            message: "Return items fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Return Items Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch return items",
            data: []
        };
    }
};

// Approve return
export const approveReturn = async (returnId) => {
    try {
        const response = await api.patch(`${ORDER_ADMIN_BASE_URL}/returns/${returnId}/approve`);
        return { 
            success: true, 
            data: response.data,
            message: "Return approved successfully" 
        };
    } catch (error) {
        console.error("Approve Return Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to approve return"
        };
    }
};

// Reject return
export const rejectReturn = async (returnId, reason) => {
    try {
        const response = await api.patch(`${ORDER_ADMIN_BASE_URL}/returns/${returnId}/reject`, { reason });
        return { 
            success: true, 
            data: response.data,
            message: "Return rejected successfully" 
        };
    } catch (error) {
        console.error("Reject Return Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to reject return"
        };
    }
};

/* ================================
   💰 REFUNDS MANAGEMENT
================================ */

// Get all refunds
export const fetchAllRefunds = async () => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/refunds`);
        return { 
            success: true, 
            data: response.data,
            message: "Refunds fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Refunds Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch refunds",
            data: []
        };
    }
};

// Get refund by ID
export const fetchRefundById = async (refundId) => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/refunds/${refundId}`);
        return { 
            success: true, 
            data: response.data,
            message: "Refund fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Refund Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch refund"
        };
    }
};

// Create refund
export const createRefund = async (returnId) => {
    try {
        const response = await api.post(`${ORDER_ADMIN_BASE_URL}/returns/${returnId}/refund`);
        return { 
            success: true, 
            data: response.data,
            message: "Refund created successfully" 
        };
    } catch (error) {
        console.error("Create Refund Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to create refund"
        };
    }
};

// Update refund status
export const updateRefundStatus = async (refundId, status) => {
    try {
        const response = await api.patch(`${ORDER_ADMIN_BASE_URL}/refunds/${refundId}/status`, { status });
        return { 
            success: true, 
            data: response.data,
            message: "Refund status updated successfully" 
        };
    } catch (error) {
        console.error("Update Refund Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update refund status"
        };
    }
};

// Retry refund
export const retryRefund = async (refundId) => {
    try {
        const response = await api.post(`${ORDER_ADMIN_BASE_URL}/refunds/${refundId}/retry`);
        return { 
            success: true, 
            data: response.data,
            message: "Refund retry initiated" 
        };
    } catch (error) {
        console.error("Retry Refund Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to retry refund"
        };
    }
};

/* ================================
   🚚 DELIVERY MANAGEMENT
================================ */

// Assign delivery person
export const assignDeliveryPerson = async (orderId, deliveryUserId) => {
    try {
        const response = await api.post(`${ORDER_ADMIN_BASE_URL}/${orderId}/assign-delivery`, { delivery_user_id: deliveryUserId });
        return { 
            success: true, 
            data: response.data,
            message: "Delivery person assigned successfully" 
        };
    } catch (error) {
        console.error("Assign Delivery Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to assign delivery person"
        };
    }
};

// Update delivery person
export const updateDeliveryPerson = async (orderId, deliveryUserId) => {
    try {
        const response = await api.patch(`${ORDER_ADMIN_BASE_URL}/${orderId}/delivery`, { delivery_user_id: deliveryUserId });
        return { 
            success: true, 
            data: response.data,
            message: "Delivery person updated successfully" 
        };
    } catch (error) {
        console.error("Update Delivery Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update delivery person"
        };
    }
};

// Get delivery details
export const fetchDeliveryDetails = async (orderId) => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/${orderId}/delivery`);
        return { 
            success: true, 
            data: response.data,
            message: "Delivery details fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Delivery Details Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery details"
        };
    }
};

/* ================================
   ⚠️ ISSUES & FEEDBACK
================================ */

// Get order issues
export const fetchOrderIssues = async (orderId) => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/${orderId}/issues`);
        return { 
            success: true, 
            data: response.data,
            message: "Order issues fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Order Issues Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch order issues",
            data: []
        };
    }
};

// Resolve order issue
export const resolveOrderIssue = async (orderId, issueId, resolutionNote) => {
    try {
        const response = await api.patch(`${ORDER_ADMIN_BASE_URL}/${orderId}/issues/${issueId}/resolve`, { resolution_note: resolutionNote });
        return { 
            success: true, 
            data: response.data,
            message: "Issue resolved successfully" 
        };
    } catch (error) {
        console.error("Resolve Issue Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to resolve issue"
        };
    }
};

// Get order feedback
export const fetchOrderFeedback = async (orderId) => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/${orderId}/feedback`);
        return { 
            success: true, 
            data: response.data,
            message: "Order feedback fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Order Feedback Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch order feedback",
            data: []
        };
    }
};

/* ================================
   📊 ANALYTICS & STATS
================================ */

// Get order stats
export const fetchOrderStats = async () => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/state/overview`);
        return { 
            success: true, 
            data: response.data,
            message: "Stats fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Stats Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch stats"
        };
    }
};

// Get orders by date range
export const fetchOrdersByDate = async (startDate, endDate) => {
    try {
        const params = { start_date: startDate, end_date: endDate };
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/state/by-date`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Orders by date fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Orders By Date Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch orders by date",
            data: []
        };
    }
};

// Get orders by payment status
export const fetchOrdersByPaymentStatus = async (paymentStatus) => {
    try {
        const params = { payment_status: paymentStatus };
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/state/by-payment-status`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Orders by payment status fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Orders By Payment Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch orders by payment status",
            data: []
        };
    }
};

// Get orders by delivery status
export const fetchOrdersByDeliveryStatus = async (deliveryStatus) => {
    try {
        const params = { delivery_status: deliveryStatus };
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/state/by-delivery-status`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Orders by delivery status fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Orders By Delivery Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch orders by delivery status",
            data: []
        };
    }
};
// Search orders
export const searchOrders = async (searchTerm, page = 1, perPage = 20) => {
    try {
        const response = await api.get(`${ORDER_ADMIN_BASE_URL}/`, {
            params: { 
                page, 
                per_page: perPage,
                search: searchTerm 
            }
        });
        return { 
            success: true, 
            data: response.data,
            message: "Orders searched successfully" 
        };
    } catch (error) {
        console.error("Search Orders Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to search orders",
            data: []
        };
    }
};