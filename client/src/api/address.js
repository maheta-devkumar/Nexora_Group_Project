import api from './api';

const ADDRESS_BASE_URL = `/address`;

/* -----------------------------
   ✅ ADDRESS API FUNCTIONS
------------------------------ */

// Get all states
export const fetchStates = async () => {
    try {
        const response = await api.get(`${ADDRESS_BASE_URL}/states`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "States fetched successfully"
        };
    } catch (error) {
        console.error("Fetch States Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Failed to fetch states",
            data: []
        };
    }
};

// Get cities by state
export const fetchCitiesByState = async (stateId) => {
    try {
        const response = await api.get(`${ADDRESS_BASE_URL}/cities/${stateId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Cities fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Cities Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Failed to fetch cities",
            data: []
        };
    }
};

// Get areas by city
export const fetchAreasByCity = async (cityId) => {
    try {
        const response = await api.get(`${ADDRESS_BASE_URL}/areas/${cityId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Areas fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Areas Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Failed to fetch areas",
            data: []
        };
    }
};

// Get user addresses
export const fetchUserAddresses = async () => {
    try {
        const response = await api.get(`${ADDRESS_BASE_URL}/`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Addresses fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Addresses Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Failed to fetch addresses",
            data: []
        };
    }
};

// Get address by ID
export const fetchAddressById = async (addressId) => {
    try {
        const response = await api.get(`${ADDRESS_BASE_URL}/${addressId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Address fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Address by ID Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Failed to fetch address",
            data: null
        };
    }
};

// Create address
export const createAddress = async (addressData) => {
    try {
        const response = await api.post(`${ADDRESS_BASE_URL}/`, addressData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Address created successfully"
        };
    } catch (error) {
        console.error("Create Address Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Failed to create address",
            data: null
        };
    }
};

// Update address
export const updateAddress = async (addressId, updateData) => {
    try {
        const response = await api.put(`${ADDRESS_BASE_URL}/${addressId}`, updateData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Address updated successfully"
        };
    } catch (error) {
        console.error("Update Address Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Failed to update address",
            data: null
        };
    }
};

// Delete address
export const deleteAddress = async (addressId) => {
    try {
        const response = await api.delete(`${ADDRESS_BASE_URL}/${addressId}`);
        return { 
            success: true, 
            message: response.data.message || "Address deleted successfully"
        };
    } catch (error) {
        console.error("Delete Address Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Failed to delete address"
        };
    }
};

// Set default address
export const setDefaultAddress = async (addressId) => {
    try {
        const response = await api.patch(`${ADDRESS_BASE_URL}/${addressId}/default`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Default address set successfully"
        };
    } catch (error) {
        console.error("Set Default Address Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Failed to set default address",
            data: null
        };
    }
};