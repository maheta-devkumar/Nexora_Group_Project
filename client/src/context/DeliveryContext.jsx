import React, { createContext, useContext, useState, useCallback } from 'react';
import * as deliveryApi from '../api/delivery';
import { toast } from 'react-toastify';

const DeliveryContext = createContext();

export const useDeliveryContext = () => {
    const context = useContext(DeliveryContext);
    if (!context) {
        throw new Error('useDeliveryContext must be used within DeliveryProvider');
    }
    return context;
};


export const DeliveryProvider = ({ children }) => {
    // State for all deliveries
    const [deliveries, setDeliveries] = useState([]);
    const [adminDeliveries, setAdminDeliveries] = useState([]);
    const [deliveryStats, setDeliveryStats] = useState(null);
    const [deliveryEarnings, setDeliveryEarnings] = useState([]);
    const [deliveryPerformance, setDeliveryPerformance] = useState([]);
    const [deliveryIssues, setDeliveryIssues] = useState([]);
    const [deliveryTimeline, setDeliveryTimeline] = useState([]);
    const [deliveryPersons, setDeliveryPersons] = useState([]);
    const [availableDeliveries, setAvailableDeliveries] = useState([]);

    // OPTIMIZATION: New State for Overview
    const [deliveryOverview, setDeliveryOverview] = useState(null);

    // State for delivery person
    const [myAssignedOrders, setMyAssignedOrders] = useState([]);
    const [myEarnings, setMyEarnings] = useState(null);
    const [trackedDelivery, setTrackedDelivery] = useState(null);

    // Common state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 20,
        total_items: 0,
        total_pages: 0
    });

    /* -----------------------------
       ✅ REGULAR DELIVERY FUNCTIONS
    ------------------------------ */

    // Get all deliveries (with pagination)
    const fetchAllDeliveries = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.fetchAllDeliveries(params);
            if (result.success) {
                setDeliveries(result.data || []);
                // Update pagination if provided
                if (result.pagination) {
                    setPagination(result.pagination);
                }
                if (params.page) setPagination(prev => ({ ...prev, page: params.page }));
                if (params.per_page) setPagination(prev => ({ ...prev, per_page: params.per_page }));

                if (result.message) {
                    toast.success(result.message || 'Deliveries fetched successfully');
                }
                return { success: true, data: result.data, pagination: result.pagination };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch deliveries';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Fetch deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Assign delivery person to order
    const assignDeliveryPerson = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.assignDeliveryPerson(payload);
            if (result.success) {
                // Refresh deliveries list
                fetchAllDeliveries();
                toast.success(result.message || 'Delivery person assigned successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to assign delivery person';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Assign delivery person error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchAllDeliveries]);

    // Track delivery by order ID (Customer)
    const trackDelivery = useCallback(async (orderId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.trackDelivery(orderId);
            if (result.success) {
                setTrackedDelivery(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to track delivery';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Track delivery error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* -----------------------------
       ✅ DELIVERY PERSON FUNCTIONS
    ------------------------------ */

    // Get my assigned orders
    const fetchMyAssignedOrders = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.fetchMyAssignedOrders(params);
            if (result.success) {
                setMyAssignedOrders(result.data || []);
                // Update pagination if provided
                if (result.pagination) {
                    setPagination(result.pagination);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch assigned orders';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Fetch assigned orders error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get my earnings
    const fetchMyEarnings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.fetchMyEarnings();
            if (result.success) {
                setMyEarnings(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch earnings';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Fetch earnings error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update delivery status (Delivery Person)
    const updateDeliveryStatus = useCallback(async (deliveryId, status) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.updateDeliveryStatus(deliveryId, status);
            if (result.success) {
                // Update in my assigned orders
                setMyAssignedOrders(prev => prev.map(delivery =>
                    delivery.delivery_id === deliveryId ? { ...delivery, status } : delivery
                ));
                toast.success(result.message || 'Delivery status updated successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to update delivery status';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Update delivery status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get available deliveries for delivery person
    /* -----------------------------
       ✅ ADMIN DELIVERY FUNCTIONS
    ------------------------------ */

    // Get all deliveries for admin
    const adminGetAllDeliveries = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminGetAllDeliveries();
            if (result.success) {
                setAdminDeliveries(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch deliveries';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin get deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get delivery statistics
    const adminGetDeliveryStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminGetDeliveryStats();
            if (result.success) {
                setDeliveryStats(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery stats';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin get stats error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update delivery status (Admin)
    const adminUpdateDeliveryStatus = useCallback(async (deliveryId, status) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminUpdateDeliveryStatus(deliveryId, status);
            if (result.success) {
                // Update in admin deliveries list
                setAdminDeliveries(prev => prev.map(delivery =>
                    delivery.delivery_id === deliveryId ? { ...delivery, status } : delivery
                ));
                toast.success(result.message || 'Delivery status updated successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to update delivery status';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin update status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Reassign delivery person
    const adminReassignDeliveryPerson = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminReassignDeliveryPerson(payload);
            if (result.success) {
                // Update in admin deliveries list
                setAdminDeliveries(prev => prev.map(delivery =>
                    delivery.delivery_id === payload.delivery_id ? {
                        ...delivery,
                        delivery_person_id: payload.new_delivery_person_id
                    } : delivery
                ));
                toast.success(result.message || 'Delivery person reassigned successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to reassign delivery person';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin reassign error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get delivery earnings
    const adminGetDeliveryEarnings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminGetDeliveryEarnings();
            if (result.success) {
                setDeliveryEarnings(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery earnings';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin get earnings error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get delivery person performance
    const adminGetDeliveryPersonPerformance = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminGetDeliveryPersonPerformance();
            if (result.success) {
                setDeliveryPerformance(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch performance data';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin get performance error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Search deliveries
    const adminSearchDeliveries = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminSearchDeliveries(filters);
            if (result.success) {
                setAdminDeliveries(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to search deliveries';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin search error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get delivery timeline
    const adminGetDeliveryTimeline = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminGetDeliveryTimeline(deliveryId);
            if (result.success) {
                setDeliveryTimeline(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery timeline';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin get timeline error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Cancel delivery
    const adminCancelDelivery = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminCancelDelivery(deliveryId);
            if (result.success) {
                // Remove from admin deliveries list
                setAdminDeliveries(prev => prev.filter(delivery => delivery.delivery_id !== deliveryId));
                toast.success(result.message || 'Delivery cancelled successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to cancel delivery';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin cancel delivery error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Validate delivery completion
    const adminValidateDeliveryCompletion = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminValidateDeliveryCompletion(deliveryId);
            if (result.success) {
                // Update in admin deliveries list
                setAdminDeliveries(prev => prev.map(delivery =>
                    delivery.delivery_id === deliveryId ? { ...delivery, status: 'DELIVERED' } : delivery
                ));
                toast.success(result.message || 'Delivery validated successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to validate delivery';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin validate delivery error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get delivery issues
    const adminGetDeliveryIssues = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminGetDeliveryIssues();
            if (result.success) {
                setDeliveryIssues(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery issues';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin get issues error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get all delivery persons
    const adminGetAllDeliveryPersons = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminGetAllDeliveryPersons(params);
            if (result.success) {
                setDeliveryPersons(result.data || []);
                // Update pagination if provided
                if (result.pagination) {
                    setPagination(result.pagination);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery persons';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin get delivery persons error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Admin assign delivery person (legacy endpoint)
    const adminAssignDeliveryPerson = useCallback(async (orderId, deliveryPersonId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminAssignDelivery(orderId, deliveryPersonId);
            if (result.success) {
                // Refresh deliveries list
                adminGetAllDeliveries();
                toast.success(result.message || 'Delivery person assigned successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to assign delivery person';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Admin assign delivery error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [adminGetAllDeliveries]);

    // NEW ADMIN FUNCTIONS
    const handleOrderCreatedWebhook = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.handleOrderCreatedWebhook(payload);
            if (result.success) {
                toast.success(result.message || 'Webhook processed successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to process webhook';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Webhook error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const adminGetAvailableDeliveryPersons = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminGetAvailableDeliveryPersons();
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch available delivery persons';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Get available delivery persons error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const adminGetDeliveryPool = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminGetDeliveryPool();
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery pool';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Get delivery pool error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const adminNotifyDeliveryPerson = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminNotifyDeliveryPerson(payload);
            if (result.success) {
                toast.success(result.message || 'Notification sent successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to send notification';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Notify delivery person error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const adminCancelDeliveryToPool = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryApi.adminCancelDeliveryToPool(deliveryId);
            if (result.success) {
                // Refresh admin deliveries
                adminGetAllDeliveries();
                // Refresh delivery pool
                adminGetDeliveryPool();
                toast.success(result.message || 'Delivery cancelled successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to cancel delivery';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Cancel delivery to pool error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [adminGetAllDeliveries, adminGetDeliveryPool]);

    /* -----------------------------
       ✅ HELPER FUNCTIONS
    ------------------------------ */

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear tracked delivery
    const clearTrackedDelivery = useCallback(() => setTrackedDelivery(null), []);

    // Clear all deliveries
    const clearDeliveries = useCallback(() => {
        setDeliveries([]);
        setMyAssignedOrders([]);
        setAdminDeliveries([]);
        setAvailableDeliveries([]);
    }, []);

    const value = {
        // State
        deliveries,
        myAssignedOrders,
        myEarnings,
        trackedDelivery,
        adminDeliveries,
        deliveryStats,
        deliveryEarnings,
        deliveryPerformance,
        deliveryIssues,
        deliveryTimeline,
        deliveryPersons,
        availableDeliveries,
        loading,
        error,
        pagination,

        // Regular delivery functions
        fetchAllDeliveries,
        assignDeliveryPerson,
        trackDelivery,

        // Delivery person functions
        fetchMyAssignedOrders,
        fetchMyEarnings,
        updateDeliveryStatus,

        // Admin delivery functions
        adminAssignDeliveryPerson,
        adminGetAllDeliveries,
        adminGetDeliveryStats,
        adminUpdateDeliveryStatus,
        adminReassignDeliveryPerson,
        adminGetDeliveryEarnings,
        adminGetDeliveryPersonPerformance,
        adminSearchDeliveries,
        adminGetDeliveryTimeline,
        adminCancelDelivery,
        adminValidateDeliveryCompletion,
        adminGetDeliveryIssues,
        adminGetAllDeliveryPersons,

        adminGetAllDeliveryPersons,

        // New admin functions
        handleOrderCreatedWebhook,
        adminGetAvailableDeliveryPersons,
        adminGetDeliveryPool,
        adminNotifyDeliveryPerson,
        adminCancelDeliveryToPool,

        // OPTIMIZATION: New Overview Function
        adminFetchOverview: useCallback(async () => {
            setLoading(true);
            setError(null);
            try {
                // Assuming api.adminFetchOverview exists now (we need to add it to api layer too)
                // For now, I'll assume we can call the endpoint directly or add to api file
                // Let's add the function definition here if api file not updated, but better to update api file.
                // Wait, I need to update api/admin/delivery.js first? 
                // Context usually calls api. So I will add api call here assuming I'll fix api next.
                const result = await deliveryApi.adminGetDeliveryOverview();
                if (result.success) {
                    setDeliveryOverview(result.data);
                    return { success: true, data: result.data };
                } else {
                    setError(result.message);
                    return { success: false, message: result.message };
                }
            } catch (err) {
                console.error('Fetch overview error:', err);
                return { success: false, message: err.message };
            } finally {
                setLoading(false);
            }
        }, []),
        deliveryOverview,

        // Helper functions
        clearError,
        clearTrackedDelivery,
        clearDeliveries
    };

    return (
        <DeliveryContext.Provider value={value}>
            {children}
        </DeliveryContext.Provider>
    );
};