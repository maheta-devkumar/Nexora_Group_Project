import React, { createContext, useContext, useState, useCallback } from 'react';
import * as notificationAdminApi from '../api/notification_admin';

const NotificationAdminContext = createContext();

export const useNotificationAdminContext = () => {
    const context = useContext(NotificationAdminContext);
    if (!context) {
        throw new Error('useNotificationAdminContext must be used within NotificationAdminProvider');
    }
    return context;
};

export const NotificationAdminProvider = ({ children }) => {
    // State
    const [allNotifications, setAllNotifications] = useState([]);
    const [currentNotification, setCurrentNotification] = useState(null);
    const [stats, setStats] = useState(null);
    const [typeStats, setTypeStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 100,
        total: 0,
        total_pages: 0
    });

    // 1️⃣ Viewing & Filtering Functions

    // Fetch all notifications with filtering
    const fetchAllNotifications = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.fetchAllNotifications(filters);
            if (result.success) {
                setAllNotifications(result.data?.notifications || []);
                setPagination({
                    page: result.data?.page || 1,
                    limit: result.data?.limit || 100,
                    total: result.data?.total_count || 0,
                    total_pages: Math.ceil((result.data?.total_count || 0) / (result.data?.limit || 100))
                });
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch notifications';
            setError(errorMsg);
            console.error('Fetch notifications error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch notifications for a specific user
    const fetchNotificationsByUser = useCallback(async (userId, skip = 0, limit = 50) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.fetchNotificationsByUser(userId, skip, limit);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch user notifications';
            setError(errorMsg);
            console.error('Fetch user notifications error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch unread notifications
    const fetchUnreadNotifications = useCallback(async (skip = 0, limit = 50) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.fetchUnreadNotifications(skip, limit);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch unread notifications';
            setError(errorMsg);
            console.error('Fetch unread notifications error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Search notifications
    const searchNotifications = useCallback(async (keyword, skip = 0, limit = 50) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.searchNotifications(keyword, skip, limit);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to search notifications';
            setError(errorMsg);
            console.error('Search notifications error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // 2️⃣ Analytics Functions

    // Fetch notification statistics
    const fetchNotificationStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.fetchNotificationStats();
            if (result.success) {
                setStats(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch notification statistics';
            setError(errorMsg);
            console.error('Fetch stats error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch notification count by type
    const fetchNotificationCountByType = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.fetchNotificationCountByType();
            if (result.success) {
                setTypeStats(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch type statistics';
            setError(errorMsg);
            console.error('Fetch type stats error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // 3️⃣ Sending & Broadcasting Functions

    // Send notification to a single user
    const sendNotificationToUser = useCallback(async (userId, title, message, type = "SYSTEM", referenceId = null) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.sendNotificationToUser(userId, title, message, type, referenceId);
            if (result.success) {
                // Refresh the all notifications list
                fetchAllNotifications();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to send notification';
            setError(errorMsg);
            console.error('Send notification error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchAllNotifications]);

    // Send notifications to multiple users
    const sendNotificationToMultipleUsers = useCallback(async (userIds, title, message, type = "SYSTEM", referenceId = null) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.sendNotificationToMultipleUsers(userIds, title, message, type, referenceId);
            if (result.success) {
                // Refresh the all notifications list
                fetchAllNotifications();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to send notifications';
            setError(errorMsg);
            console.error('Send multiple notifications error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchAllNotifications]);

    // Broadcast notification to all users
    const broadcastNotification = useCallback(async (broadcastData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.broadcastNotification(broadcastData);
            if (result.success) {
                // Refresh the all notifications list
                fetchAllNotifications();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to broadcast notification';
            setError(errorMsg);
            console.error('Broadcast error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchAllNotifications]);

    // 4️⃣ Update & Moderation Functions

    // Mark notification as read (admin override)
    const markNotificationReadByAdmin = useCallback(async (notificationId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.markNotificationReadByAdmin(notificationId);
            if (result.success) {
                // Update in all notifications list
                setAllNotifications(prev => 
                    prev.map(notification => 
                        notification.notification_id === notificationId 
                            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
                            : notification
                    )
                );
                // Refresh stats
                fetchNotificationStats();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to mark notification as read';
            setError(errorMsg);
            console.error('Mark read error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchNotificationStats]);

    // Update notification details
    const updateNotification = useCallback(async (notificationId, updateData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.updateNotification(notificationId, updateData);
            if (result.success) {
                // Update in all notifications list
                setAllNotifications(prev => 
                    prev.map(notification => 
                        notification.notification_id === notificationId 
                            ? { ...notification, ...updateData }
                            : notification
                    )
                );
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update notification';
            setError(errorMsg);
            console.error('Update notification error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // 5️⃣ Cleanup / Maintenance Functions

    // Delete a specific notification
    const deleteNotificationByAdmin = useCallback(async (notificationId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.deleteNotificationByAdmin(notificationId);
            if (result.success) {
                // Remove from all notifications list
                setAllNotifications(prev => 
                    prev.filter(notification => notification.notification_id !== notificationId)
                );
                // Clear current notification if it's the one being deleted
                if (currentNotification?.notification_id === notificationId) {
                    setCurrentNotification(null);
                }
                // Update pagination total
                setPagination(prev => ({
                    ...prev,
                    total: prev.total - 1,
                    total_pages: Math.ceil((prev.total - 1) / prev.limit)
                }));
                // Refresh stats
                fetchNotificationStats();
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to delete notification';
            setError(errorMsg);
            console.error('Delete notification error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentNotification, fetchNotificationStats]);

    // Delete old notifications
    const deleteOldNotifications = useCallback(async (days = 30, confirm = false) => {
        setLoading(true);
        setError(null);
        try {
            const result = await notificationAdminApi.deleteOldNotifications(days, confirm);
            if (result.success && confirm) {
                // Refresh all notifications after deletion
                fetchAllNotifications();
                // Refresh stats
                fetchNotificationStats();
            }
            return { success: true, data: result.data };
        } catch (err) {
            const errorMsg = 'Failed to delete old notifications';
            setError(errorMsg);
            console.error('Delete old notifications error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchAllNotifications, fetchNotificationStats]);

    // Utility Functions

    // Set current notification
    const setNotification = useCallback((notification) => {
        setCurrentNotification(notification);
    }, []);

    // Clear current notification
    const clearCurrentNotification = useCallback(() => {
        setCurrentNotification(null);
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setAllNotifications([]);
        setCurrentNotification(null);
        setStats(null);
        setTypeStats(null);
        setPagination({
            page: 1,
            limit: 100,
            total: 0,
            total_pages: 0
        });
    }, []);

    const value = {
        // State
        allNotifications,
        currentNotification,
        stats,
        typeStats,
        loading,
        error,
        pagination,
        
        // 1️⃣ Viewing & Filtering Functions
        fetchAllNotifications,
        fetchNotificationsByUser,
        fetchUnreadNotifications,
        searchNotifications,
        
        // 2️⃣ Analytics Functions
        fetchNotificationStats,
        fetchNotificationCountByType,
        
        // 3️⃣ Sending & Broadcasting Functions
        sendNotificationToUser,
        sendNotificationToMultipleUsers,
        broadcastNotification,
        
        // 4️⃣ Update & Moderation Functions
        markNotificationReadByAdmin,
        updateNotification,
        
        // 5️⃣ Cleanup / Maintenance Functions
        deleteNotificationByAdmin,
        deleteOldNotifications,
        
        // Utility Functions
        setNotification,
        clearCurrentNotification,
        clearError,
        clearAllData
    };

    return (
        <NotificationAdminContext.Provider value={value}>
            {children}
        </NotificationAdminContext.Provider>
    );
};