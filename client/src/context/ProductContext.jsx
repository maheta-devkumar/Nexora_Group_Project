import React, { createContext, useContext, useState, useCallback } from 'react';
import * as productApi from '../api/product_admin';

const ProductContext = createContext();

export const useProductContext = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProductContext must be used within ProductProvider');
    }
    return context;
};

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 12,
        total: 0,
        total_pages: 1
    });
    const [lastFetchFilters, setLastFetchFilters] = useState({});

    // Helper function to check if product name exists (case-insensitive)
    const checkProductNameExists = (productName, excludeProductId = null) => {
        const nameToCheck = productName.trim().toLowerCase();
        return products.some(product => {
            // Skip the product we're updating (if excludeProductId is provided)
            if (excludeProductId && product.product_id === excludeProductId) {
                return false;
            }
            return product.product_name.toLowerCase() === nameToCheck;
        });
    };

    // Fetch all products - IMPROVED with cache and refresh
    const fetchProducts = useCallback(async (filters = {}) => {
        console.log("🔍 CONTEXT: Fetching products with filters:", filters);
        setLoading(true);
        setError(null);
        try {
            const result = await productApi.fetchProducts(filters);
            if (result.success) {
                console.log("🔍 CONTEXT: Products fetched successfully:", {
                    count: result.data.items?.length,
                    total: result.data.total,
                    page: result.data.page,
                    total_pages: result.data.total_pages
                });
                
                setProducts(result.data.items || []);
                setPagination({
                    page: result.data.page || 1,
                    per_page: result.data.per_page || 12,
                    total: result.data.total || 0,
                    total_pages: result.data.total_pages || 1
                });
                setLastFetchFilters(filters); // Store last used filters
                
                return result.data;
            } else {
                console.error("🔍 CONTEXT: Fetch products failed:", result.message);
                setError(result.message);
                return { items: [], total: 0, page: 1, per_page: 12, total_pages: 1 };
            }
        } catch (err) {
            console.error("🔍 CONTEXT: Fetch products error:", err);
            setError('Failed to fetch products. Please check console for details.');
            return { items: [], total: 0, page: 1, per_page: 12, total_pages: 1 };
        } finally {
            setLoading(false);
        }
    }, []);

    // Refresh products with last used filters
    const refreshProducts = useCallback(async () => {
        console.log("🔍 CONTEXT: Refreshing products with last filters:", lastFetchFilters);
        return await fetchProducts(lastFetchFilters);
    }, [fetchProducts, lastFetchFilters]);

    // Fetch product by ID with variants
    const fetchProductById = useCallback(async (productId) => {
        console.log(`🔍 CONTEXT: Fetching product by ID: ${productId}`);
        setLoading(true);
        setError(null);
        try {
            const result = await productApi.fetchProductWithVariants(productId);
            if (result.success) {
                console.log("🔍 CONTEXT: Product fetched successfully:", result.data);
                setCurrentProduct(result.data);
                return result.data;
            } else {
                console.error("🔍 CONTEXT: Fetch product failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CONTEXT: Fetch product error:", err);
            setError('Failed to fetch product. Please check console for details.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        console.log("🔍 CONTEXT: Fetching categories");
        setLoading(true);
        try {
            const result = await productApi.fetchCategories();
            if (result.success) {
                console.log("🔍 CONTEXT: Categories fetched:", result.data.length);
                setCategories(result.data || []);
                return result.data;
            }
            console.warn("🔍 CONTEXT: No categories found");
            return [];
        } catch (err) {
            console.error("🔍 CONTEXT: Fetch categories error:", err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch brands
    const fetchBrands = useCallback(async () => {
        console.log("🔍 CONTEXT: Fetching brands");
        setLoading(true);
        try {
            const result = await productApi.fetchBrands();
            if (result.success) {
                console.log("🔍 CONTEXT: Brands fetched:", result.data.length);
                setBrands(result.data || []);
                return result.data;
            }
            console.warn("🔍 CONTEXT: No brands found");
            return [];
        } catch (err) {
            console.error("🔍 CONTEXT: Fetch brands error:", err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Create product - IMPROVED to check for duplicate names
    const createProduct = async (productData) => {
        console.log("🔍 CONTEXT: Creating product:", productData);
        setLoading(true);
        setError(null);
        
        try {
            // Check if product with same name already exists (case-insensitive)
            if (checkProductNameExists(productData.product_name)) {
                setError(`Product "${productData.product_name}" already exists. Please use a different name.`);
                console.warn("🔍 CONTEXT: Product creation failed - duplicate name:", productData.product_name);
                return null;
            }

            // Fix property names to match backend schema
            const formattedData = {
                product_name: productData.product_name,
                description: productData.description || null,
                brand_id: productData.brand_id || null,
                sub_category_id: productData.sub_category_id
            };
            
            const result = await productApi.createProduct(formattedData);
            if (result.success) {
                console.log("🔍 CONTEXT: Product created successfully:", result.data);
                
                // Refresh the entire list to include the new product
                await refreshProducts();
                
                return result.data;
            } else {
                // Handle backend validation errors
                console.error("🔍 CONTEXT: Create product failed:", result.message);
                setError(result.message || 'Failed to create product.');
                return null;
            }
        } catch (err) {
            console.error("🔍 CONTEXT: Create product error:", err);
            setError('Failed to create product. Please check console for details.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Update product - IMPROVED to check for duplicate names (excluding current product)
    const updateProduct = async (productId, updateData) => {
        console.log(`🔍 CONTEXT: Updating product ${productId}:`, updateData);
        setLoading(true);
        setError(null);
        
        try {
            // Check if another product with the same name already exists (excluding current product)
            if (checkProductNameExists(updateData.product_name, productId)) {
                setError(`Product "${updateData.product_name}" already exists. Please use a different name.`);
                console.warn("🔍 CONTEXT: Product update failed - duplicate name:", updateData.product_name);
                return null;
            }

            // Fix property names to match backend schema
            const formattedData = {
                product_name: updateData.product_name,
                description: updateData.description || null,
                brand_id: updateData.brand_id || null,
                sub_category_id: updateData.sub_category_id
            };
            
            const result = await productApi.updateProduct(productId, formattedData);
            if (result.success) {
                console.log("🔍 CONTEXT: Product updated successfully:", result.data);
                
                // Update current product if it's the one being updated
                if (currentProduct?.product_id === productId) {
                    setCurrentProduct(prev => ({ ...prev, ...formattedData }));
                }
                
                // Refresh the product list to get updated data
                await refreshProducts();
                
                return result.data;
            } else {
                console.error("🔍 CONTEXT: Update product failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CONTEXT: Update product error:", err);
            setError('Failed to update product. Please check console for details.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Delete product - IMPROVED to refresh list properly
    const deleteProduct = async (productId) => {
        console.log(`🔍 CONTEXT: Deleting product ${productId}`);
        setLoading(true);
        setError(null);
        try {
            const result = await productApi.deleteProduct(productId);
            if (result.success) {
                console.log("🔍 CONTEXT: Product deleted successfully");
                
                // Remove from current products list
                setProducts(prev => prev.filter(p => p.product_id !== productId));
                
                // Clear current product if it's the one being deleted
                if (currentProduct?.product_id === productId) {
                    setCurrentProduct(null);
                }
                
                // Also refresh to update totals
                await refreshProducts();
                
                return result.data;
            } else {
                console.error("🔍 CONTEXT: Delete product failed:", result.message);
                setError(result.message);
                return null;
            }
        } catch (err) {
            console.error("🔍 CONTEXT: Delete product error:", err);
            setError('Failed to delete product. Please check console for details.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Check if a product name is unique (public method that can be used by components)
    const checkProductNameUnique = useCallback((productName, excludeProductId = null) => {
        return !checkProductNameExists(productName, excludeProductId);
    }, [products]);

    // Clear error
    const clearError = () => {
        console.log("🔍 CONTEXT: Clearing error");
        setError(null);
    };

    // Clear current product
    const clearCurrentProduct = () => {
        console.log("🔍 CONTEXT: Clearing current product");
        setCurrentProduct(null);
    };

    // Reset to default filters
    const resetFilters = () => {
        console.log("🔍 CONTEXT: Resetting filters");
        setLastFetchFilters({});
    };

    const value = {
        products,
        currentProduct,
        categories,
        brands,
        pagination,
        lastFetchFilters,
        loading,
        error,
        fetchProducts,
        fetchProductById,
        fetchCategories,
        fetchBrands,
        createProduct,
        updateProduct,
        deleteProduct,
        refreshProducts,
        resetFilters,
        clearError,
        clearCurrentProduct,
        checkProductNameUnique // Added for external validation
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};