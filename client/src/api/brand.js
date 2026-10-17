import api from './api';

const BRANDS_BASE_URL = `/brands`;

/* -----------------------------
   ✅ BRAND API FUNCTIONS
------------------------------ */

// Get all brands
export const fetchAllBrands = async () => {
    try {
        const response = await api.get(`${BRANDS_BASE_URL}/`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Brands Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch brands",
            data: []
        };
    }
};

// Get brand by ID
export const fetchBrandById = async (brandId) => {
    try {
        const response = await api.get(`${BRANDS_BASE_URL}/${brandId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Brand Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch brand"
        };
    }
};

// Create new brand
export const createBrand = async (brandData) => {
    try {
        const response = await api.post(`${BRANDS_BASE_URL}/`, brandData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Create Brand Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to create brand"
        };
    }
};

// Update brand
export const updateBrand = async (brandId, updateData) => {
    try {
        const response = await api.put(`${BRANDS_BASE_URL}/${brandId}`, updateData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Brand Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update brand"
        };
    }
};

// Delete brand
export const deleteBrand = async (brandId) => {
    try {
        const response = await api.delete(`${BRANDS_BASE_URL}/${brandId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Delete Brand Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete brand"
        };
    }
};