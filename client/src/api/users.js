import api from './api';

const USERS_BASE_URL = `/users`;

/* -----------------------------
   ✅ USER API FUNCTIONS
------------------------------ */

// Get all users
export const fetchAllUsers = async () => {
    try {
        const response = await api.get(`${USERS_BASE_URL}/`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Users Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch users",
            data: []
        };
    }
};

// Get user by ID
export const fetchUserById = async (userId) => {
    try {
        const response = await api.get(`${USERS_BASE_URL}/${userId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch User Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch user"
        };
    }
};

// Update user
export const updateUser = async (userId, updateData) => {
    try {
        const response = await api.put(`${USERS_BASE_URL}/${userId}`, updateData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update User Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update user"
        };
    }
};

// Delete user
export const deleteUser = async (userId) => {
    try {
        const response = await api.delete(`${USERS_BASE_URL}/${userId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Delete User Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete user"
        };
    }
};