import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import NotificationCard from './NotificationCard';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    closeDropdown,
    showDropdown
  } = useNotification();
  const navigate = useNavigate();

  if (!showDropdown) return null;

  const handleViewAll = () => {
    closeDropdown();
    navigate('/notifications');
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="notification-dropdown">
      <div className="dropdown-header">
        <h3 className="dropdown-title">Notifications</h3>
        {unreadCount > 0 && (
          <button
            className="mark-all-read-btn"
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="dropdown-content">
        {isLoading ? (
          <div className="dropdown-loading">
            <div className="loading-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="dropdown-empty">
            <i className="fas fa-bell-slash empty-icon"></i>
            <p className="empty-title">No notifications</p>
            <p className="empty-subtitle">You're all caught up!</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.slice(0, 7).map(notification => (
              <NotificationCard
                key={notification.notification_id}
                notification={notification}
                compact={true}
                onClose={closeDropdown}
              />
            ))}
          </div>
        )}
      </div>

      <div className="dropdown-footer">
        <button
          className="view-all-btn"
          onClick={handleViewAll}
        >
          <i className="fas fa-list"></i>
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;