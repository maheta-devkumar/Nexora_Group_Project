import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import notificationAPI from '../api/notification';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const limit = 20;

  // Fetch notifications
  const fetchNotifications = useCallback(async (reset = false, showAll = false) => {
    if (!isAuthenticated) return;
    
    const currentSkip = reset ? 0 : skip;
    setIsLoading(true);
    
    try {
      const response = await notificationAPI.getUserNotifications(
        currentSkip, 
        showAll ? 100 : limit
      );
      
      if (response.success) {
        const newNotifications = response.data.notifications || [];
        
        if (reset) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setTotalCount(response.data.total_count || 0);
        setUnreadCount(response.data.unread_count || 0);
        
        // Check if there are more notifications to load
        if (showAll) {
          setHasMore(false);
        } else {
          setHasMore(newNotifications.length === limit);
        }
        
        if (!showAll) {
          setSkip(currentSkip + newNotifications.length);
        }
        
        return { success: true, data: response.data };
      } else {
        toast.error(response.message || 'Failed to fetch notifications');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to fetch notifications');
      return { success: false, message: 'Failed to fetch notifications' };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, skip, limit]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unread_count || 0);
        return response.data.unread_count || 0;
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
    return 0;
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationAPI.markAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.notification_id === notificationId 
              ? { 
                  ...n, 
                  is_read: true, 
                  read_at: new Date().toISOString() 
                }
              : n
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        toast.success('Notification marked as read');
        return { success: true, data: response.data };
      } else {
        toast.error(response.message || 'Failed to mark as read');
        return response;
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
      return { success: false, message: 'Failed to mark as read' };
    }
  };

  // Mark all as read - FIXED VERSION
  const markAllAsRead = async () => {
    try {
      const response = await notificationAPI.markAllAsRead();
      
      if (response.success) {
        // Update all notifications to read
        setNotifications(prev => 
          prev.map(n => ({ 
            ...n, 
            is_read: true, 
            read_at: n.read_at || new Date().toISOString() 
          }))
        );
        
        // Reset unread count
        setUnreadCount(0);
        
        toast.success(response.message || 'All notifications marked as read');
        return { success: true, data: response.data };
      } else {
        toast.error(response.message || 'Failed to mark all as read');
        return response;
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
      return { success: false, message: 'Failed to mark all as read' };
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await notificationAPI.deleteNotification(notificationId);
      if (response.success) {
        // Remove from local state
        const notification = notifications.find(n => n.notification_id === notificationId);
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
        setTotalCount(prev => prev - 1);
        
        toast.success('Notification deleted');
        return { success: true, data: response.data };
      } else {
        toast.error(response.message || 'Failed to delete notification');
        return response;
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
      return { success: false, message: 'Failed to delete notification' };
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const response = await notificationAPI.deleteAllNotifications();
      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
        setTotalCount(0);
        setSkip(0);
        setHasMore(false);
        
        toast.success(response.message || 'All notifications deleted');
        return { success: true, data: response.data };
      } else {
        toast.error(response.message || 'Failed to delete all notifications');
        return response;
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      toast.error('Failed to delete all notifications');
      return { success: false, message: 'Failed to delete all notifications' };
    }
  };

  // Load more notifications
  const loadMoreNotifications = async () => {
    if (!hasMore || isLoading) return;
    
    const response = await fetchNotifications(false);
    return response;
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };

  // Close dropdown
  const closeDropdown = () => {
    setShowDropdown(false);
  };

  // Add notification (for real-time updates)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setTotalCount(prev => prev + 1);
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Refresh notifications
  const refreshNotifications = () => {
    setSkip(0);
    return fetchNotifications(true);
  };

  // Reset state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
      setSkip(0);
      setHasMore(true);
      setShowDropdown(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications(true);
      
      // Set up polling for unread count every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    showDropdown,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    loadMoreNotifications,
    refreshNotifications,
    toggleDropdown,
    closeDropdown,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};