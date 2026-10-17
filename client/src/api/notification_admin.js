import api from './api';

const NOTIFICATIONS_ADMIN_BASE_URL = `/notifications/admin`;

/* -----------------------------
   📋 ADMIN NOTIFICATION API FUNCTIONS
------------------------------ */

// 1️⃣ Viewing & Filtering (Core)

// Get all notifications in the system
export const fetchAllNotifications = async (filters = {}) => {
    try {
        const { 
            skip = 0, 
            limit = 100, 
            user_id, 
            type, 
            is_read, 
            keyword, 
            start_date, 
            end_date 
        } = filters;

        const params = { skip, limit };
        if (user_id !== undefined) params.user_id = user_id;
        if (type) params.type = type;
        if (is_read !== undefined) params.is_read = is_read;
        if (keyword) params.keyword = keyword;
        if (start_date) params.start_date = start_date;
        if (end_date) params.end_date = end_date;

        const response = await api.get(`${NOTIFICATIONS_ADMIN_BASE_URL}/all`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Notifications fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch All Notifications Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch notifications",
            data: null
        };
    }
};

// Get notifications for a specific user
export const fetchNotificationsByUser = async (userId, skip = 0, limit = 50) => {
    try {
        const response = await api.get(`${NOTIFICATIONS_ADMIN_BASE_URL}/user/${userId}`, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data,
            message: "User notifications fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch User Notifications Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch user notifications",
            data: null
        };
    }
};

// Get all unread notifications
export const fetchUnreadNotifications = async (skip = 0, limit = 50) => {
    try {
        const response = await api.get(`${NOTIFICATIONS_ADMIN_BASE_URL}/unread`, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data,
            message: "Unread notifications fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Unread Notifications Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch unread notifications",
            data: null
        };
    }
};

// Search notifications by keyword
export const searchNotifications = async (keyword, skip = 0, limit = 50) => {
    try {
        const response = await api.get(`${NOTIFICATIONS_ADMIN_BASE_URL}/search`, {
            params: { keyword, skip, limit }
        });
        return { 
            success: true, 
            data: response.data,
            message: "Search completed successfully" 
        };
    } catch (error) {
        console.error("Search Notifications Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to search notifications",
            data: null
        };
    }
};

// 2️⃣ Analytics (Dashboard Insight)

// Get notification statistics
export const fetchNotificationStats = async () => {
    try {
        const response = await api.get(`${NOTIFICATIONS_ADMIN_BASE_URL}/stats`);
        return { 
            success: true, 
            data: response.data,
            message: "Statistics fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Stats Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch notification statistics",
            data: null
        };
    }
};

// Get notification count by type
export const fetchNotificationCountByType = async () => {
    try {
        const response = await api.get(`${NOTIFICATIONS_ADMIN_BASE_URL}/stats/by-type`);
        return { 
            success: true, 
            data: response.data,
            message: "Type statistics fetched successfully" 
        };
    } catch (error) {
        console.error("Fetch Type Stats Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch notification type statistics",
            data: null
        };
    }
};

// 3️⃣ Sending & Broadcasting

// Send notification to a single user
export const sendNotificationToUser = async (userId, title, message, type = "SYSTEM", referenceId = null) => {
    try {
        const params = { user_id: userId, title, message, type };
        if (referenceId !== null) params.reference_id = referenceId;

        const response = await api.post(`${NOTIFICATIONS_ADMIN_BASE_URL}/send-to-user`, null, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Notification sent successfully" 
        };
    } catch (error) {
        console.error("Send Notification Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to send notification",
            data: null
        };
    }
};

// Send notifications to multiple users
export const sendNotificationToMultipleUsers = async (userIds, title, message, type = "SYSTEM", referenceId = null) => {
    try {
        const params = { 
            user_ids: userIds.join(','), 
            title, 
            message, 
            type 
        };
        if (referenceId !== null) params.reference_id = referenceId;

        const response = await api.post(`${NOTIFICATIONS_ADMIN_BASE_URL}/send-to-multiple`, null, { params });
        return { 
            success: true, 
            data: response.data,
            message: `Notifications sent to ${userIds.length} users` 
        };
    } catch (error) {
        console.error("Send Multiple Notifications Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to send notifications",
            data: null
        };
    }
};

// Broadcast notification to all users
export const broadcastNotification = async (broadcastData) => {
    try {
        const response = await api.post(`${NOTIFICATIONS_ADMIN_BASE_URL}/broadcast`, broadcastData);
        return { 
            success: true, 
            data: response.data,
            message: "Broadcast sent successfully" 
        };
    } catch (error) {
        console.error("Broadcast Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to broadcast notification",
            data: null
        };
    }
};

// 4️⃣ Update & Moderation

// Mark notification as read (admin override)
export const markNotificationReadByAdmin = async (notificationId) => {
    try {
        const response = await api.put(`${NOTIFICATIONS_ADMIN_BASE_URL}/${notificationId}/read-admin`);
        return { 
            success: true, 
            data: response.data,
            message: "Notification marked as read" 
        };
    } catch (error) {
        console.error("Mark Read Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to mark notification as read",
            data: null
        };
    }
};

// Update notification details
export const updateNotification = async (notificationId, updateData) => {
    try {
        const response = await api.put(`${NOTIFICATIONS_ADMIN_BASE_URL}/${notificationId}`, updateData);
        return { 
            success: true, 
            data: response.data,
            message: "Notification updated successfully" 
        };
    } catch (error) {
        console.error("Update Notification Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to update notification",
            data: null
        };
    }
};

// 5️⃣ Cleanup / Maintenance

// Delete a specific notification
export const deleteNotificationByAdmin = async (notificationId) => {
    try {
        const response = await api.delete(`${NOTIFICATIONS_ADMIN_BASE_URL}/${notificationId}`);
        return { 
            success: true, 
            data: response.data,
            message: "Notification deleted successfully" 
        };
    } catch (error) {
        console.error("Delete Notification Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to delete notification",
            data: null
        };
    }
};

// Delete old notifications
export const deleteOldNotifications = async (days = 30, confirm = false) => {
    try {
        const response = await api.delete(`${NOTIFICATIONS_ADMIN_BASE_URL}/cleanup/old`, {
            params: { days, confirm }
        });
        return { 
            success: true, 
            data: response.data,
            message: confirm ? "Old notifications deleted" : "Preview generated"
        };
    } catch (error) {
        console.error("Delete Old Notifications Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to process cleanup",
            data: null
        };
    }
};