import React, { createContext, useContext, useState, useCallback } from 'react';
import * as brandApi from '../api/brand';

const BrandContext = createContext();

export const useBrandContext = () => {
    const context = useContext(BrandContext);
    if (!context) {
        throw new Error('useBrandContext must be used within BrandProvider');
    }
    return context;
};

export const BrandProvider = ({ children }) => {
    const [brands, setBrands] = useState([]);
    const [currentBrand, setCurrentBrand] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all brands
    const fetchBrands = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await brandApi.fetchAllBrands();
            if (result.success) {
                setBrands(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch brands';
            setError(errorMsg);
            console.error('Fetch brands error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch brand by ID
    const fetchBrandById = useCallback(async (brandId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await brandApi.fetchBrandById(brandId);
            if (result.success) {
                setCurrentBrand(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch brand';
            setError(errorMsg);
            console.error('Fetch brand error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create brand
    const createBrand = useCallback(async (brandData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await brandApi.createBrand(brandData);
            if (result.success) {
                // Add to brands list
                setBrands(prev => [...prev, result.data]);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to create brand';
            setError(errorMsg);
            console.error('Create brand error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update brand
    const updateBrand = useCallback(async (brandId, updateData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await brandApi.updateBrand(brandId, updateData);
            if (result.success) {
                // Update brands list
                setBrands(prev => prev.map(brand => 
                    brand.brand_id === brandId ? { ...brand, ...result.data } : brand
                ));
                // Update current brand if it's the one being updated
                if (currentBrand?.brand_id === brandId) {
                    setCurrentBrand(prev => ({ ...prev, ...result.data }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update brand';
            setError(errorMsg);
            console.error('Update brand error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentBrand]);

    // Delete brand
    const deleteBrand = useCallback(async (brandId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await brandApi.deleteBrand(brandId);
            if (result.success) {
                // Remove from brands list
                setBrands(prev => prev.filter(b => b.brand_id !== brandId));
                // Clear current brand if it's the one being deleted
                if (currentBrand?.brand_id === brandId) {
                    setCurrentBrand(null);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to delete brand';
            setError(errorMsg);
            console.error('Delete brand error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentBrand]);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear current brand
    const clearCurrentBrand = useCallback(() => setCurrentBrand(null), []);

    const value = {
        brands,
        currentBrand,
        loading,
        error,
        fetchBrands,
        fetchBrandById,
        createBrand,
        updateBrand,
        deleteBrand,
        clearError,
        clearCurrentBrand
    };

    return (
        <BrandContext.Provider value={value}>
            {children}
        </BrandContext.Provider>
    );
};