import React, { createContext, useContext, useState, useCallback } from 'react';
import * as productApi from '../api/product';
import * as categoryApi from '../api/category';
import * as brandApi from '../api/brand';
import * as attributeApi from '../api/attribute';

const CatalogContext = createContext();

export const useCatalogContext = () => {
    const context = useContext(CatalogContext);
    if (!context) {
        throw new Error('useCatalogContext must be used within CatalogProvider');
    }
    return context;
};

const CatalogProvider = ({ children }) => {
    const [catalogStats, setCatalogStats] = useState({
        totalProducts: 0,
        totalCategories: 0,
        totalBrands: 0,
        recentProducts: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch catalog statistics
    const fetchCatalogStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch products summary
            const productsResult = await productApi.fetchProducts({ per_page: 1 });
            const categoriesResult = await categoryApi.fetchAllCategories();
            const brandsResult = await brandApi.fetchAllBrands();
            const recentProductsResult = await productApi.fetchNewArrivals({ per_page: 5 });

            const stats = {
                totalProducts: productsResult.success ? productsResult.data.total : 0,
                totalCategories: categoriesResult.success ? categoriesResult.data.length : 0,
                totalBrands: brandsResult.success ? brandsResult.data.length : 0,
                recentProducts: recentProductsResult.success ? recentProductsResult.data.items : []
            };

            setCatalogStats(stats);
            return stats;
        } catch (err) {
            setError('Failed to fetch catalog statistics');
            console.error('Fetch catalog stats error:', err);
            return catalogStats;
        } finally {
            setLoading(false);
        }
    }, []);

    // Search across catalog
    const searchCatalog = useCallback(async (query, type = 'all') => {
        setLoading(true);
        setError(null);
        try {
            let results = [];
            
            if (type === 'all' || type === 'products') {
                const productsResult = await productApi.fetchProducts({ 
                    search: query, 
                    per_page: 10 
                });
                if (productsResult.success) {
                    results = [
                        ...results,
                        ...productsResult.data.items.map(p => ({
                            type: 'product',
                            id: p.product_id,
                            name: p.product_name,
                            description: p.description,
                            category: p.category?.category_name,
                            image: p.default_variant?.images?.[0]?.url
                        }))
                    ];
                }
            }

            if (type === 'all' || type === 'categories') {
                const categoriesResult = await categoryApi.fetchAllCategories();
                if (categoriesResult.success) {
                    const filteredCategories = categoriesResult.data.filter(cat =>
                        cat.category_name.toLowerCase().includes(query.toLowerCase())
                    );
                    results = [
                        ...results,
                        ...filteredCategories.map(cat => ({
                            type: 'category',
                            id: cat.category_id,
                            name: cat.category_name,
                            description: cat.description
                        }))
                    ];
                }
            }

            if (type === 'all' || type === 'brands') {
                const brandsResult = await brandApi.fetchAllBrands();
                if (brandsResult.success) {
                    const filteredBrands = brandsResult.data.filter(brand =>
                        brand.brand_name.toLowerCase().includes(query.toLowerCase())
                    );
                    results = [
                        ...results,
                        ...filteredBrands.map(brand => ({
                            type: 'brand',
                            id: brand.brand_id,
                            name: brand.brand_name,
                            description: brand.description
                        }))
                    ];
                }
            }

            return results;
        } catch (err) {
            setError('Failed to search catalog');
            console.error('Search catalog error:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Get catalog summary
    const getCatalogSummary = useCallback(async () => {
        try {
            const [categoriesResult, brandsResult, attributesResult] = await Promise.all([
                categoryApi.fetchAllCategories(),
                brandApi.fetchAllBrands(),
                attributeApi.fetchAllAttributes()
            ]);

            return {
                categories: categoriesResult.success ? categoriesResult.data : [],
                brands: brandsResult.success ? brandsResult.data : [],
                attributes: attributesResult.success ? attributesResult.data : []
            };
        } catch (err) {
            console.error('Get catalog summary error:', err);
            return { categories: [], brands: [], attributes: [] };
        }
    }, []);

    const fetchCategoryById = useCallback(async (categoryId) => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔍 CATEGORY CONTEXT: Fetching category by ID:', categoryId);
            const result = await categoryApi.fetchCategoryById(categoryId);
            console.log('🔍 CATEGORY CONTEXT: Fetch result:', result);
            
            if (result.success) {
                return result.data;
            } else {
                // If category not found, don't throw error, just return null
                console.warn('🔍 CATEGORY CONTEXT: Category not found:', categoryId);
                return null;
            }
        } catch (err) {
            console.error('🔍 CATEGORY CONTEXT: Fetch category error:', err);
            // Don't set error state for not-found, just return null
            return null;
        } finally {
            setLoading(false);
        }
    }, []);
    // Clear error
    const clearError = () => setError(null);

    // Bulk operations
    const bulkUpdateProducts = async (productIds, updateData) => {
        setLoading(true);
        setError(null);
        try {
            // Implement bulk update logic here
            console.log('Bulk update products:', productIds, updateData);
            const results = [];
            for (const productId of productIds) {
                const result = await productApi.updateProduct(productId, updateData);
                results.push({ productId, success: result.success });
            }
            return results;
        } catch (err) {
            setError('Failed to bulk update products');
            console.error('Bulk update error:', err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const value = {
        catalogStats,
        loading,
        error,
        fetchCatalogStats,
        fetchCategoryById,
        searchCatalog,
        getCatalogSummary,
        clearError,
        bulkUpdateProducts
    };

    return (
        <CatalogContext.Provider value={value}>
            {children}
        </CatalogContext.Provider>
    );
};

// Export as named export
export { CatalogProvider };

// Export as default export
export default CatalogProvider;