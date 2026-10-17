// frontend/src/api/auth.js - Standardized
import api from './api';  // Use main api instance

// ✅ CONSISTENT: All functions use "token"
export const saveToken = (token) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify({})); // Will be updated by AuthContext
};

export const getToken = () => localStorage.getItem("token");

export const clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Login function
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    if (!response.data.success) {
      return { success: false, message: response.data.message };
    }

    const { access_token, user } = response.data;

    // ✅ CONSISTENT: Save as "token"
    saveToken(access_token);
    
    return { 
      success: true, 
      data: { 
        token: access_token,  // Rename to token for consistency
        user 
      } 
    };
    
  } catch (error) {
    let message = "Login failed. Please check your credentials.";
    if (error.response) {
      message = error.response.data?.detail || error.response.data?.message || message;
    }
    return { success: false, message };
  }
};

export default api;