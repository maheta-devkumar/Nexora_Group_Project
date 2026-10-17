import React, { createContext, useContext, useState, useCallback } from 'react';
import * as customerApi from '../api/customers';

const CustomerContext = createContext();

export const useCustomerContext = () => {
    const context = useContext(CustomerContext);
    if (!context) {
        throw new Error('useCustomerContext must be used within CustomerProvider');
    }
    return context;
};

export const CustomerProvider = ({ children }) => {
    const [customers, setCustomers] = useState([]);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Fetch all customers
    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await customerApi.fetchAllCustomers();
            if (result.success) {
                setCustomers(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch customers';
            setError(errorMsg);
            console.error('Fetch customers error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch customer by ID
    const fetchCustomerById = useCallback(async (customerId) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await customerApi.fetchCustomerById(customerId);
            if (result.success) {
                setCurrentCustomer(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch customer';
            setError(errorMsg);
            console.error('Fetch customer error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update customer
    const updateCustomer = useCallback(async (customerId, updateData) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await customerApi.updateCustomer(customerId, updateData);
            if (result.success) {
                // Update customers list
                setCustomers(prev => prev.map(customer => 
                    customer.user_id === customerId ? { ...customer, ...result.data } : customer
                ));
                // Update current customer if it's the one being updated
                if (currentCustomer?.user_id === customerId) {
                    setCurrentCustomer(prev => ({ ...prev, ...result.data }));
                }
                setSuccessMessage(result.message || 'Customer updated successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update customer';
            setError(errorMsg);
            console.error('Update customer error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentCustomer]);

    // Delete customer
    const deleteCustomer = useCallback(async (customerId) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await customerApi.deleteCustomer(customerId);
            if (result.success) {
                // Remove from customers list
                setCustomers(prev => prev.filter(u => u.user_id !== customerId));
                // Clear current customer if it's the one being deleted
                if (currentCustomer?.user_id === customerId) {
                    setCurrentCustomer(null);
                }
                setSuccessMessage(result.message || 'Customer deleted successfully');
                return { success: true };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to delete customer';
            setError(errorMsg);
            console.error('Delete customer error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentCustomer]);

    // Fetch customer orders
    const fetchCustomerOrders = useCallback(async (customerId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await customerApi.fetchCustomerOrders(customerId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch customer orders';
            setError(errorMsg);
            console.error('Fetch customer orders error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch customer statistics
    const fetchCustomerStats = useCallback(async (customerId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await customerApi.fetchCustomerStats(customerId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch customer statistics';
            setError(errorMsg);
            console.error('Fetch customer stats error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear success message
    const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

    // Clear current customer
    const clearCurrentCustomer = useCallback(() => setCurrentCustomer(null), []);

    const value = {
        customers,
        currentCustomer,
        loading,
        error,
        successMessage,
        fetchCustomers,
        fetchCustomerById,
        updateCustomer,
        deleteCustomer,
        fetchCustomerOrders,
        fetchCustomerStats,
        clearError,
        clearSuccessMessage,
        clearCurrentCustomer
    };

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};