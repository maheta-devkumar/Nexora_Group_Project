// src/context/delivery_panel/DeliveryProfileContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as profileApi from '../../api/delivery_panel/delivery_profile';

const DeliveryProfileContext = createContext();

export const useDeliveryProfileContext = () => {
    const context = useContext(DeliveryProfileContext);
    if (!context) {
        throw new Error('useDeliveryProfileContext must be used within DeliveryProfileProvider');
    }
    return context;
};

export const DeliveryProfileProvider = ({ children }) => {
    // State
    const [comprehensiveProfile, setComprehensiveProfile] = useState(null);
    const [profileOverview, setProfileOverview] = useState(null);
    const [personalInfo, setPersonalInfo] = useState(null);
    const [accountSettings, setAccountSettings] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [profileStatistics, setProfileStatistics] = useState(null);
    const [quickStats, setQuickStats] = useState(null);
    const [profileSummary, setProfileSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);

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
        setComprehensiveProfile(null);
        setProfileOverview(null);
        setPersonalInfo(null);
        setAccountSettings(null);
        setVerificationStatus(null);
        setProfileStatistics(null);
        setQuickStats(null);
        setProfileSummary(null);
        setOperationLogs([]);
        setError(null);
        addLog('All profile data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Profile operation logs cleared', 'info');
    }, [addLog]);

    // ===== COMPREHENSIVE PROFILE =====
    const fetchComprehensiveProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching comprehensive profile...', 'test');
        
        try {
            const result = await profileApi.fetchComprehensiveProfile();
            if (result.success) {
                setComprehensiveProfile(result.data);
                addLog('✅ Comprehensive profile fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch comprehensive profile: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch comprehensive profile';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch comprehensive profile error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PROFILE OVERVIEW =====
    const fetchProfileOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching profile overview...', 'test');
        
        try {
            const result = await profileApi.fetchProfileOverview();
            if (result.success) {
                setProfileOverview(result.data);
                addLog('✅ Profile overview fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch profile overview: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch profile overview';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch profile overview error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PERSONAL INFORMATION =====
    const fetchPersonalInfo = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching personal information...', 'test');
        
        try {
            const result = await profileApi.fetchPersonalInfo();
            if (result.success) {
                setPersonalInfo(result.data);
                addLog('✅ Personal information fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch personal information: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch personal information';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch personal info error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const updatePersonalInfo = useCallback(async (updateData) => {
        setLoading(true);
        setError(null);
        addLog('Updating personal information...', 'info');
        
        try {
            const result = await profileApi.updatePersonalInfo(updateData);
            if (result.success) {
                // Refresh personal info
                await fetchPersonalInfo();
                // Refresh profile overview if needed
                await fetchProfileOverview();
                addLog('✅ Personal information updated successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update personal information: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update personal information';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update personal info error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPersonalInfo, fetchProfileOverview, addLog]);

    // ===== ADDRESS MANAGEMENT =====
    const updateAddress = useCallback(async (addressData) => {
        setLoading(true);
        setError(null);
        addLog('Updating address...', 'info');
        
        try {
            const result = await profileApi.updateAddress(addressData);
            if (result.success) {
                // Refresh personal info and overview
                await fetchPersonalInfo();
                await fetchProfileOverview();
                addLog('✅ Address updated successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update address: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update address';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update address error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPersonalInfo, fetchProfileOverview, addLog]);

    // ===== ACCOUNT SETTINGS =====
    const fetchAccountSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching account settings...', 'test');
        
        try {
            const result = await profileApi.fetchAccountSettings();
            if (result.success) {
                setAccountSettings(result.data);
                addLog('✅ Account settings fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch account settings: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch account settings';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch account settings error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== VERIFICATION STATUS =====
    const fetchVerificationStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching verification status...', 'test');
        
        try {
            const result = await profileApi.fetchVerificationStatus();
            if (result.success) {
                setVerificationStatus(result.data);
                addLog('✅ Verification status fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch verification status: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch verification status';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch verification status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PROFILE STATISTICS =====
    const fetchProfileStatistics = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching profile statistics...', 'test');
        
        try {
            const result = await profileApi.fetchProfileStatistics();
            if (result.success) {
                setProfileStatistics(result.data);
                addLog('✅ Profile statistics fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch profile statistics: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch profile statistics';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch profile statistics error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PASSWORD MANAGEMENT =====
    const changePassword = useCallback(async (passwordData) => {
        setLoading(true);
        setError(null);
        addLog('Changing password...', 'info');
        
        try {
            const result = await profileApi.changePassword(passwordData);
            if (result.success) {
                addLog('✅ Password changed successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to change password: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to change password';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Change password error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PROFILE IMAGE UPLOAD =====
    const uploadProfileImage = useCallback(async (file) => {
        setLoading(true);
        setError(null);
        addLog('Uploading profile image...', 'info');
        
        try {
            const result = await profileApi.uploadProfileImage(file);
            if (result.success) {
                // Refresh personal info and profile overview
                await fetchPersonalInfo();
                await fetchProfileOverview();
                addLog('✅ Profile image uploaded successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to upload profile image: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to upload profile image';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Upload profile image error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPersonalInfo, fetchProfileOverview, addLog]);

    // ===== QUICK STATS =====
    const fetchQuickStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching quick stats...', 'test');
        
        try {
            const result = await profileApi.fetchQuickStats();
            if (result.success) {
                setQuickStats(result.data);
                addLog('✅ Quick stats fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch quick stats: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch quick stats';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch quick stats error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PROFILE SUMMARY =====
    const fetchProfileSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching profile summary...', 'test');
        
        try {
            const result = await profileApi.fetchProfileSummary();
            if (result.success) {
                setProfileSummary(result.data);
                addLog('✅ Profile summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch profile summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch profile summary';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch profile summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== BATCH OPERATIONS =====
    const fetchAllProfileData = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching all profile data...', 'test');
        
        try {
            const results = await Promise.all([
                fetchComprehensiveProfile(),
                fetchProfileOverview(),
                fetchPersonalInfo(),
                fetchAccountSettings(),
                fetchVerificationStatus(),
                fetchProfileStatistics(),
                fetchQuickStats(),
                fetchProfileSummary()
            ]);
            
            const allSuccess = results.every(result => result.success);
            
            if (allSuccess) {
                addLog('✅ All profile data fetched successfully', 'success');
                return { success: true, message: 'All profile data fetched successfully' };
            } else {
                const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
                setError(`Some profile data failed to load: ${errorMessages}`);
                addLog(`⚠️ Some profile data failed to load: ${errorMessages}`, 'warning');
                return { success: false, message: errorMessages };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all profile data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all profile data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [
        fetchComprehensiveProfile,
        fetchProfileOverview,
        fetchPersonalInfo,
        fetchAccountSettings,
        fetchVerificationStatus,
        fetchProfileStatistics,
        fetchQuickStats,
        fetchProfileSummary,
        addLog
    ]);

    // ===== HEALTH CHECK =====
    const checkProfileHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Checking profile module health...', 'test');
        
        try {
            const result = await profileApi.checkProfileHealth();
            if (result.success) {
                addLog('✅ Profile module is healthy', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Profile module health check failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to check profile module health';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Profile health check error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const value = {
        // State
        comprehensiveProfile,
        profileOverview,
        personalInfo,
        accountSettings,
        verificationStatus,
        profileStatistics,
        quickStats,
        profileSummary,
        loading,
        error,
        operationLogs,
        
        // Profile Functions
        fetchComprehensiveProfile,
        fetchProfileOverview,
        fetchPersonalInfo,
        updatePersonalInfo,
        updateAddress,
        fetchAccountSettings,
        fetchVerificationStatus,
        fetchProfileStatistics,
        changePassword,
        uploadProfileImage,
        fetchQuickStats,
        fetchProfileSummary,
        
        // Batch Operations
        fetchAllProfileData,
        
        // Health Check
        checkProfileHealth,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog
    };

    return (
        <DeliveryProfileContext.Provider value={value}>
            {children}
        </DeliveryProfileContext.Provider>
    );
};