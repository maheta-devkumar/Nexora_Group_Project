import React, { createContext, useContext, useState, useCallback } from 'react';
import * as deliveryPersonApi from '../api/deliveryPersons';

const DeliveryPersonContext = createContext();

export const useDeliveryPersonContext = () => {
    const context = useContext(DeliveryPersonContext);
    if (!context) {
        throw new Error('useDeliveryPersonContext must be used within DeliveryPersonProvider');
    }
    return context;
};

export const DeliveryPersonProvider = ({ children }) => {
    const [deliveryPersons, setDeliveryPersons] = useState([]);
    const [currentDeliveryPerson, setCurrentDeliveryPerson] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 20,
        total_items: 0,
        total_pages: 0
    });

    // Fetch all delivery persons
    const fetchDeliveryPersons = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await deliveryPersonApi.fetchAllDeliveryPersons(params);
            if (result.success) {
                setDeliveryPersons(result.data || []);
                // Update pagination if backend provides it
                if (params.page) setPagination(prev => ({ ...prev, page: params.page }));
                if (params.per_page) setPagination(prev => ({ ...prev, per_page: params.per_page }));
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery persons';
            setError(errorMsg);
            console.error('Fetch delivery persons error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch delivery person by ID
    const fetchDeliveryPersonById = useCallback(async (deliveryPersonId) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await deliveryPersonApi.fetchDeliveryPersonById(deliveryPersonId);
            if (result.success) {
                setCurrentDeliveryPerson(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery person';
            setError(errorMsg);
            console.error('Fetch delivery person error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch current user's delivery profile
    const fetchMyDeliveryProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await deliveryPersonApi.fetchMyDeliveryProfile();
            if (result.success) {
                setCurrentDeliveryPerson(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery profile';
            setError(errorMsg);
            console.error('Fetch delivery profile error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Register as a delivery person
    const registerDeliveryPerson = useCallback(async (deliveryData) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await deliveryPersonApi.registerDeliveryPerson(deliveryData);
            if (result.success) {
                setSuccessMessage(result.message || 'Registration submitted successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to register as delivery person';
            setError(errorMsg);
            console.error('Register delivery person error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Apply to become a delivery person
    const applyAsDeliveryPerson = useCallback(async (applicationData) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await deliveryPersonApi.applyAsDeliveryPerson(applicationData);
            if (result.success) {
                setSuccessMessage(result.message || 'Application submitted successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to apply as delivery person';
            setError(errorMsg);
            console.error('Apply as delivery person error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update delivery person status
    const updateDeliveryPersonStatus = useCallback(async (deliveryPersonId, status) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await deliveryPersonApi.updateDeliveryPersonStatus(deliveryPersonId, status);
            if (result.success) {
                // Update in delivery persons list
                setDeliveryPersons(prev => prev.map(dp => 
                    dp.delivery_person_id === deliveryPersonId ? { ...dp, status } : dp
                ));
                // Update current delivery person if it's the one being updated
                if (currentDeliveryPerson?.delivery_person_id === deliveryPersonId) {
                    setCurrentDeliveryPerson(prev => ({ ...prev, status }));
                }
                setSuccessMessage(result.message || 'Status updated successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to update delivery person status';
            setError(errorMsg);
            console.error('Update delivery person status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentDeliveryPerson]);

    // Update delivery person rating
    const updateDeliveryPersonRating = useCallback(async (deliveryPersonId, rating) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await deliveryPersonApi.updateDeliveryPersonRating(deliveryPersonId, rating);
            if (result.success) {
                // Update in delivery persons list
                setDeliveryPersons(prev => prev.map(dp => 
                    dp.delivery_person_id === deliveryPersonId ? { ...dp, rating } : dp
                ));
                // Update current delivery person if it's the one being updated
                if (currentDeliveryPerson?.delivery_person_id === deliveryPersonId) {
                    setCurrentDeliveryPerson(prev => ({ ...prev, rating }));
                }
                setSuccessMessage(result.message || 'Rating updated successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to update delivery person rating';
            setError(errorMsg);
            console.error('Update delivery person rating error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentDeliveryPerson]);

    // Delete delivery person
    const deleteDeliveryPerson = useCallback(async (deliveryPersonId) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await deliveryPersonApi.deleteDeliveryPerson(deliveryPersonId);
            if (result.success) {
                // Remove from delivery persons list
                setDeliveryPersons(prev => prev.filter(dp => dp.delivery_person_id !== deliveryPersonId));
                // Clear current delivery person if it's the one being deleted
                if (currentDeliveryPerson?.delivery_person_id === deliveryPersonId) {
                    setCurrentDeliveryPerson(null);
                }
                setSuccessMessage(result.message || 'Delivery person deleted successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to delete delivery person';
            setError(errorMsg);
            console.error('Delete delivery person error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentDeliveryPerson]);

    // Fetch delivery person statistics
    const fetchDeliveryPersonStats = useCallback(async (deliveryPersonId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deliveryPersonApi.fetchDeliveryPersonStats(deliveryPersonId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to fetch delivery person stats';
            setError(errorMsg);
            console.error('Fetch delivery person stats error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear success message
    const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

    // Clear current delivery person
    const clearCurrentDeliveryPerson = useCallback(() => setCurrentDeliveryPerson(null), []);

    const value = {
        deliveryPersons,
        currentDeliveryPerson,
        loading,
        error,
        successMessage,
        pagination,
        fetchDeliveryPersons,
        fetchDeliveryPersonById,
        fetchMyDeliveryProfile,
        registerDeliveryPerson,
        applyAsDeliveryPerson,
        updateDeliveryPersonStatus,
        updateDeliveryPersonRating,
        deleteDeliveryPerson,
        fetchDeliveryPersonStats,
        clearError,
        clearSuccessMessage,
        clearCurrentDeliveryPerson
    };

    return (
        <DeliveryPersonContext.Provider value={value}>
            {children}
        </DeliveryPersonContext.Provider>
    );
};