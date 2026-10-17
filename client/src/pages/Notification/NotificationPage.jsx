import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import NotificationCard from '../../components/Notification/NotificationCard';
import NotificationSettings from '../../components/Notification/NotificationSettings';
import notificationAPI from '../../api/notification';
import './NotificationPage.css';

const NotificationPage = () => {
  const { unreadCount, markAllAsRead, deleteAllNotifications } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const fetchNotifications = useCallback(async (tab = activeTab, reset = false) => {
    setLoading(true);
    try {
      const isRead = tab === 'unread' ? false : tab === 'read' ? true : null;
      const skip = reset ? 0 : page * limit;
      
      const response = await notificationAPI.getUserNotifications(skip, limit, isRead);
      if (response.success) {
        const data = response.data;
        if (reset) {
          setNotifications(data.notifications || []);
          setPage(1);
        } else {
          setNotifications(prev => [...prev, ...(data.notifications || [])]);
          setPage(prev => prev + 1);
        }
        setTotalCount(data.total_count || 0);
        setHasMore((data.notifications?.length || 0) === limit);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchNotifications(activeTab, true);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    fetchNotifications(activeTab, true);
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      await deleteAllNotifications();
      fetchNotifications(activeTab, true);
    }
  };

  const handleNotificationDelete = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
  };

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

  const notificationGroups = groupNotificationsByDate(notifications);

  const getFilteredCount = () => {
    switch (activeTab) {
      case 'all':
        return totalCount;
      case 'unread':
        return unreadCount;
      case 'read':
        return totalCount - unreadCount;
      default:
        return notifications.length;
    }
  };

  return (
    <div className="notification-page">
      <div className="notification-container">
        {!showSettings ? (
          <>
            <div className="notification-header">
              <div>
                <h1 className="page-title">Notifications</h1>
                <p className="page-subtitle">Stay updated with your latest activities</p>
              </div>
              <div className="header-actions">
                <button 
                  className="settings-btn"
                  onClick={() => setShowSettings(true)}
                >
                  <i className="fas fa-cog"></i>
                  Settings
                </button>
              </div>
            </div>

            <div className="notification-actions">
              <div className="filter-tabs">
                {['all', 'unread', 'read'].map(tab => (
                  <button
                    key={tab}
                    className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab === 'all' && totalCount > 0 && (
                      <span className="tab-count">{totalCount}</span>
                    )}
                    {tab === 'unread' && unreadCount > 0 && (
                      <span className="tab-count">{unreadCount}</span>
                    )}
                    {tab === 'read' && (totalCount - unreadCount) > 0 && (
                      <span className="tab-count">{totalCount - unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="bulk-actions">
                {unreadCount > 0 && (
                  <button 
                    className="mark-all-btn"
                    onClick={handleMarkAllRead}
                  >
                    <i className="fas fa-check-double"></i>
                    Mark all as read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    className="delete-all-btn"
                    onClick={handleDeleteAll}
                  >
                    <i className="fas fa-trash"></i>
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="notifications-list">
              {loading && notifications.length === 0 ? (
                <div className="loading-state">
                  <div className="loading-spinner large"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-bell-slash empty-icon"></i>
                  <h3>No notifications yet</h3>
                  <p>When you have notifications, they'll appear here</p>
                  <button 
                    className="browse-btn"
                    onClick={() => window.location.href = '/'}
                  >
                    Start Shopping
                  </button>
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
                        {groupNotifications.map(notification => (
                          <NotificationCard
                            key={notification.notification_id}
                            notification={notification}
                            onDelete={handleNotificationDelete}
                          />
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
                        {loading ? (
                          <>
                            <div className="small-spinner"></div>
                            Loading...
                          </>
                        ) : 'Load More Notifications'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <NotificationSettings />
        )}

        {showSettings && (
          <div className="settings-back">
            <button 
              className="back-btn"
              onClick={() => setShowSettings(false)}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;