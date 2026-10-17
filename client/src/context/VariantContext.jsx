import React, { createContext, useState, useContext, useCallback } from "react";
import * as variantsApi from "../api/variants";

const VariantContext = createContext();

export const useVariant = () => {
  const context = useContext(VariantContext);
  if (!context) {
    throw new Error("useVariant must be used within a VariantProvider");
  }
  return context;
};

export const VariantProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });

  // ========== MEDIA METHODS ==========
  
  // Fetch variant images
  const fetchVariantImages = useCallback(async (variantId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.fetchVariantImages(variantId);
      
      if (result.success) {
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message, data: [] };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to fetch variant images";
      setError(msg);
      return { success: false, message: msg, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch variant videos
  const fetchVariantVideos = useCallback(async (variantId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.fetchVariantVideos(variantId);
      
      if (result.success) {
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message, data: [] };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to fetch variant videos";
      setError(msg);
      return { success: false, message: msg, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // ========== VARIANT METHODS ==========

  // Fetch variants with pagination
  const fetchVariants = useCallback(async (page = 1, perPage = 20, productId = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.fetchVariants(page, perPage, productId);
      
      if (result.success && result.data) {
        setVariants(result.data.items || []);
        setPagination({
          page: result.data.page || 1,
          perPage: result.data.per_page || 20,
          total: result.data.total || 0,
          totalPages: result.data.total_pages || 0,
        });
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to fetch variants";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch variant by ID
  const fetchVariantById = useCallback(async (variantId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.fetchVariantById(variantId);
      
      if (result.success) {
        setSelectedVariant(result.data);
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to fetch variant";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create variant
  const createVariant = useCallback(async (variantData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.createVariant(variantData);
      
      if (result.success) {
        setVariants(prev => [...prev, result.data]);
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to create variant";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update variant
  const updateVariant = useCallback(async (variantId, variantData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.updateVariant(variantId, variantData);
      
      if (result.success) {
        setVariants(prev => prev.map(v => 
          v.variant_id === variantId ? result.data : v
        ));
        if (selectedVariant?.variant_id === variantId) {
          setSelectedVariant(result.data);
        }
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to update variant";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [selectedVariant]);

  // Delete variant
  const deleteVariant = useCallback(async (variantId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.deleteVariant(variantId);
      
      if (result.success) {
        setVariants(prev => prev.filter(v => v.variant_id !== variantId));
        if (selectedVariant?.variant_id === variantId) {
          setSelectedVariant(null);
        }
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to delete variant";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [selectedVariant]);

  // Update stock
  const updateStock = useCallback(async (variantId, quantity) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.updateVariantStock(variantId, quantity);
      
      if (result.success) {
        setVariants(prev => prev.map(v => 
          v.variant_id === variantId ? result.data : v
        ));
        if (selectedVariant?.variant_id === variantId) {
          setSelectedVariant(result.data);
        }
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to update stock";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [selectedVariant]);

  // Update price
  const updatePrice = useCallback(async (variantId, price) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.updateVariantPrice(variantId, price);
      
      if (result.success) {
        setVariants(prev => prev.map(v => 
          v.variant_id === variantId ? result.data : v
        ));
        if (selectedVariant?.variant_id === variantId) {
          setSelectedVariant(result.data);
        }
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to update price";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [selectedVariant]);

  // Set discount
  const setDiscount = useCallback(async (variantId, discountType, discountValue) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.setVariantDiscount(variantId, discountType, discountValue);
      
      if (result.success) {
        setVariants(prev => prev.map(v => 
          v.variant_id === variantId ? result.data : v
        ));
        if (selectedVariant?.variant_id === variantId) {
          setSelectedVariant(result.data);
        }
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to set discount";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [selectedVariant]);

  // Update status
  const updateStatus = useCallback(async (variantId, status) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.updateVariantStatus(variantId, status);
      
      if (result.success) {
        setVariants(prev => prev.map(v => 
          v.variant_id === variantId ? result.data : v
        ));
        if (selectedVariant?.variant_id === variantId) {
          setSelectedVariant(result.data);
        }
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to update status";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [selectedVariant]);

  // Set default variant
  const setDefault = useCallback(async (productId, variantId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await variantsApi.setDefaultVariant(productId, variantId);
      
      if (result.success) {
        // Update the variant in the list
        setVariants(prev => prev.map(v => ({
          ...v,
          is_default: v.variant_id === variantId
        })));
        return result;
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to set default variant";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear selected variant
  const clearSelectedVariant = useCallback(() => {
    setSelectedVariant(null);
  }, []);

  const value = {
    loading,
    error,
    variants,
    selectedVariant,
    pagination,
    
    // Variant methods
    fetchVariants,
    fetchVariantById,
    createVariant,
    updateVariant,
    deleteVariant,
    updateStock,
    updatePrice,
    setDiscount,
    updateStatus,
    setDefault,
    
    // Media methods (NEW)
    fetchVariantImages,
    fetchVariantVideos,
    
    // Utility methods
    clearError,
    clearSelectedVariant,
  };

  return (
    <VariantContext.Provider value={value}>
      {children}
    </VariantContext.Provider>
  );
};