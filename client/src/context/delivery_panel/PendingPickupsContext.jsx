// src/context/delivery_panel/PendingPickupsContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as pickupApi from '../../api/delivery_panel/pending_pickups';

const PendingPickupsContext = createContext();

export const usePendingPickupsContext = () => {
    const context = useContext(PendingPickupsContext);
    if (!context) {
        throw new Error('usePendingPickupsContext must be used within PendingPickupsProvider');
    }
    return context;
};

export const PendingPickupsProvider = ({ children }) => {
    // State
    const [pendingPickups, setPendingPickups] = useState([]);
    const [groupedPickups, setGroupedPickups] = useState([]);
    const [pickupStats, setPickupStats] = useState(null);
    const [selectedPickup, setSelectedPickup] = useState(null);
    const [optimizedRoute, setOptimizedRoute] = useState(null);
    const [pickupStatistics, setPickupStatistics] = useState(null);
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
        setPendingPickups([]);
        setGroupedPickups([]);
        setPickupStats(null);
        setSelectedPickup(null);
        setOptimizedRoute(null);
        setPickupStatistics(null);
        setOperationLogs([]);
        setError(null);
        addLog('All pickup data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Operation logs cleared', 'info');
    }, [addLog]);

    // ===== PENDING PICKUPS =====
    const fetchPendingPickups = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        addLog('Fetching pending pickups...', 'test');

        try {
            const result = await pickupApi.fetchPendingPickups(filters);
            if (result.success) {
                setPendingPickups(result.data.pending_pickups || []);
                setGroupedPickups(result.data.grouped_by_location || []);
                setPickupStats(result.data.stats || {});
                addLog(`✅ Pending pickups fetched: ${result.data.total_count || 0} total`, 'success');
                return {
                    success: true,
                    data: result.data,
                    message: result.message
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch pending pickups: ${result.message}`, 'error');
                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch pending pickups';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch pending pickups error:', err);
            return {
                success: false,
                message: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PICKUP DETAILS =====
    const fetchPickupDetails = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching pickup details for delivery ${deliveryId}...`, 'test');

        try {
            const result = await pickupApi.fetchPickupDetails(deliveryId);
            if (result.success) {
                setSelectedPickup(result.data);
                addLog('✅ Pickup details fetched successfully', 'success');
                return {
                    success: true,
                    data: result.data,
                    message: result.message
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch pickup details: ${result.message}`, 'error');
                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch pickup details';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch pickup details error:', err);
            return {
                success: false,
                message: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, [addLog]);



    // ===== PICKUP CONFIRMATION =====
    const confirmPickup = useCallback(async (deliveryId, notes = null, podImageUrl = null, signatureUrl = null) => {
        setLoading(true);
        setError(null);
        addLog(`Confirming pickup for delivery ${deliveryId}...`, 'info');

        try {
            const result = await pickupApi.confirmPickup(deliveryId, notes, podImageUrl, signatureUrl);
            if (result.success) {
                addLog('✅ Pickup confirmed successfully', 'success');
                // Refresh all data after confirmation
                await fetchPendingPickups();
                return {
                    success: true,
                    data: result.data,
                    message: result.message
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to confirm pickup: ${result.message}`, 'error');
                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (err) {
            const errorMsg = 'Failed to confirm pickup';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Confirm pickup error:', err);
            return {
                success: false,
                message: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, [fetchPendingPickups, addLog]);

    // ===== VENDOR CONTACT =====
    const fetchVendorContact = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching vendor contact for delivery ${deliveryId}...`, 'info');

        try {
            const result = await pickupApi.fetchVendorContact(deliveryId);
            if (result.success) {
                addLog('✅ Vendor contact fetched successfully', 'success');
                return {
                    success: true,
                    data: result.data,
                    message: result.message
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch vendor contact: ${result.message}`, 'error');
                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch vendor contact';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch vendor contact error:', err);
            return {
                success: false,
                message: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== NAVIGATION =====
    const fetchPickupNavigation = useCallback(async (deliveryId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching navigation for delivery ${deliveryId}...`, 'info');

        try {
            const result = await pickupApi.fetchPickupNavigation(deliveryId);
            if (result.success) {
                addLog('✅ Navigation details fetched successfully', 'success');
                return {
                    success: true,
                    data: result.data,
                    message: result.message
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch navigation: ${result.message}`, 'error');
                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch navigation';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch navigation error:', err);
            return {
                success: false,
                message: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== OPTIMIZED ROUTE =====
    const fetchOptimizedRoute = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching optimized route...', 'test');

        try {
            const result = await pickupApi.fetchOptimizedRoute();
            if (result.success) {
                setOptimizedRoute(result.data);
                addLog('✅ Optimized route fetched successfully', 'success');
                return {
                    success: true,
                    data: result.data,
                    message: result.message
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch optimized route: ${result.message}`, 'error');
                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch optimized route';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch optimized route error:', err);
            return {
                success: false,
                message: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PICKUP STATISTICS =====
    const fetchPickupStatistics = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching pickup statistics...', 'test');

        try {
            const result = await pickupApi.fetchPickupStatistics();
            if (result.success) {
                setPickupStatistics(result.data);
                addLog('✅ Pickup statistics fetched successfully', 'success');
                return {
                    success: true,
                    data: result.data,
                    message: result.message
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch pickup statistics: ${result.message}`, 'error');
                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch pickup statistics';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch pickup statistics error:', err);
            return {
                success: false,
                message: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== BATCH OPERATIONS =====
    const fetchAllPickupData = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching all pickup data...', 'test');

        try {
            const results = await Promise.all([
                fetchPendingPickups(),
                fetchOptimizedRoute(),
                fetchPickupStatistics()
            ]);

            const allSuccess = results.every(result => result.success);

            if (allSuccess) {
                addLog('✅ All pickup data fetched successfully', 'success');
                return {
                    success: true,
                    message: 'All pickup data fetched successfully'
                };
            } else {
                const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
                setError(`Some data failed to load: ${errorMessages}`);
                addLog(`⚠️ Some pickup data failed to load: ${errorMessages}`, 'warning');
                return {
                    success: false,
                    message: errorMessages
                };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all pickup data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all pickup data error:', err);
            return {
                success: false,
                message: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, [fetchPendingPickups, fetchOptimizedRoute, fetchPickupStatistics, addLog]);

    // ===== HEALTH CHECK =====
    const checkPickupHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Checking pickup module health...', 'test');

        try {
            const result = await pickupApi.checkPickupHealth();
            if (result.success) {
                addLog('✅ Pickup module is healthy', 'success');
                return {
                    success: true,
                    data: result.data,
                    message: result.message
                };
            } else {
                setError(result.message);
                addLog(`❌ Pickup module health check failed: ${result.message}`, 'error');
                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (err) {
            const errorMsg = 'Failed to check pickup module health';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Pickup health check error:', err);
            return {
                success: false,
                message: errorMsg
            };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== UTILITY FUNCTIONS =====
    const getPickupById = useCallback((deliveryId) => {
        return pendingPickups.find(pickup => pickup.delivery_id === deliveryId);
    }, [pendingPickups]);

    const getPickupsByVendorType = useCallback((vendorType) => {
        return pendingPickups.filter(pickup => pickup.vendor?.vendor_type === vendorType);
    }, [pendingPickups]);

    const getPickupsByPriority = useCallback((priority) => {
        return pendingPickups.filter(pickup => pickup.priority === priority);
    }, [pendingPickups]);

    const value = {
        // State
        pendingPickups,
        groupedPickups,
        pickupStats,
        selectedPickup,
        optimizedRoute,
        pickupStatistics,
        loading,
        error,
        operationLogs,
        totalPickups: pendingPickups.length,

        // Fetch Functions
        fetchPendingPickups,
        fetchPickupDetails,
        fetchVendorContact,
        fetchPickupNavigation,
        fetchOptimizedRoute,
        fetchPickupStatistics,
        fetchAllPickupData,

        // Action Functions

        confirmPickup,

        // Health Check
        checkPickupHealth,

        // Utility Functions
        getPickupById,
        getPickupsByVendorType,
        getPickupsByPriority,
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog,

        // State setters
        setSelectedPickup
    };

    return (
        <PendingPickupsContext.Provider value={value}>
            {children}
        </PendingPickupsContext.Provider>
    );
};