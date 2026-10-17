import React, { createContext, useContext, useState, useCallback } from 'react';
import * as marketingApi from '../api/marketing';

const MarketingContext = createContext();

export const useMarketingContext = () => {
    const context = useContext(MarketingContext);
    if (!context) {
        throw new Error('useMarketingContext must be used within MarketingProvider');
    }
    return context;
};

export const MarketingProvider = ({ children }) => {
    // Coupons State
    const [coupons, setCoupons] = useState([]);
    const [activeCoupons, setActiveCoupons] = useState([]);
    const [currentCoupon, setCurrentCoupon] = useState(null);
    
    // Offers State
    const [offers, setOffers] = useState([]);
    const [activeOffers, setActiveOffers] = useState([]);
    const [currentOffer, setCurrentOffer] = useState(null);
    
    // Common State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ==================== COUPON FUNCTIONS ====================
    const fetchAllCoupons = useCallback(async (skip = 0, limit = 100) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.fetchAllCoupons(skip, limit);
            console.log('fetchAllCoupons API result:', result); // Debug log
            
            if (result.success) {
                // Ensure we have an array
                const couponsData = Array.isArray(result.data) ? result.data : [];
                setCoupons(couponsData);
                
                // Also filter active coupons from all coupons if active endpoint fails
                const activeCouponsData = couponsData.filter(coupon => coupon.is_active);
                if (activeCoupons.length === 0) {
                    setActiveCoupons(activeCouponsData);
                }
                
                return { success: true, data: couponsData };
            } else {
                setError(result.message || 'Failed to fetch coupons');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch coupons';
            setError(errorMsg);
            console.error('Fetch coupons error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchActiveCoupons = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.fetchActiveCoupons();
            console.log('fetchActiveCoupons API result:', result); // Debug log
            
            if (result.success) {
                // Ensure we have an array
                const activeCouponsData = Array.isArray(result.data) ? result.data : [];
                setActiveCoupons(activeCouponsData);
                return { success: true, data: activeCouponsData };
            } else {
                // If active endpoint fails, filter from all coupons
                console.log('Active coupons API failed, filtering from all coupons');
                const activeFromAll = coupons.filter(coupon => coupon.is_active);
                setActiveCoupons(activeFromAll);
                return { success: true, data: activeFromAll };
            }
        } catch (err) {
            console.log('Active coupons error, filtering from all coupons:', err);
            // Fallback: filter active coupons from all coupons
            const activeFromAll = coupons.filter(coupon => coupon.is_active);
            setActiveCoupons(activeFromAll);
            return { success: true, data: activeFromAll };
        } finally {
            setLoading(false);
        }
    }, [coupons]);

    const fetchCouponById = useCallback(async (couponId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.fetchCouponById(couponId);
            if (result.success) {
                setCurrentCoupon(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch coupon';
            setError(errorMsg);
            console.error('Fetch coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const createCoupon = useCallback(async (couponData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.createCoupon(couponData);
            if (result.success) {
                // Add to both coupons and active coupons if active
                setCoupons(prev => [...prev, result.data]);
                if (result.data.is_active) {
                    setActiveCoupons(prev => [...prev, result.data]);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to create coupon';
            setError(errorMsg);
            console.error('Create coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const updateCoupon = useCallback(async (couponId, updateData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.updateCoupon(couponId, updateData);
            if (result.success) {
                // Update in coupons array
                setCoupons(prev => prev.map(coupon => 
                    coupon.coupon_id === couponId ? { ...coupon, ...result.data } : coupon
                ));
                
                // Update in active coupons array
                setActiveCoupons(prev => {
                    if (result.data.is_active) {
                        // If coupon is now active, add or update in active coupons
                        const exists = prev.find(c => c.coupon_id === couponId);
                        if (exists) {
                            return prev.map(c => c.coupon_id === couponId ? { ...c, ...result.data } : c);
                        } else {
                            return [...prev, result.data];
                        }
                    } else {
                        // If coupon is now inactive, remove from active coupons
                        return prev.filter(c => c.coupon_id !== couponId);
                    }
                });
                
                if (currentCoupon?.coupon_id === couponId) {
                    setCurrentCoupon(prev => ({ ...prev, ...result.data }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update coupon';
            setError(errorMsg);
            console.error('Update coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentCoupon]);

    const updateCouponStatus = useCallback(async (couponId, isActive) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.updateCouponStatus(couponId, isActive);
            if (result.success) {
                // Update in coupons array
                setCoupons(prev => prev.map(coupon => 
                    coupon.coupon_id === couponId ? { ...coupon, is_active: isActive } : coupon
                ));
                
                // Update in active coupons array
                setActiveCoupons(prev => {
                    if (isActive) {
                        // Add to active coupons if not already there
                        const exists = prev.find(c => c.coupon_id === couponId);
                        if (!exists) {
                            const coupon = coupons.find(c => c.coupon_id === couponId);
                            return coupon ? [...prev, { ...coupon, is_active: true }] : prev;
                        }
                        return prev.map(c => c.coupon_id === couponId ? { ...c, is_active: true } : c);
                    } else {
                        // Remove from active coupons
                        return prev.filter(c => c.coupon_id !== couponId);
                    }
                });
                
                if (currentCoupon?.coupon_id === couponId) {
                    setCurrentCoupon(prev => ({ ...prev, is_active: isActive }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update coupon status';
            setError(errorMsg);
            console.error('Update coupon status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [coupons, currentCoupon]);

    const deleteCoupon = useCallback(async (couponId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.deleteCoupon(couponId);
            if (result.success) {
                setCoupons(prev => prev.filter(c => c.coupon_id !== couponId));
                setActiveCoupons(prev => prev.filter(c => c.coupon_id !== couponId));
                if (currentCoupon?.coupon_id === couponId) {
                    setCurrentCoupon(null);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to delete coupon';
            setError(errorMsg);
            console.error('Delete coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentCoupon]);

    const validateCoupon = useCallback(async (couponCode, variantIds, orderTotal) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.validateCoupon(couponCode, variantIds, orderTotal);
            return result;
        } catch (err) {
            const errorMsg = 'Failed to validate coupon';
            setError(errorMsg);
            console.error('Validate coupon error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // ==================== OFFER FUNCTIONS ====================
    const fetchAllOffers = useCallback(async (skip = 0, limit = 100) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.fetchAllOffers(skip, limit);
            console.log('fetchAllOffers API result:', result); // Debug log
            
            if (result.success) {
                // Ensure we have an array
                const offersData = Array.isArray(result.data) ? result.data : [];
                setOffers(offersData);
                
                // Also filter active offers from all offers if active endpoint fails
                const activeOffersData = offersData.filter(offer => offer.is_active);
                if (activeOffers.length === 0) {
                    setActiveOffers(activeOffersData);
                }
                
                return { success: true, data: offersData };
            } else {
                setError(result.message || 'Failed to fetch offers');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch offers';
            setError(errorMsg);
            console.error('Fetch offers error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchActiveOffers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.fetchActiveOffers();
            console.log('fetchActiveOffers API result:', result); // Debug log
            
            if (result.success) {
                // Ensure we have an array
                const activeOffersData = Array.isArray(result.data) ? result.data : [];
                setActiveOffers(activeOffersData);
                return { success: true, data: activeOffersData };
            } else {
                // If active endpoint fails, filter from all offers
                console.log('Active offers API failed, filtering from all offers');
                const activeFromAll = offers.filter(offer => offer.is_active);
                setActiveOffers(activeFromAll);
                return { success: true, data: activeFromAll };
            }
        } catch (err) {
            console.log('Active offers error, filtering from all offers:', err);
            // Fallback: filter active offers from all offers
            const activeFromAll = offers.filter(offer => offer.is_active);
            setActiveOffers(activeFromAll);
            return { success: true, data: activeFromAll };
        } finally {
            setLoading(false);
        }
    }, [offers]);

    const fetchOfferById = useCallback(async (offerId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.fetchOfferById(offerId);
            if (result.success) {
                setCurrentOffer(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch offer';
            setError(errorMsg);
            console.error('Fetch offer error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const createOffer = useCallback(async (offerData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.createOffer(offerData);
            if (result.success) {
                // Add to both offers and active offers if active
                setOffers(prev => [...prev, result.data]);
                if (result.data.is_active) {
                    setActiveOffers(prev => [...prev, result.data]);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to create offer';
            setError(errorMsg);
            console.error('Create offer error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const updateOffer = useCallback(async (offerId, updateData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.updateOffer(offerId, updateData);
            if (result.success) {
                // Update in offers array
                setOffers(prev => prev.map(offer => 
                    offer.offer_id === offerId ? { ...offer, ...result.data } : offer
                ));
                
                // Update in active offers array
                setActiveOffers(prev => {
                    if (result.data.is_active) {
                        // If offer is now active, add or update in active offers
                        const exists = prev.find(o => o.offer_id === offerId);
                        if (exists) {
                            return prev.map(o => o.offer_id === offerId ? { ...o, ...result.data } : o);
                        } else {
                            return [...prev, result.data];
                        }
                    } else {
                        // If offer is now inactive, remove from active offers
                        return prev.filter(o => o.offer_id !== offerId);
                    }
                });
                
                if (currentOffer?.offer_id === offerId) {
                    setCurrentOffer(prev => ({ ...prev, ...result.data }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update offer';
            setError(errorMsg);
            console.error('Update offer error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentOffer]);

    const updateOfferStatus = useCallback(async (offerId, isActive) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.updateOfferStatus(offerId, isActive);
            if (result.success) {
                // Update in offers array
                setOffers(prev => prev.map(offer => 
                    offer.offer_id === offerId ? { ...offer, is_active: isActive } : offer
                ));
                
                // Update in active offers array
                setActiveOffers(prev => {
                    if (isActive) {
                        // Add to active offers if not already there
                        const exists = prev.find(o => o.offer_id === offerId);
                        if (!exists) {
                            const offer = offers.find(o => o.offer_id === offerId);
                            return offer ? [...prev, { ...offer, is_active: true }] : prev;
                        }
                        return prev.map(o => o.offer_id === offerId ? { ...o, is_active: true } : o);
                    } else {
                        // Remove from active offers
                        return prev.filter(o => o.offer_id !== offerId);
                    }
                });
                
                if (currentOffer?.offer_id === offerId) {
                    setCurrentOffer(prev => ({ ...prev, is_active: isActive }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update offer status';
            setError(errorMsg);
            console.error('Update offer status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [offers, currentOffer]);

    const deleteOffer = useCallback(async (offerId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await marketingApi.deleteOffer(offerId);
            if (result.success) {
                setOffers(prev => prev.filter(o => o.offer_id !== offerId));
                setActiveOffers(prev => prev.filter(o => o.offer_id !== offerId));
                if (currentOffer?.offer_id === offerId) {
                    setCurrentOffer(null);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to delete offer';
            setError(errorMsg);
            console.error('Delete offer error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentOffer]);

    // ==================== UTILITY FUNCTIONS ====================
    const clearError = useCallback(() => setError(null), []);
    const clearCurrentCoupon = useCallback(() => setCurrentCoupon(null), []);
    const clearCurrentOffer = useCallback(() => setCurrentOffer(null), []);

    const value = {
        // Coupons
        coupons,
        activeCoupons,
        currentCoupon,
        // Offers
        offers,
        activeOffers,
        currentOffer,
        // Common
        loading,
        error,
        // Coupon Functions
        fetchAllCoupons,
        fetchActiveCoupons,
        fetchCouponById,
        createCoupon,
        updateCoupon,
        updateCouponStatus,
        deleteCoupon,
        validateCoupon,
        // Offer Functions
        fetchAllOffers,
        fetchActiveOffers,
        fetchOfferById,
        createOffer,
        updateOffer,
        updateOfferStatus,
        deleteOffer,
        // Utility Functions
        clearError,
        clearCurrentCoupon,
        clearCurrentOffer
    };

    return (
        <MarketingContext.Provider value={value}>
            {children}
        </MarketingContext.Provider>
    );
};