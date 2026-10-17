// api/attribute.js
import api from './api';

const ATTRIBUTES_BASE_URL = "/attributes";

/* -----------------------------
   ✅ ADMIN ATTRIBUTE FUNCTIONS
------------------------------ */

// Get all attributes
export const fetchAllAttributes = async () => {
    try {
        const response = await api.get(`${ATTRIBUTES_BASE_URL}/`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Attributes Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch attributes",
            data: []
        };
    }
};

// Get attributes for a variant
export const fetchVariantAttributes = async (variantId) => {
    try {
        const response = await api.get(`${ATTRIBUTES_BASE_URL}/variant/${variantId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Variant Attributes Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch variant attributes",
            data: []
        };
    }
};

// Create new attribute
export const createAttribute = async (attributeData) => {
    try {
        const response = await api.post(`${ATTRIBUTES_BASE_URL}/`, attributeData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Create Attribute Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to create attribute",
            data: null
        };
    }
};
// Update the api/attribute.js file to include the new endpoints

// Update attribute
export const updateAttribute = async (attributeId, attributeData) => {
    try {
        const response = await api.put(`${ATTRIBUTES_BASE_URL}/${attributeId}`, attributeData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Attribute Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update attribute",
            data: null
        };
    }
};

// Delete attribute
export const deleteAttribute = async (attributeId) => {
    try {
        const response = await api.delete(`${ATTRIBUTES_BASE_URL}/${attributeId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Delete Attribute Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete attribute",
            data: null
        };
    }
};
// Assign attribute to variant
export const assignAttributeToVariant = async (variantId, attributeId, value) => {
    try {
        const response = await api.post(`${ATTRIBUTES_BASE_URL}/assign`, null, {
            params: { variant_id: variantId, attribute_id: attributeId, value }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Assign Attribute Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to assign attribute",
            data: null
        };
    }
};

// Update attribute value for variant
export const updateVariantAttributeValue = async (variantId, attributeId, value) => {
    try {
        const response = await api.put(`${ATTRIBUTES_BASE_URL}/${variantId}/update/${attributeId}`, null, {
            params: { value }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Attribute Value Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to update attribute value",
            data: null
        };
    }
};

// Remove attribute from variant
export const removeAttributeFromVariant = async (variantId, attributeId) => {
    try {
        const response = await api.delete(`${ATTRIBUTES_BASE_URL}/${variantId}/remove/${attributeId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Remove Attribute Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to remove attribute",
            data: null
        };
    }
};

// Get attribute by ID
export const fetchAttributeById = async (attributeId) => {
    try {
        const response = await api.get(`${ATTRIBUTES_BASE_URL}/${attributeId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Attribute by ID Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch attribute",
            data: null
        };
    }
};
