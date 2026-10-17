import React, { useEffect, useState, useCallback } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import DeliveryLayout from '../../../components/DeliveryPerson/Layout/DeliveryLayout';
import NotificationCard from '../../../components/DeliveryPerson/Notification/NotificationCard';
import './Notification.css';
import {
  Bell,
  CheckCircle,
  Trash2,
  Filter,
  Search,
  Clock,
  AlertCircle,
  Package,
  DollarSign,
  Star,
  MessageSquare,
  CheckCheck, // ✓✓ icon
  RefreshCw,
  Archive,
  BellOff,
  Settings,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react';

const Notification = () => {
  const { 
    unreadCount, 
    markAllAsRead, 
    notifications: contextNotifications,
    isLoading: contextLoading,
    fetchNotifications: fetchFromContext,
    deleteNotification: deleteFromContext
  } = useNotification();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const limit = 20;

  // Fetch notifications with error handling
  const fetchNotifications = useCallback(async (tab = activeTab, reset = false) => {
    setLoading(true);
    try {
      // First try to use context notifications if available
      if (contextNotifications && contextNotifications.length > 0) {
        if (reset) {
          setNotifications(contextNotifications);
          setPage(1);
        } else {
          // For pagination, you might need to adjust this logic
          const skip = reset ? 0 : page * limit;
          const paginatedNotifications = contextNotifications.slice(skip, skip + limit);
          setNotifications(prev => reset ? paginatedNotifications : [...prev, ...paginatedNotifications]);
          setHasMore(contextNotifications.length > (reset ? 0 : page * limit) + limit);
        }
      } else {
        // Fallback: Try to fetch from context
        await fetchFromContext(limit);
        // After fetch, use the updated context notifications
        setTimeout(() => {
          setNotifications(contextNotifications || []);
          setHasMore(false);
        }, 100);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback to mock data if API fails
      setNotifications(getMockNotifications());
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, contextNotifications, fetchFromContext]);

  // Load notifications on mount and when tab changes
  useEffect(() => {
    fetchNotifications(activeTab, true);
  }, [activeTab]);

  // Mock data for fallback
  const getMockNotifications = () => {
    const mockTypes = ['delivery', 'payment', 'system', 'rating'];
    const mockMessages = [
      'New delivery assignment available',
      'Payment received for delivery #ORD-12345',
      'System maintenance scheduled',
      'You received a 5-star rating!',
      'Delivery #ORD-12346 has been picked up',
      'Weekly earnings summary available',
      'New feature: Real-time tracking enabled',
      'Customer left feedback for delivery #ORD-12347'
    ];
    
    return Array.from({ length: 8 }, (_, i) => ({
      notification_id: `mock-${i + 1}`,
      message: mockMessages[i % mockMessages.length],
      type: mockTypes[i % mockTypes.length],
      is_read: i > 3, // First 4 are unread
      created_at: new Date(Date.now() - (i * 3600000)).toISOString(), // Staggered times
      description: 'This is a mock notification for demonstration purposes.',
      metadata: {
        order_id: `ORD-1234${i + 1}`,
        amount: i % 2 === 0 ? '250' : null,
        rating: i === 3 ? '5' : null
      }
    }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      alert('Failed to mark all as read. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      try {
        // Delete all notifications one by one from context
        const deletePromises = notifications.map(n => 
          deleteFromContext(n.notification_id)
        );
        await Promise.all(deletePromises);
        setNotifications([]);
      } catch (error) {
        console.error('Failed to delete all notifications:', error);
        alert('Failed to delete notifications. Please try again.');
      }
    }
  };

  const handleNotificationDelete = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
  };

  // Filter notifications based on active tab, search, and type filter
  const filteredNotifications = notifications.filter(notification => {
    // Tab filter
    if (activeTab === 'unread' && notification.is_read) return false;
    if (activeTab === 'read' && !notification.is_read) return false;
    
    // Type filter
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.message?.toLowerCase().includes(searchLower) ||
        notification.type?.toLowerCase().includes(searchLower) ||
        (notification.metadata && JSON.stringify(notification.metadata).toLowerCase().includes(searchLower)) ||
        notification.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Group notifications by date
  const groupNotificationsByDate = (notificationsList) => {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    notificationsList.forEach(notification => {
      const date = new Date(notification.created_at);
      let groupName;

      if (date >= today) {
        groupName = 'Today';
      } else if (date >= yesterday) {
        groupName = 'Yesterday';
      } else if (date >= lastWeek) {
        groupName = 'This Week';
      } else {
        groupName = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(notification);
    });

    return groups;
  };

  const notificationGroups = groupNotificationsByDate(filteredNotifications);

  // Get counts
  const getCounts = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    const read = total - unread;
    
    const deliveryCount = notifications.filter(n => n.type === 'delivery').length;
    const paymentCount = notifications.filter(n => n.type === 'payment').length;
    const ratingCount = notifications.filter(n => n.type === 'rating').length;
    const systemCount = notifications.filter(n => n.type === 'system').length;

    return {
      total,
      unread,
      read,
      deliveryCount,
      paymentCount,
      ratingCount,
      systemCount
    };
  };

  const counts = getCounts();

  // Format date for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const refreshNotifications = () => {
    fetchNotifications(activeTab, true);
  };

  return (
    <DeliveryLayout>
      <div className="notification-page">
        {/* Page Header */}
        <div className="notification-header">
          <div className="header-left">
            <h1>
              <Bell size={24} />
              Notifications
            </h1>
            {counts.unread > 0 && (
              <span className="unread-badge">
                {counts.unread} unread
              </span>
            )}
          </div>
          
          <div className="header-actions">
            <button 
              className="btn-secondary"
              onClick={refreshNotifications}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button 
              className="btn-primary"
              onClick={handleMarkAllRead}
              disabled={loading || counts.unread === 0}
            >
              <CheckCheck size={16} /> {/* Fixed: Using CheckCheck instead of CheckDouble */}
              Mark all as read
            </button>
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="notification-stats">
          <div className="stat-card">
            <div className="stat-icon total">
              <Bell size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{counts.total}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon unread">
              <AlertCircle size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{counts.unread}</span>
              <span className="stat-label">Unread</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon delivery">
              <Package size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{counts.deliveryCount}</span>
              <span className="stat-label">Delivery</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon payment">
              <DollarSign size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{counts.paymentCount}</span>
              <span className="stat-label">Payment</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        {!showSettings && (
          <div className="notification-filters">
            <div className="filter-group">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            <div className="filter-group">
              <div className="filter-tabs">
                {['all', 'unread', 'read'].map(tab => (
                  <button
                    key={tab}
                    className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span className="tab-count">
                      {tab === 'all' && counts.total}
                      {tab === 'unread' && counts.unread}
                      {tab === 'read' && counts.read}
                    </span>
                  </button>
                ))}
              </div>
              
              <select 
                className="filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="delivery">Delivery</option>
                <option value="payment">Payment</option>
                <option value="rating">Rating</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-panel">
            <div className="settings-header">
              <h3>
                <Settings size={20} />
                Notification Settings
              </h3>
              <button 
                className="back-btn"
                onClick={() => setShowSettings(false)}
              >
                <ArrowLeft size={16} />
                Back to Notifications
              </button>
            </div>
            
            <div className="settings-content">
              <div className="setting-item">
                <h4>Push Notifications</h4>
                <div className="setting-options">
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                  <span>Enable push notifications</span>
                </div>
              </div>
              
              <div className="setting-item">
                <h4>Email Notifications</h4>
                <div className="setting-options">
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                  <span>Receive email notifications</span>
                </div>
              </div>
              
              <div className="setting-item">
                <h4>Notification Types</h4>
                <div className="notification-types">
                  {['delivery', 'payment', 'rating', 'system'].map(type => (
                    <div key={type} className="type-option">
                      <label className="checkbox">
                        <input type="checkbox" defaultChecked />
                        <span className="checkmark"></span>
                        {type.charAt(0).toUpperCase() + type.slice(1)} Notifications
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {!showSettings && (
          <div className="notifications-container">
            {loading && filteredNotifications.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <BellOff size={48} />
                </div>
                <h3>No notifications found</h3>
                <p>
                  {searchTerm || activeTab !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your filters or search'
                    : 'You don\'t have any notifications yet'
                  }
                </p>
                {(searchTerm || activeTab !== 'all' || typeFilter !== 'all') && (
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setActiveTab('all');
                      setTypeFilter('all');
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {Object.entries(notificationGroups).map(([groupName, groupNotifications]) => (
                  <div key={groupName} className="notification-group">
                    <div className="group-header">
                      <h3 className="group-title">{groupName}</h3>
                      <span className="group-count">{groupNotifications.length}</span>
                    </div>
                    <div className="group-content">
                      {groupNotifications.map((notification) => (
                        <div 
                          key={notification.notification_id}
                          className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                        >
                          <div className="notification-icon">
                            <div className={`icon-container ${notification.type}`}>
                              {notification.type === 'delivery' && <Package size={18} />}
                              {notification.type === 'payment' && <DollarSign size={18} />}
                              {notification.type === 'rating' && <Star size={18} />}
                              {notification.type === 'system' && <Bell size={18} />}
                              {!['delivery', 'payment', 'rating', 'system'].includes(notification.type) && 
                                <MessageSquare size={18} />}
                            </div>
                          </div>
                          
                          <div className="notification-content">
                            <div className="notification-header">
                              <strong>{notification.message}</strong>
                              <span className="notification-time">
                                <Clock size={14} />
                                {formatTime(notification.created_at)}
                              </span>
                            </div>
                            
                            <div className="notification-meta">
                              <span className="notification-type">
                                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                              </span>
                              
                              {notification.metadata && (
                                <span className="notification-extra">
                                  {notification.metadata.order_id && `Order #${notification.metadata.order_id}`}
                                  {notification.metadata.amount && ` • ₹${notification.metadata.amount}`}
                                  {notification.metadata.rating && ` • ${notification.metadata.rating}★`}
                                </span>
                              )}
                            </div>
                            
                            {notification.description && (
                              <p className="notification-description">
                                {notification.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="notification-actions">
                            {!notification.is_read && (
                              <button 
                                className="action-btn mark-read"
                                onClick={async () => {
                                  // Mark as read logic here
                                }}
                                title="Mark as read"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            
                            <button 
                              className="action-btn delete"
                              onClick={async () => {
                                if (window.confirm('Delete this notification?')) {
                                  handleNotificationDelete(notification.notification_id);
                                }
                              }}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="load-more">
                    <button 
                      className="load-more-btn"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More Notifications'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer Actions */}
        {!showSettings && filteredNotifications.length > 0 && (
          <div className="notifications-footer">
            <button 
              className="btn-danger"
              onClick={handleDeleteAll}
              disabled={loading}
            >
              <Trash2 size={16} />
              Clear All Notifications
            </button>
            
            <div className="pagination-info">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </div>
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default Notification;