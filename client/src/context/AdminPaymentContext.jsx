import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as paymentApi from '../api/admin/payments';

const AdminPaymentContext = createContext();

export const useAdminPayment = () => {
    const context = useContext(AdminPaymentContext);
    if (!context) {
        throw new Error('useAdminPayment must be used within AdminPaymentProvider');
    }
    return context;
};

export const AdminPaymentProvider = ({ children }) => {
    // State
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState({
        total_payments: 0,
        total_success: 0,
        total_failed: 0,
        total_pending: 0,
        total_refunded: 0,
        total_revenue: 0,
        today_revenue: 0,
        monthly_revenue: 0
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        method: '',
        fromDate: '',
        toDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPayment, setCurrentPayment] = useState(null);

    // Fetch Payments List
    const fetchPayments = useCallback(async (currPage = 1, currFilters = filters) => {
        setLoading(true);
        setError(null);
        try {
            const data = await paymentApi.fetchPayments({
                page: currPage,
                limit: pagination.limit,
                ...currFilters
            });

            if (data.success) {
                setPayments(data.data);
                if (data.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        page: currPage,
                        total: data.pagination.total,
                        pages: data.pagination.pages
                    }));
                }
            } else {
                setError(data.message || 'Failed to fetch payments');
            }
        } catch (err) {
            console.error("Fetch payments error:", err);
            setError(err.response?.data?.message || 'Error fetching payments');
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, filters]); // removed filters dependency to avoid loop if not handled carefully, but passed as arg

    // Fetch Summary
    const fetchSummary = useCallback(async () => {
        try {
            const data = await paymentApi.fetchPaymentSummary();
            if (data.success) {
                setSummary(data.data);
            }
        } catch (err) {
            console.error("Fetch summary error:", err);
            // Don't set main error state for summary failure, just log it
        }
    }, []);

    // Get Payment Details
    const getPaymentDetails = useCallback(async (id) => {
        setLoading(true);
        try {
            const data = await paymentApi.fetchPaymentDetails(id);
            if (data.success) {
                setCurrentPayment(data.data);
                return data.data;
            } else {
                setError(data.message);
                return null;
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching details');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update Filters
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        // Reset to page 1 when filters change
        fetchPayments(1, { ...filters, ...newFilters });
    }, [filters, fetchPayments]); // Ensure fetchPayments is stable or use ref

    // Change Page
    const changePage = useCallback((newPage) => {
        fetchPayments(newPage, filters);
    }, [fetchPayments, filters]);

    // Initial Load - Optional, better triggered by page component
    // useEffect(() => {
    //     fetchPayments();
    //     fetchSummary();
    // }, []);

    const value = {
        payments,
        summary,
        pagination,
        filters,
        loading,
        error,
        currentPayment,
        fetchPayments,
        fetchSummary,
        getPaymentDetails,
        updateFilters,
        changePage,
        clearError: () => setError(null)
    };

    return (
        <AdminPaymentContext.Provider value={value}>
            {children}
        </AdminPaymentContext.Provider>
    );
};
