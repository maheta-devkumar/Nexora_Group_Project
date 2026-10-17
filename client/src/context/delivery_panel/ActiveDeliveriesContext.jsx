// src/context/ActiveDeliveriesContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as activeDeliveryApi from '../../api/delivery_panel/active_deliveries';

const ActiveDeliveriesContext = createContext();

export const useActiveDeliveriesContext = () => {
    const context = useContext(ActiveDeliveriesContext);
    if (!context) {
        throw new Error('useActiveDeliveriesContext must be used within ActiveDeliveriesProvider');
    }
    return context;
};

export const ActiveDeliveriesProvider = ({ children }) => {
    // State
    const [activeDeliveries, setActiveDeliveries] = useState([]);
    const [deliveryStatistics, setDeliveryStatistics] = useState(null);
    const [todayDeliveries, setTodayDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
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
        setActiveDeliveries([]);
        setDeliveryStatistics(null);
        setTodayDeliveries([]);
        setSelectedDelivery(null);
        setOperationLogs([]);
        setError(null);
        addLog('All data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Operation logs cleared', 'info');
    }, [addLog]);

    // ===== ACTIVE DELIVERIES =====
    const fetchActiveDeliveries = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching active deliveries...', 'test');

        try {
            const result = await activeDeliveryApi.fetchActiveDeliveries();
            if (result.success) {
                setActiveDeliveries(result.data.active_deliveries || []);
                addLog(`✅ Active deliveries fetched: ${result.data.count || 0} deliveries`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch active deliveries: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch active deliveries';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch active deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== DELIVERY STATISTICS =====
    const fetchDeliveryStatistics = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching delivery statistics...', 'test');

        try {
            const result = await activeDeliveryApi.fetchDeliveryStatistics();
            if (result.success) {
                setDeliveryStatistics(result.data);
                addLog('✅ Delivery statistics fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch delivery statistics: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch delivery statistics';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch delivery statistics error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== TODAY'S DELIVERIES =====
    const fetchTodayDeliveries = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching today\'s deliveries...', 'test');

        try {
            const result = await activeDeliveryApi.fetchTodayDeliveries();
            if (result.success) {
                setTodayDeliveries(result.data.active_deliveries || []);
                addLog(`✅ Today's deliveries fetched: ${result.data.count || 0} deliveries`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch today's deliveries: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch today\'s deliveries';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch today\'s deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== DELIVERY BY ID =====
    const fetchDeliveryById = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching delivery ${deliveryId} details...`, 'info');

        try {
            const result = await activeDeliveryApi.fetchDeliveryById(deliveryId);
            if (result.success) {
                setSelectedDelivery(result.data.delivery);
                addLog(`✅ Delivery ${deliveryId} details fetched`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch delivery details: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch delivery details';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch delivery by ID error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== DELIVERIES BY STATUS =====
    const fetchDeliveriesByStatus = useCallback(async (status) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching deliveries with status: ${status}...`, 'info');

        try {
            const result = await activeDeliveryApi.fetchDeliveriesByStatus(status);
            if (result.success) {
                // Return the data but don't set state - let caller handle it
                addLog(`✅ Deliveries with status ${status} fetched: ${result.data.count || 0} deliveries`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch deliveries by status: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch deliveries by status';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch deliveries by status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== UPDATE DELIVERY STATUS =====
    const updateDeliveryStatus = useCallback(async (deliveryId, status, notes = null, latitude = null, longitude = null) => {
        setLoading(true);
        setError(null);
        addLog(`Updating delivery ${deliveryId} status to ${status}...`, 'info');

        try {
            const result = await activeDeliveryApi.updateDeliveryStatus(deliveryId, status, notes, latitude, longitude);
            if (result.success) {
                addLog(`✅ Delivery ${deliveryId} status updated to ${status}`, 'success');
                // Refresh active deliveries
                await fetchActiveDeliveries();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update delivery status: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update delivery status';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update delivery status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchActiveDeliveries, addLog]);

    // ===== MARK AS DELIVERED (Dedicated) =====
    const markAsDelivered = useCallback(async (deliveryId, notes = null, latitude = null, longitude = null) => {
        setLoading(true);
        setError(null);
        addLog(`Marking delivery ${deliveryId} as DELIVERED...`, 'info');

        try {
            const result = await activeDeliveryApi.markDeliveryDelivered(deliveryId, notes, latitude, longitude);
            if (result.success) {
                addLog(`✅ Delivery ${deliveryId} marked as completed`, 'success');
                // Refresh active deliveries immediately to remove it from list
                await fetchActiveDeliveries();
                // Also refresh stats
                fetchDeliveryStatistics();
                fetchTodayDeliveries();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to complete delivery: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to mark delivery as completed';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Mark as delivered error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchActiveDeliveries, fetchDeliveryStatistics, fetchTodayDeliveries, addLog]);

    // ===== VALIDATE STATUS TRANSITION =====
    const validateStatusTransition = useCallback(async (deliveryId, targetStatus) => {
        setLoading(true);
        setError(null);
        addLog(`Validating status transition for delivery ${deliveryId} to ${targetStatus}...`, 'info');

        try {
            const result = await activeDeliveryApi.validateStatusTransition(deliveryId, targetStatus);
            if (result.success) {
                addLog(`✅ Status transition validated: ${result.data.message}`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to validate status transition: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to validate status transition';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Validate status transition error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);



    // ===== OTP FLOW =====
    const requestOTP = useCallback(async (deliveryId) => {
        addLog(`Requesting OTP for delivery ${deliveryId}...`, 'info');
        const result = await activeDeliveryApi.requestDeliveryOTP(deliveryId);
        if (result.success) {
            addLog(`✅ OTP sent for delivery ${deliveryId}`, 'success');
        } else {
            addLog(`❌ Failed to request OTP: ${result.message}`, 'error');
        }
        return result;
    }, [addLog]);

    const confirmDelivery = useCallback(async (deliveryId, otp) => {
        addLog(`Confirming delivery ${deliveryId} with OTP...`, 'info');
        const result = await activeDeliveryApi.confirmDeliveryOTP(deliveryId, otp);
        if (result.success) {
            addLog(`✅ Delivery ${deliveryId} confirmed!`, 'success');
            await fetchActiveDeliveries();
            fetchDeliveryStatistics();
            fetchTodayDeliveries();
        } else {
            addLog(`❌ Confirmation failed: ${result.message}`, 'error');
        }
        return result;
    }, [fetchActiveDeliveries, fetchDeliveryStatistics, fetchTodayDeliveries, addLog]);

    // ===== UPDATE DELIVERY PROGRESS =====
    const updateDeliveryProgress = useCallback(async (deliveryId, progressPercentage, notes = null, latitude = null, longitude = null) => {
        setLoading(true);
        setError(null);
        addLog(`Updating delivery ${deliveryId} progress to ${progressPercentage}%...`, 'info');

        try {
            const result = await activeDeliveryApi.updateDeliveryProgress(deliveryId, progressPercentage, notes, latitude, longitude);
            if (result.success) {
                addLog(`✅ Delivery ${deliveryId} progress updated to ${progressPercentage}%`, 'success');
                // Refresh active deliveries
                await fetchActiveDeliveries();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update delivery progress: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update delivery progress';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update delivery progress error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchActiveDeliveries, addLog]);

    // ===== UPDATE LOCATION =====
    const updateLocation = useCallback(async (latitude, longitude, accuracy = null) => {
        setLoading(true);
        setError(null);
        addLog(`Updating delivery person location to (${latitude}, ${longitude})...`, 'info');

        try {
            const result = await activeDeliveryApi.updateDeliveryPersonLocation(latitude, longitude, accuracy);
            if (result.success) {
                addLog('✅ Location updated successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update location: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update location';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update location error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== GET CUSTOMER CONTACT =====
    const getCustomerContact = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        addLog(`Getting customer contact for delivery ${deliveryId}...`, 'info');

        try {
            const result = await activeDeliveryApi.getCustomerContactInfo(deliveryId);
            if (result.success) {
                addLog('✅ Customer contact info fetched', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to get customer contact: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to get customer contact';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Get customer contact error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== GET NAVIGATION DATA =====
    const getNavigationData = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        addLog(`Getting navigation data for delivery ${deliveryId}...`, 'info');

        try {
            const result = await activeDeliveryApi.getDeliveryNavigationData(deliveryId);
            if (result.success) {
                addLog('✅ Navigation data fetched', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to get navigation data: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to get navigation data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Get navigation data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== BULK UPDATE STATUS =====
    const bulkUpdateStatus = useCallback(async (deliveryIds, status, notes = null) => {
        setLoading(true);
        setError(null);
        addLog(`Bulk updating ${deliveryIds.length} deliveries to status ${status}...`, 'info');

        try {
            const result = await activeDeliveryApi.bulkUpdateDeliveryStatus(deliveryIds, status, notes);
            if (result.success) {
                addLog(`✅ Bulk update completed: ${result.data.message}`, 'success');
                // Refresh active deliveries
                await fetchActiveDeliveries();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Bulk update failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to bulk update status';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Bulk update status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchActiveDeliveries, addLog]);

    // ===== REFRESH DELIVERIES =====
    const refreshDeliveries = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Refreshing deliveries...', 'info');

        try {
            const result = await activeDeliveryApi.refreshDeliveries();
            if (result.success) {
                setActiveDeliveries(result.data.active_deliveries || []);
                addLog(`✅ Deliveries refreshed: ${result.data.count || 0} deliveries`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to refresh deliveries: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to refresh deliveries';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Refresh deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== BATCH OPERATIONS =====
    const fetchAllActiveDeliveryData = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching all active delivery data...', 'test');

        try {
            const results = await Promise.all([
                fetchActiveDeliveries(),
                fetchDeliveryStatistics(),
                fetchTodayDeliveries()
            ]);

            const allSuccess = results.every(result => result.success);

            if (allSuccess) {
                addLog('✅ All active delivery data fetched successfully', 'success');
                return { success: true, message: 'All data fetched successfully' };
            } else {
                const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
                setError(`Some data failed to load: ${errorMessages}`);
                addLog(`⚠️ Some data failed to load: ${errorMessages}`, 'warning');
                return { success: false, message: errorMessages };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all active delivery data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchActiveDeliveries, fetchDeliveryStatistics, fetchTodayDeliveries, addLog]);

    // ===== HEALTH CHECK =====
    const checkActiveDeliveriesHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Checking active deliveries health...', 'test');

        try {
            const result = await activeDeliveryApi.checkActiveDeliveriesHealth();
            if (result.success) {
                addLog('✅ Active deliveries module is healthy', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Active deliveries health check failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to check active deliveries health';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Health check error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const value = {
        // State
        activeDeliveries,
        deliveryStatistics,
        todayDeliveries,
        selectedDelivery,
        loading,
        error,
        operationLogs,

        // Fetch Functions
        fetchActiveDeliveries,
        fetchDeliveryStatistics,
        fetchTodayDeliveries,
        fetchDeliveryById,
        fetchDeliveriesByStatus,

        // Update Functions
        updateDeliveryStatus,
        markAsDelivered,
        requestOTP,
        confirmDelivery,
        validateStatusTransition,
        updateDeliveryProgress,
        updateLocation,

        // Customer Functions
        getCustomerContact,
        getNavigationData,

        // Bulk Operations
        bulkUpdateStatus,
        refreshDeliveries,

        // Batch Operations
        fetchAllActiveDeliveryData,

        // Health Check
        checkActiveDeliveriesHealth,

        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog,

        // State setters (optional)
        setSelectedDelivery
    };

    return (
        <ActiveDeliveriesContext.Provider value={value}>
            {children}
        </ActiveDeliveriesContext.Provider>
    );
};