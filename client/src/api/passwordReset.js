// src/api/passwordReset.js
import api from './api';

/**
 * Password reset API client for your backend
 */
export const passwordResetAPI = {
  /**
   * Request OTP for password reset
   * @param {string} email - User's email address
   * @returns {Promise<{success: boolean, message: string}>}
   */
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      
      let message = "Failed to request password reset";
      let statusCode = error.response?.status;
      
      if (error.response?.data?.detail) {
        message = error.response.data.detail;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      // Handle specific backend error cases
      if (statusCode === 404) {
        message = "User not found with this email";
      } else if (statusCode === 400 && message.includes("Google")) {
        message = "This account uses Google login. Please sign in with Google instead.";
      }
      
      return { 
        success: false, 
        message,
        statusCode
      };
    }
  },

  /**
   * Reset password with OTP verification
   * @param {string} email - User's email
   * @param {string} otp - 6-digit OTP
   * @param {string} newPassword - New password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        new_password: newPassword
      });
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Password reset error:', error);
      
      let message = "Failed to reset password";
      let statusCode = error.response?.status;
      
      if (error.response?.data?.detail) {
        message = error.response.data.detail;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      // Handle specific backend error cases
      if (statusCode === 400) {
        if (message.includes("Invalid request")) {
          message = "Invalid reset request. Please request a new OTP.";
        } else if (message.includes("OTP expired")) {
          message = "OTP has expired. Please request a new one.";
        } else if (message.includes("Invalid OTP")) {
          message = "Invalid OTP. Please check and try again.";
        }
      }
      
      return { 
        success: false, 
        message,
        statusCode
      };
    }
  }
};

export default passwordResetAPI;