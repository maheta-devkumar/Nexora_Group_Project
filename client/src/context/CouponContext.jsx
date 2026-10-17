import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as couponApi from '../api/coupon';
import { useAuth } from './AuthContext';

const CouponContext = createContext();

export const useCouponContext = () => {
    const context = useContext(CouponContext);
    if (!context) {
        throw new Error('useCouponContext must be used within CouponProvider');
    }
    return context;
};

export const CouponProvider = ({ children }) => {
    // Auth context
    const { isAuthenticated, isAdmin } = useAuth();
    
    // State
    const [activeCoupons, setActiveCoupons] = useState([]);
    const [allCoupons, setAllCoupons] = useState([]);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1)
    const [couponStats, setCouponStats] = useState({
        total: 0,
        active: 0,
        expired: 0,
        upcoming: 0
    });

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
        setActiveCoupons([]);
        setAllCoupons([]);
        setSelectedCoupon(null);
        setValidationResult(null);
        setOperationLogs([]);
        setError(null);
        setCurrentPage(1);
        setCouponStats({
            total: 0,
            active: 0,
            expired: 0,
            upcoming: 0
        });
        addLog('All coupon data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Coupon operation logs cleared', 'info');
    }, [addLog]);

    // ===== FETCH ACTIVE COUPONS (PUBLIC) =====
    const fetchActiveCoupons = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching active coupons...', 'info');
        
        try {
            const result = await couponApi.fetchActiveCoupons();
            if (result.success) {
                setActiveCoupons(result.data || []);
                addLog(`✅ Active coupons fetched: ${result.data.length} coupons`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch active coupons: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch active coupons';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Active coupons endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch active coupons error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH ALL COUPONS (ADMIN) =====
    const fetchAllCoupons = useCallback(async (page = 1, limit = 20) => {
        // Check admin permissions
        if (!isAuthenticated) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        const skip = (page - 1) * limit;
        addLog(`Fetching all coupons (page: ${page}, limit: ${limit})...`, 'info');
        
        try {
            const result = await couponApi.fetchAllCoupons(skip, limit);
            if (result.success) {
                setAllCoupons(result.data || []);
                setCurrentPage(page);
                
                // Calculate stats
                const now = new Date();
                const stats = {
                    total: result.data.length,
                    active: result.data.filter(c => 
                        c.is_active && 
                        new Date(c.start_date) <= now && 
                        new Date(c.end_date) >= now
                    ).length,
                    expired: result.data.filter(c => new Date(c.end_date) < now).length,
                    upcoming: result.data.filter(c => new Date(c.start_date) > now).length
                };
                setCouponStats(stats);
                
                addLog(`✅ All coupons fetched: ${result.data.length} coupons`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch all coupons: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch all coupons';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'All coupons endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all coupons error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, addLog]);

    // ===== VALIDATE COUPON (PUBLIC) =====
    const validateCouponCode = useCallback(async (couponCode, variantIds, orderTotal) => {
        setLoading(true);
        setError(null);
        setValidationResult(null);
        addLog(`Validating coupon: ${couponCode}...`, 'info');
        
        try {
            const result = await couponApi.validateCoupon(couponCode, variantIds, orderTotal);
            if (result.success) {
                setValidationResult(result.data);
                const isValid = result.data?.valid || false;
                
                if (isValid) {
                    addLog(`✅ Coupon ${couponCode} is valid`, 'success');
                } else {
                    addLog(`❌ Coupon ${couponCode} is invalid: ${result.data?.message || 'Invalid coupon'}`, 'error');
                }
                
                return { 
                    success: true, 
                    data: result.data,
                    isValid,
                    message: result.data?.message || result.message
                };
            } else {
                setError(result.message);
                setValidationResult(null);
                addLog(`❌ Coupon validation failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to validate coupon';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Validate coupon endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            setValidationResult(null);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Validate coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH COUPON BY ID (ADMIN) =====
    const fetchCouponById = useCallback(async (couponId) => {
        // Check admin permissions
        if (!isAuthenticated || !isAdmin) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Fetching coupon ID: ${couponId}...`, 'info');
        
        try {
            const result = await couponApi.fetchCouponById(couponId);
            if (result.success) {
                setSelectedCoupon(result.data);
                addLog(`✅ Coupon ${couponId} fetched successfully`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch coupon: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch coupon';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Coupon endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch coupon by ID error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, addLog]);

    // ===== CREATE COUPON (ADMIN) =====
    const createNewCoupon = useCallback(async (couponData) => {
        // Check admin permissions
        if (!isAuthenticated || !isAdmin) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        addLog('Creating new coupon...', 'info');
        
        try {
            const result = await couponApi.createCoupon(couponData);
            if (result.success) {
                // Refresh the list
                await fetchAllCoupons(currentPage);
                addLog('✅ Coupon created successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to create coupon: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to create coupon';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Create coupon endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Create coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, fetchAllCoupons, currentPage, addLog]);

    // ===== UPDATE COUPON (ADMIN) =====
    const updateExistingCoupon = useCallback(async (couponId, couponData) => {
        // Check admin permissions
        if (!isAuthenticated || !isAdmin) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Updating coupon ID: ${couponId}...`, 'info');
        
        try {
            const result = await couponApi.updateCoupon(couponId, couponData);
            if (result.success) {
                // Refresh the list and selected coupon
                await fetchAllCoupons(currentPage);
                if (selectedCoupon?.coupon_id === couponId) {
                    await fetchCouponById(couponId);
                }
                addLog(`✅ Coupon ${couponId} updated successfully`, 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update coupon: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to update coupon';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Update coupon endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, fetchAllCoupons, currentPage, selectedCoupon, fetchCouponById, addLog]);

    // ===== UPDATE COUPON STATUS (ADMIN) =====
    const updateCouponActiveStatus = useCallback(async (couponId, isActive) => {
        // Check admin permissions
        if (!isAuthenticated || !isAdmin) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Updating coupon ${couponId} status to: ${isActive ? 'active' : 'inactive'}...`, 'info');
        
        try {
            const result = await couponApi.updateCouponStatus(couponId, isActive);
            if (result.success) {
                // Refresh the list
                await fetchAllCoupons(currentPage);
                addLog(`✅ Coupon ${couponId} status updated`, 'success');
                return { success: true, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update coupon status: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to update coupon status';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Update coupon status endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update coupon status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, fetchAllCoupons, currentPage, addLog]);

    // ===== DELETE COUPON (ADMIN) =====
    const deleteExistingCoupon = useCallback(async (couponId) => {
        // Check admin permissions
        if (!isAuthenticated || !isAdmin) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Deleting coupon ID: ${couponId}...`, 'info');
        
        try {
            const result = await couponApi.deleteCoupon(couponId);
            if (result.success) {
                // Refresh the list
                await fetchAllCoupons(currentPage);
                setSelectedCoupon(null);
                addLog(`✅ Coupon ${couponId} deleted successfully`, 'success');
                return { success: true, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to delete coupon: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to delete coupon';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Delete coupon endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Delete coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, fetchAllCoupons, currentPage, addLog]);

    // ===== HELPER FUNCTIONS =====
    const clearValidation = useCallback(() => {
        setValidationResult(null);
        setError(null);
        addLog('Coupon validation cleared', 'info');
    }, [addLog]);

    const getCouponByCode = useCallback((code) => {
        return activeCoupons.find(coupon => coupon.code === code) || 
               allCoupons.find(coupon => coupon.code === code);
    }, [activeCoupons, allCoupons]);

    const formatDiscountText = useCallback((coupon) => {
        if (!coupon) return '';
        
        if (coupon.discount_type === 'PERCENT') {
            return `${coupon.discount_value}% OFF`;
        } else {
            return `₹${coupon.discount_value} OFF`;
        }
    }, []);

    const isCouponApplicable = useCallback((coupon, variantIds) => {
        if (!coupon || !variantIds || variantIds.length === 0) return true;
        
        if (!coupon.variants || coupon.variants.length === 0) return true;
        
        return variantIds.some(variantId => coupon.variants.includes(variantId));
    }, []);

    // Load active coupons on mount
    useEffect(() => {
        fetchActiveCoupons();
    }, [fetchActiveCoupons]);

    // Load all coupons if admin
    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchAllCoupons();
        }
    }, [isAuthenticated, isAdmin, fetchAllCoupons]);

    const value = {
        // State
        activeCoupons,
        allCoupons,
        selectedCoupon,
        validationResult,
        loading,
        error,
        operationLogs,
        currentPage,
        couponStats,
        
        // Public Functions
        fetchActiveCoupons,
        validateCouponCode,
        clearValidation,
        
        // Admin Functions
        fetchAllCoupons,
        fetchCouponById,
        createNewCoupon,
        updateExistingCoupon,
        updateCouponActiveStatus,
        deleteExistingCoupon,
        
        // Helper Functions
        getCouponByCode,
        formatDiscountText,
        isCouponApplicable,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog,
        
        // Permissions
        isAdmin
    };

    return (
        <CouponContext.Provider value={value}>
            {children}
        </CouponContext.Provider>
    );
};