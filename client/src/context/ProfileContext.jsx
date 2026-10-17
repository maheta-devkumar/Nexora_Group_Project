import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as profileApi from '../api/profile';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

export const useProfileContext = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfileContext must be used within ProfileProvider');
    }
    return context;
};

export const ProfileProvider = ({ children }) => {
    // Auth context
    const { isAuthenticated, logout, user, refreshUser } = useAuth();

    // State
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);

    // Check user roles
    const isAdminUser = !!(user && Array.isArray(user.roles) && user.roles.includes('admin'));
    const isDeliveryUser = !!(user && Array.isArray(user.roles) && user.roles.includes('delivery'));

    // Utility function to add logs
    const addLog = useCallback((message, type = 'info') => {
        const log = {
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        setOperationLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, []);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setProfile(null);
        setStats(null);
        setOperationLogs([]);
        setError(null);
        addLog('All profile data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Profile operation logs cleared', 'info');
    }, [addLog]);

    // ===== FETCH PROFILE =====
    const fetchProfile = useCallback(async () => {
        if (!isAuthenticated) {
            addLog('⚠️ User not authenticated, skipping profile fetch', 'warning');
            return { success: false, message: 'User not authenticated' };
        }

        setLoading(true);
        setError(null);
        addLog('Fetching profile...', 'info');

        try {
            const result = await profileApi.fetchProfile();
            if (result.success) {
                const profileData = result.data?.data ?? result.data;
                setProfile(profileData);
                addLog('✅ Profile fetched successfully', 'success');
                return { success: true, data: profileData };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch profile: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch profile';

            // Handle 401 error - logout
            if (status === 401) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                logout();
                return { success: false, message: errorMsg };
            }

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Profile endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                logout();
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch profile error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, logout, addLog]);

    // ===== FETCH STATS =====
    const fetchStats = useCallback(async () => {
        if (!isAuthenticated) {
            addLog('⚠️ User not authenticated, skipping stats fetch', 'warning');
            return { success: false, message: 'User not authenticated' };
        }

        setLoading(true);
        setError(null);
        addLog('Fetching profile statistics...', 'info');

        try {
            const result = await profileApi.fetchProfileStats();
            if (result.success) {
                const statsData = result.data?.data ?? result.data;
                setStats(statsData);
                addLog('✅ Profile statistics fetched successfully', 'success');
                return { success: true, data: statsData };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch stats: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch profile statistics';

            // Handle 401 error - logout
            if (status === 401) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                logout();
                return { success: false, message: errorMsg };
            }

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Profile stats endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                logout();
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch stats error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, logout, addLog]);

    // ===== UPDATE PROFILE =====
    const updateProfile = useCallback(async (profileData) => {
        if (!isAuthenticated) {
            addLog('⚠️ User not authenticated, cannot update profile', 'warning');
            return { success: false, message: 'User not authenticated' };
        }

        setLoading(true);
        setError(null);
        addLog('Updating profile...', 'info');

        try {
            const result = await profileApi.updateProfile(profileData);
            if (result.success) {
                const updatedProfile = result.data?.data ?? result.data;
                setProfile(updatedProfile);

                // Sync with AuthContext to update header/other components
                refreshUser({ ...user, ...updatedProfile });

                addLog('✅ Profile updated successfully', 'success');
                return {
                    success: true,
                    data: updatedProfile,
                    message: result.message
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update profile: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to update profile';

            // Handle 401 error - logout
            if (status === 401) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                logout();
                return { success: false, message: errorMsg };
            }

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Update profile endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                logout();
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update profile error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, logout, addLog]);

    // ===== CHANGE PASSWORD =====
    const changePassword = useCallback(async (passwordData) => {
        if (!isAuthenticated) {
            addLog('⚠️ User not authenticated, cannot change password', 'warning');
            return { success: false, message: 'User not authenticated' };
        }

        setLoading(true);
        setError(null);
        addLog('Changing password...', 'info');

        try {
            const result = await profileApi.changePassword(passwordData);
            if (result.success) {
                addLog('✅ Password changed successfully', 'success');
                return {
                    success: true,
                    data: result.data,
                    message: result.message
                };
            } else {
                setError(result.message);
                addLog(`❌ Failed to change password: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to change password';

            // Handle 401 error - logout
            if (status === 401) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                logout();
                return { success: false, message: errorMsg };
            }

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Change password endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                logout();
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Change password error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, logout, addLog]);

    // ===== UPLOAD PROFILE IMAGE =====
    const uploadProfileImage = useCallback(async (file) => {
        if (!isAuthenticated) return { success: false, message: 'User not authenticated' };

        setLoading(true);
        addLog('Uploading profile image...', 'info');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await profileApi.uploadProfileImage(formData);

            if (result.success) {
                const updatedProfile = result.data?.data ?? result.data;
                setProfile(updatedProfile);

                // Sync with AuthContext
                refreshUser({ ...user, ...updatedProfile });

                addLog('✅ Profile image uploaded successfully', 'success');
                return { success: true, data: updatedProfile };
            } else {
                addLog(`❌ Failed to upload image: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            addLog(`❌ Upload failed: ${err.message}`, 'error');
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, addLog]);

    // ===== AUTO-FETCH PROFILE AND STATS =====
    useEffect(() => {
        if (isAuthenticated) {
            fetchProfile();
            fetchStats();
        } else {
            // Clear profile data when user logs out
            setProfile(null);
            setStats(null);
            setOperationLogs([]);
            setError(null);
            addLog('User logged out, profile data cleared', 'info');
        }
    }, [isAuthenticated, fetchProfile, fetchStats, addLog]);

    const value = {
        // State
        profile,
        stats,
        loading,
        error,
        operationLogs,

        // Profile Functions
        fetchProfile,
        fetchStats,
        updateProfile,
        changePassword,
        uploadProfileImage,

        // Utility Functions
        clearError,
        clearOperationLogs,
        addLog,

        // User role info
        isAdminUser,
        isDeliveryUser
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};