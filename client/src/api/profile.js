import api from './api';

const PROFILE_BASE_URL = `/profile`;

/* -----------------------------
   ✅ PROFILE API FUNCTIONS
------------------------------ */

// Get current user profile
export const fetchProfile = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/me`);
        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || "Profile fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Profile Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch profile",
            data: null
        };
    }
};

// Update current user profile
export const updateProfile = async (profileData) => {
    try {
        // Backend expects: first_name, last_name, phone, gender, dob, profile_img_url
        const backendData = {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            gender: profileData.gender,
            dob: profileData.dob,
            profile_img_url: profileData.profile_img_url
        };

        // Remove undefined/null values
        Object.keys(backendData).forEach(key => {
            if (backendData[key] === undefined || backendData[key] === null || backendData[key] === '') {
                delete backendData[key];
            }
        });

        const response = await api.put(`${PROFILE_BASE_URL}/me`, backendData);
        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || "Profile updated successfully"
        };
    } catch (error) {
        console.error("Update Profile Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to update profile",
            data: null
        };
    }
};

// Change password
export const changePassword = async (passwordData) => {
    try {
        const backendData = {
            current_password: passwordData.currentPassword,
            new_password: passwordData.newPassword,
            confirm_password: passwordData.confirmPassword
        };

        const response = await api.post(`${PROFILE_BASE_URL}/change-password`, backendData);
        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || "Password changed successfully"
        };
    } catch (error) {
        console.error("Change Password Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to change password",
            data: null
        };
    }
};

// Get user statistics
export const fetchProfileStats = async () => {
    try {
        const response = await api.get(`${PROFILE_BASE_URL}/stats`);
        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || "Profile statistics fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Profile Stats Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch profile statistics",
            data: null
        };
    }
};

// Upload profile image
export const uploadProfileImage = async (formData) => {
    try {
        const response = await api.post(`${PROFILE_BASE_URL}/upload-image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return {
            success: true,
            data: response.data.data || response.data,
            message: response.data.message || "Profile image uploaded successfully"
        };
    } catch (error) {
        console.error("Upload Image Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to upload image",
            data: null
        };
    }
};