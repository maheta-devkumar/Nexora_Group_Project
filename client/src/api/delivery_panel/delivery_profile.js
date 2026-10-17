// src/api/delivery_panel/profile.js
import api from '../api';

const PROFILE_BASE_URL = `/delivery_panel/profile`;

/* -----------------------------
   ✅ DELIVERY PROFILE API FUNCTIONS
------------------------------ */

// Helper to format error messages
const formatError = (error, defaultMsg) => {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) {
        return detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
    }
    if (typeof detail === 'object' && detail !== null) {
        return JSON.stringify(detail);
    }
    return detail || error.message || defaultMsg;
};

// Get comprehensive profile (all in one)
export const fetchComprehensiveProfile = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/`);
        return {
            success: true,
            data: response.data,
            message: "Profile fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Comprehensive Profile Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to fetch profile"),
            data: null
        };
    }
};

// Get profile overview
export const fetchProfileOverview = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/overview`);
        return {
            success: true,
            data: response.data,
            message: "Profile overview fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Profile Overview Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to fetch profile overview"),
            data: null
        };
    }
};

// Get personal information
export const fetchPersonalInfo = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/personal-info`);
        return {
            success: true,
            data: response.data,
            message: "Personal information fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Personal Info Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to fetch personal information"),
            data: null
        };
    }
};

// Update personal information
export const updatePersonalInfo = async (updateData) => {
    try {
        const response = await api.put(`${PROFILE_BASE_URL}/personal-info`, updateData);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Personal information updated successfully"
        };
    } catch (error) {
        console.error("Update Personal Info Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to update personal information"),
            data: null
        };
    }
};

// Update address
export const updateAddress = async (addressData) => {
    try {
        const response = await api.put(`${PROFILE_BASE_URL}/address`, addressData);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Address updated successfully"
        };
    } catch (error) {
        console.error("Update Address Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to update address"),
            data: null
        };
    }
};

// Get account settings
export const fetchAccountSettings = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/settings`);
        return {
            success: true,
            data: response.data,
            message: "Account settings fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Account Settings Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to fetch account settings"),
            data: null
        };
    }
};

// Get verification status
export const fetchVerificationStatus = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/verification`);
        return {
            success: true,
            data: response.data,
            message: "Verification status fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Verification Status Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to fetch verification status"),
            data: null
        };
    }
};

// Get profile statistics
export const fetchProfileStatistics = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/statistics`);
        return {
            success: true,
            data: response.data,
            message: "Profile statistics fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Profile Statistics Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to fetch profile statistics"),
            data: null
        };
    }
};

// Change password
export const changePassword = async (passwordData) => {
    try {
        const response = await api.put(`${PROFILE_BASE_URL}/change-password`, passwordData);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Password changed successfully"
        };
    } catch (error) {
        console.error("Change Password Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to change password"),
            data: null
        };
    }
};

// Upload profile image
export const uploadProfileImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`${PROFILE_BASE_URL}/upload-image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Profile image uploaded successfully"
        };
    } catch (error) {
        console.error("Upload Profile Image Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to upload profile image"),
            data: null
        };
    }
};

// Get quick stats
export const fetchQuickStats = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/quick-stats`);
        return {
            success: true,
            data: response.data,
            message: "Quick stats fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Quick Stats Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to fetch quick stats"),
            data: null
        };
    }
};

// Get profile summary
export const fetchProfileSummary = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/summary`);
        return {
            success: true,
            data: response.data,
            message: "Profile summary fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Profile Summary Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Failed to fetch profile summary"),
            data: null
        };
    }
};

// Health check
export const checkProfileHealth = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/health`);
        return {
            success: true,
            data: response.data,
            message: "Profile module is healthy"
        };
    } catch (error) {
        console.error("Profile Health Check Error:", error.response?.data || error.message);
        return {
            success: false,
            message: formatError(error, "Profile health check failed"),
            data: null
        };
    }
};