import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as offerApi from '../api/offer';
import { useAuth } from './AuthContext';

const OfferContext = createContext();

export const useOfferContext = () => {
    const context = useContext(OfferContext);
    if (!context) {
        throw new Error('useOfferContext must be used within OfferProvider');
    }
    return context;
};

export const OfferProvider = ({ children }) => {
    // Auth context
    const { isAuthenticated, isAdmin } = useAuth();
    
    // State
    const [activeOffers, setActiveOffers] = useState([]);
    const [allOffers, setAllOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [offerStats, setOfferStats] = useState({
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
        setActiveOffers([]);
        setAllOffers([]);
        setSelectedOffer(null);
        setOperationLogs([]);
        setError(null);
        setCurrentPage(1);
        setOfferStats({
            total: 0,
            active: 0,
            expired: 0,
            upcoming: 0
        });
        addLog('All offer data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Offer operation logs cleared', 'info');
    }, [addLog]);

    // ===== FETCH ACTIVE OFFERS (PUBLIC) =====
    const fetchActiveOffers = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching active offers...', 'info');
        
        try {
            const result = await offerApi.fetchActiveOffers();
            if (result.success) {
                setActiveOffers(result.data || []);
                addLog(`✅ Active offers fetched: ${result.data.length} offers`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch active offers: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch active offers';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Active offers endpoint not found';
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
            console.error('Fetch active offers error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== FETCH ALL OFFERS (ADMIN) =====
    const fetchAllOffers = useCallback(async (page = 1, limit = 20) => {
        // Check admin permissions
        if (!isAuthenticated) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        const skip = (page - 1) * limit;
        addLog(`Fetching all offers (page: ${page}, limit: ${limit})...`, 'info');
        
        try {
            const result = await offerApi.fetchAllOffers(skip, limit);
            if (result.success) {
                setAllOffers(result.data || []);
                setCurrentPage(page);
                
                // Calculate stats
                const now = new Date();
                const stats = {
                    total: result.data.length,
                    active: result.data.filter(o => 
                        o.is_active && 
                        new Date(o.start_date) <= now && 
                        new Date(o.end_date) >= now
                    ).length,
                    expired: result.data.filter(o => new Date(o.end_date) < now).length,
                    upcoming: result.data.filter(o => new Date(o.start_date) > now).length
                };
                setOfferStats(stats);
                
                addLog(`✅ All offers fetched: ${result.data.length} offers`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch all offers: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch all offers';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'All offers endpoint not found';
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
            console.error('Fetch all offers error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, addLog]);

    // ===== FETCH OFFER BY ID (ADMIN) =====
    const fetchOfferById = useCallback(async (offerId) => {
        // Check admin permissions
        if (!isAuthenticated || !isAdmin) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Fetching offer ID: ${offerId}...`, 'info');
        
        try {
            const result = await offerApi.fetchOfferById(offerId);
            if (result.success) {
                setSelectedOffer(result.data);
                addLog(`✅ Offer ${offerId} fetched successfully`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch offer: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch offer';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Offer endpoint not found';
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
            console.error('Fetch offer by ID error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, addLog]);

    // ===== CREATE OFFER (ADMIN) =====
    const createNewOffer = useCallback(async (offerData) => {
        // Check admin permissions
        if (!isAuthenticated || !isAdmin) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        addLog('Creating new offer...', 'info');
        
        try {
            const result = await offerApi.createOffer(offerData);
            if (result.success) {
                // Refresh the list
                await fetchAllOffers(currentPage);
                addLog('✅ Offer created successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to create offer: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to create offer';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Create offer endpoint not found';
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
            console.error('Create offer error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, fetchAllOffers, currentPage, addLog]);

    // ===== UPDATE OFFER (ADMIN) =====
    const updateExistingOffer = useCallback(async (offerId, offerData) => {
        // Check admin permissions
        if (!isAuthenticated || !isAdmin) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Updating offer ID: ${offerId}...`, 'info');
        
        try {
            const result = await offerApi.updateOffer(offerId, offerData);
            if (result.success) {
                // Refresh the list and selected offer
                await fetchAllOffers(currentPage);
                if (selectedOffer?.offer_id === offerId) {
                    await fetchOfferById(offerId);
                }
                addLog(`✅ Offer ${offerId} updated successfully`, 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update offer: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to update offer';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Update offer endpoint not found';
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
            console.error('Update offer error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, fetchAllOffers, currentPage, selectedOffer, fetchOfferById, addLog]);

    // ===== UPDATE OFFER STATUS (ADMIN) =====
    const updateOfferActiveStatus = useCallback(async (offerId, isActive) => {
        // Check admin permissions
        if (!isAuthenticated || !isAdmin) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Updating offer ${offerId} status to: ${isActive ? 'active' : 'inactive'}...`, 'info');
        
        try {
            const result = await offerApi.updateOfferStatus(offerId, isActive);
            if (result.success) {
                // Refresh the list
                await fetchAllOffers(currentPage);
                addLog(`✅ Offer ${offerId} status updated`, 'success');
                return { success: true, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update offer status: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to update offer status';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Update offer status endpoint not found';
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
            console.error('Update offer status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, fetchAllOffers, currentPage, addLog]);

    // ===== DELETE OFFER (ADMIN) =====
    const deleteExistingOffer = useCallback(async (offerId) => {
        // Check admin permissions
        if (!isAuthenticated || !isAdmin) {
            addLog('⚠️ Unauthorized: Admin access required', 'warning');
            return { success: false, message: 'Admin access required' };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Deleting offer ID: ${offerId}...`, 'info');
        
        try {
            const result = await offerApi.deleteOffer(offerId);
            if (result.success) {
                // Refresh the list
                await fetchAllOffers(currentPage);
                setSelectedOffer(null);
                addLog(`✅ Offer ${offerId} deleted successfully`, 'success');
                return { success: true, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to delete offer: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to delete offer';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Delete offer endpoint not found';
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
            console.error('Delete offer error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, fetchAllOffers, currentPage, addLog]);

    // ===== HELPER FUNCTIONS =====
    const getOffersForVariant = useCallback((variantId) => {
        return activeOffers.filter(offer => 
            !offer.variants || offer.variants.length === 0 || offer.variants.includes(variantId)
        );
    }, [activeOffers]);

    const formatDiscountText = useCallback((offer) => {
        if (!offer) return '';
        
        if (offer.discount_type === 'PERCENT') {
            return `${offer.discount_value}% OFF`;
        } else {
            return `₹${offer.discount_value} OFF`;
        }
    }, []);

    const getBestOfferForVariant = useCallback((variantId) => {
        const offers = getOffersForVariant(variantId);
        if (offers.length === 0) return null;
        
        return offers.reduce((best, current) => {
            if (current.discount_type === 'PERCENT' && best.discount_type === 'PERCENT') {
                return current.discount_value > best.discount_value ? current : best;
            } else if (current.discount_type === 'FLAT' && best.discount_type === 'FLAT') {
                return current.discount_value > best.discount_value ? current : best;
            } else {
                // Prefer percentage discounts for comparison
                return current.discount_type === 'PERCENT' ? current : best;
            }
        });
    }, [getOffersForVariant]);

    // Load active offers on mount
    useEffect(() => {
        fetchActiveOffers();
    }, [fetchActiveOffers]);

    // Load all offers if admin
    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchAllOffers();
        }
    }, [isAuthenticated, isAdmin, fetchAllOffers]);

    const value = {
        // State
        activeOffers,
        allOffers,
        selectedOffer,
        loading,
        error,
        operationLogs,
        currentPage,
        offerStats,
        
        // Public Functions
        fetchActiveOffers,
        
        // Admin Functions
        fetchAllOffers,
        fetchOfferById,
        createNewOffer,
        updateExistingOffer,
        updateOfferActiveStatus,
        deleteExistingOffer,
        
        // Helper Functions
        getOffersForVariant,
        formatDiscountText,
        getBestOfferForVariant,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog,
        
        // Permissions
        isAdmin
    };

    return (
        <OfferContext.Provider value={value}>
            {children}
        </OfferContext.Provider>
    );
};