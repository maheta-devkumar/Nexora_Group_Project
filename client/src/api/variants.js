import api from "./api";

const VARIANTS_BASE_URL = "/variants";

// Get all variants with pagination
export const fetchVariants = async (page = 1, perPage = 20, productId = null) => {
  try {
    const params = { page, per_page: perPage };
    if (productId) params.product_id = productId;
    
    const response = await api.get(VARIANTS_BASE_URL, { params });
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to fetch variants",
      data: null,
    };
  }
};

// Get variant by ID
export const fetchVariantById = async (variantId) => {
  try {
    const response = await api.get(`${VARIANTS_BASE_URL}/${variantId}`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to fetch variant",
      data: null,
    };
  }
};

// Create new variant
export const createVariant = async (variantData) => {
  try {
    const response = await api.post(VARIANTS_BASE_URL, variantData);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to create variant",
      data: null,
    };
  }
};

// Update variant
export const updateVariant = async (variantId, variantData) => {
  try {
    const response = await api.put(`${VARIANTS_BASE_URL}/${variantId}`, variantData);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to update variant",
      data: null,
    };
  }
};

// Delete variant
export const deleteVariant = async (variantId) => {
  try {
    const response = await api.delete(`${VARIANTS_BASE_URL}/${variantId}`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to delete variant",
      data: null,
    };
  }
};

// Update stock
export const updateVariantStock = async (variantId, quantity) => {
  try {
    const response = await api.patch(`${VARIANTS_BASE_URL}/${variantId}/stock`, null, {
      params: { quantity }
    });
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to update stock",
      data: null,
    };
  }
};

// Update price
export const updateVariantPrice = async (variantId, price) => {
  try {
    const response = await api.patch(`${VARIANTS_BASE_URL}/${variantId}/price`, null, {
      params: { price }
    });
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to update price",
      data: null,
    };
  }
};

// Set discount
export const setVariantDiscount = async (variantId, discountType, discountValue) => {
  try {
    const response = await api.patch(`${VARIANTS_BASE_URL}/${variantId}/discount`, null, {
      params: { discount_type: discountType, discount_value: discountValue }
    });
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to set discount",
      data: null,
    };
  }
};

// Update status
export const updateVariantStatus = async (variantId, status) => {
  try {
    const response = await api.patch(`${VARIANTS_BASE_URL}/${variantId}/status`, null, {
      params: { status }
    });
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to update status",
      data: null,
    };
  }
};

// Set default variant
export const setDefaultVariant = async (productId, variantId) => {
  try {
    const response = await api.patch(`${VARIANTS_BASE_URL}/product/${productId}/default/${variantId}`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to set default variant",
      data: null,
    };
  }
};
// Get variant images
export const fetchVariantImages = async (variantId) => {
  try {
    const response = await api.get(`${VARIANTS_BASE_URL}/images/${variantId}`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to fetch variant images",
      data: [],
    };
  }
};

// Get variant videos
export const fetchVariantVideos = async (variantId) => {
  try {
    const response = await api.get(`${VARIANTS_BASE_URL}/videos/${variantId}`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to fetch variant videos",
      data: [],
    };
  }
};