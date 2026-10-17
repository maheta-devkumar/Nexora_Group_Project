import api from './api';

const CUSTOMERS_BASE_URL = `/customers`;

/* -----------------------------
   ✅ CUSTOMER API FUNCTIONS (Updated to match backend)
------------------------------ */

// Get all customers
export const fetchAllCustomers = async () => {
    try {
        const response = await api.get(`${CUSTOMERS_BASE_URL}/`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Customers Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch customers",
            data: []
        };
    }
};

// Get customer by ID
export const fetchCustomerById = async (customerId) => {
    try {
        const response = await api.get(`${CUSTOMERS_BASE_URL}/${customerId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Customer Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch customer"
        };
    }
};

// Update customer - FIXED: URL path corrected
export const updateCustomer = async (customerId, updateData) => {
    try {
        const response = await api.put(`${CUSTOMERS_BASE_URL}/${customerId}`, updateData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Customer Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update customer"
        };
    }
};

// Delete customer
export const deleteCustomer = async (customerId) => {
    try {
        const response = await api.delete(`${CUSTOMERS_BASE_URL}/${customerId}`);
        return { 
            success: true, 
            data: response.data,
            message: response.data?.message || "Customer deleted successfully"
        };
    } catch (error) {
        console.error("Delete Customer Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete customer"
        };
    }
};

// Get customer orders
export const fetchCustomerOrders = async (customerId) => {
    try {
        const response = await api.get(`${CUSTOMERS_BASE_URL}/${customerId}/orders`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Customer Orders Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch customer orders",
            data: []
        };
    }
};

// Get customer statistics
export const fetchCustomerStats = async (customerId) => {
    try {
        const response = await api.get(`${CUSTOMERS_BASE_URL}/${customerId}/stats`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Customer Stats Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch customer statistics"
        };
    }
};