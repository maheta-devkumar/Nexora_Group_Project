import React, { createContext, useContext, useState, useCallback } from 'react';
import * as availableDeliveriesApi from '../../api/delivery_panel/available_deliveries';
import { toast } from 'react-toastify';

const AvailableDeliveriesContext = createContext();

export const useAvailableDeliveriesContext = () => {
    const context = useContext(AvailableDeliveriesContext);
    if (!context) {
        throw new Error('useAvailableDeliveriesContext must be used within AvailableDeliveriesProvider');
    }
    return context;
};

export const AvailableDeliveriesProvider = ({ children }) => {
    // State
    const [availableDeliveries, setAvailableDeliveries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setAvailableDeliveries([]);
        setError(null);
    }, []);

    // ===== GET AVAILABLE DELIVERIES =====
    const getAvailableDeliveries = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await availableDeliveriesApi.fetchAvailableDeliveries();
            console.log('API Response for available deliveries:', result); // Debug log

            if (result.success) {
                const deliveries = result.data || [];
                console.log('Setting available deliveries:', deliveries.length, 'items'); // Debug log
                setAvailableDeliveries(deliveries);

                if (deliveries.length > 0) {
                    console.log('First delivery sample:', deliveries[0]); // Debug log
                }

                return {
                    success: true,
                    data: deliveries,
                    count: deliveries.length,
                    message: `Loaded ${deliveries.length} available deliveries`
                };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch available deliveries';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Get available deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // ===== ACCEPT DELIVERY =====
    const acceptDelivery = useCallback(async (deliveryId) => {
        setActionInProgress(true);
        setError(null);

        try {
            if (!deliveryId) {
                const errorMsg = 'Invalid delivery ID received for acceptance';
                console.error(errorMsg);
                setError(errorMsg);
                toast.error(errorMsg);
                return { success: false, message: errorMsg };
            }

            console.log(`[AvailableDeliveries] Accepting delivery ID: ${deliveryId}`); // Debug log
            const result = await availableDeliveriesApi.acceptAvailableDelivery(deliveryId);
            console.log('[AvailableDeliveries] API Result:', result); // Debug log

            if (result.success) {
                // Remove from available deliveries
                setAvailableDeliveries(prev => {
                    const newList = prev.filter(delivery => delivery.delivery_id !== deliveryId);
                    console.log('Delivery accepted. Remaining:', newList.length); // Debug log
                    return newList;
                });

                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to accept delivery';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Accept delivery error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setActionInProgress(false);
        }
    }, []);

    // ===== CANCEL DELIVERY =====
    const cancelDelivery = useCallback(async (deliveryId) => {
        setActionInProgress(true);
        setError(null);

        try {
            console.log('Attempting to cancel delivery:', deliveryId); // Debug log
            const result = await availableDeliveriesApi.cancelDelivery(deliveryId);

            if (result.success) {
                // Remove from available deliveries
                setAvailableDeliveries(prev => {
                    const newList = prev.filter(delivery => delivery.delivery_id !== deliveryId);
                    console.log('Delivery cancelled. Remaining:', newList.length); // Debug log
                    return newList;
                });

                return { success: true, data: result.data };
            } else {
                setError(result.message);
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to cancel delivery';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Cancel delivery error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setActionInProgress(false);
        }
    }, []);

    // ===== BATCH OPERATIONS =====
    const acceptMultipleDeliveries = useCallback(async (deliveryIds) => {
        setActionInProgress(true);
        setError(null);

        try {
            console.log('Attempting to accept multiple deliveries:', deliveryIds); // Debug log
            const results = await Promise.all(
                deliveryIds.map(id => availableDeliveriesApi.acceptAvailableDelivery(id))
            );

            const allSuccess = results.every(result => result.success);

            if (allSuccess) {
                // Remove all accepted deliveries
                setAvailableDeliveries(prev => {
                    const newList = prev.filter(delivery => !deliveryIds.includes(delivery.delivery_id));
                    console.log('Multiple deliveries accepted. Remaining:', newList.length); // Debug log
                    return newList;
                });

                return {
                    success: true,
                    count: deliveryIds.length,
                    message: `${deliveryIds.length} deliveries accepted`
                };
            } else {
                const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
                const errorMsg = `Some deliveries failed: ${errorMessages}`;
                setError(errorMsg);
                toast.error(errorMsg);
                return { success: false, message: errorMsg };
            }
        } catch (err) {
            const errorMsg = 'Failed to accept multiple deliveries';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Accept multiple deliveries error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setActionInProgress(false);
        }
    }, []);

    // ===== REFRESH AVAILABLE DELIVERIES =====
    const refreshAvailableDeliveries = useCallback(async () => {
        console.log('Refreshing available deliveries...'); // Debug log
        return await getAvailableDeliveries();
    }, [getAvailableDeliveries]);

    // Calculate waiting time - FIXED with better error handling
    const calculateWaitingTime = (availableSince) => {
        if (!availableSince) {
            console.warn('calculateWaitingTime called with null/undefined availableSince');
            return 0;
        }

        try {
            const availableDate = new Date(availableSince);

            // Check if date is valid
            if (isNaN(availableDate.getTime())) {
                console.warn('Invalid date format for availableSince:', availableSince);
                return 0;
            }

            const now = new Date();
            const diffMinutes = Math.floor((now - availableDate) / (1000 * 60));
            return Math.max(0, diffMinutes); // Ensure non-negative
        } catch (error) {
            console.error('Error calculating waiting time:', error);
            return 0;
        }
    };

    // Filter available deliveries by criteria - FIXED with better null handling
    const filterDeliveries = useCallback((criteria = {}) => {
        let filtered = [...availableDeliveries];

        if (criteria.minWaitingTime !== undefined) {
            filtered = filtered.filter(delivery => {
                const waitingTime = calculateWaitingTime(delivery.available_since);
                return waitingTime >= criteria.minWaitingTime;
            });
        }

        if (criteria.maxWaitingTime !== undefined) {
            filtered = filtered.filter(delivery => {
                const waitingTime = calculateWaitingTime(delivery.available_since);
                return waitingTime <= criteria.maxWaitingTime;
            });
        }

        if (criteria.searchTerm) {
            const term = criteria.searchTerm.toLowerCase();
            filtered = filtered.filter(delivery => {
                const customerName = delivery.customer_name || '';
                const deliveryAddress = delivery.delivery_address || '';
                const orderId = delivery.order_id ? delivery.order_id.toString() : '';

                return customerName.toLowerCase().includes(term) ||
                    deliveryAddress.toLowerCase().includes(term) ||
                    orderId.includes(term);
            });
        }

        return filtered;
    }, [availableDeliveries]);

    // Get delivery statistics - FIXED with better empty state handling
    const getDeliveryStats = useCallback(() => {
        const totalAvailable = availableDeliveries.length;

        if (totalAvailable === 0) {
            return {
                totalAvailable: 0,
                avgWaitingTime: 0,
                longestWaiting: null
            };
        }

        // Calculate waiting times for all deliveries
        const waitingTimes = availableDeliveries.map(delivery =>
            calculateWaitingTime(delivery.available_since)
        );

        const totalWaitingTime = waitingTimes.reduce((sum, time) => sum + time, 0);
        const avgWaitingTime = Math.round(totalWaitingTime / totalAvailable);

        // Find longest waiting delivery
        let longestWaiting = { delivery: null, waitingTime: 0 };
        availableDeliveries.forEach((delivery, index) => {
            const waitingTime = waitingTimes[index];
            if (waitingTime > longestWaiting.waitingTime) {
                longestWaiting = { delivery, waitingTime };
            }
        });

        return {
            totalAvailable,
            avgWaitingTime,
            longestWaiting: longestWaiting.delivery ? {
                ...longestWaiting.delivery,
                waitingTime: longestWaiting.waitingTime
            } : null
        };
    }, [availableDeliveries]);

    const value = {
        // State
        availableDeliveries,
        loading,
        error,
        actionInProgress,

        // Actions (Only 3 core API methods)
        getAvailableDeliveries,
        acceptDelivery,
        cancelDelivery,
        acceptMultipleDeliveries, // This uses the accept API internally
        refreshAvailableDeliveries,

        // Utility Functions
        clearError,
        clearAllData,
        filterDeliveries,
        getDeliveryStats,
        calculateWaitingTime
    };

    return (
        <AvailableDeliveriesContext.Provider value={value}>
            {children}
        </AvailableDeliveriesContext.Provider>
    );
};