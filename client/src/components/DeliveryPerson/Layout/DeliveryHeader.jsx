import React, { useState, useEffect } from 'react';
import { useDeliveryPersonContext } from '../../../context/DeliveryPersonContext';
import { useNotification } from '../../../context/NotificationContext';
import './DeliveryHeader.css';

const DeliveryHeader = ({ toggleSidebar, sidebarOpen }) => {
  const {
    currentDeliveryPerson,
    fetchMyDeliveryProfile,
    updateDeliveryPersonStatus
  } = useDeliveryPersonContext();

  const {
    notifications,
    unreadCount,
    isLoading,
    showDropdown,
    fetchNotifications,
    markAllAsRead,
    toggleDropdown,
    closeDropdown
  } = useNotification();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchMyDeliveryProfile();
        await fetchNotifications();
      } catch (error) {
        console.error('Error loading header data:', error);
      }
    };

    loadData();
  }, [fetchMyDeliveryProfile, fetchNotifications]);

  // Update online status based on delivery person status
  useEffect(() => {
    if (currentDeliveryPerson?.status) {
      const status = currentDeliveryPerson.status.toLowerCase();
      setIsOnline(status === 'online' || status === 'available');
    }
  }, [currentDeliveryPerson]);

  const toggleStatus = async () => {
    try {
      const newStatus = isOnline ? 'offline' : 'online';
      await updateDeliveryPersonStatus(currentDeliveryPerson.delivery_person_id, newStatus);
      setIsOnline(!isOnline);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getAvatarUrl = () => {
    if (currentDeliveryPerson?.profile_picture) {
      return currentDeliveryPerson.profile_picture;
    }
    const name = currentDeliveryPerson?.name || 'Delivery Partner';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=128&bold=true`;
  };

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('delivery_status');
    localStorage.removeItem('delivery_notifications');

    // Navigate to login page
    window.location.href = '/login';
  };

  return (
    <header className="nd-header">
      <div className="nd-header-content">
        {/* Left Section: Logo & Toggle */}
        <div className="nd-header-left">
          <button
            className="nd-header-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            <i className="fas fa-bars" style={{ fontSize: '22px' }}></i>
          </button>

          <div className="nd-header-logo">
            <div className="nd-logo-icon">
              <i className="fas fa-bolt" style={{ fontSize: '20px' }}></i>
            </div>
            <h1>Nexora <span>Delivery</span></h1>
          </div>
        </div>

        {/* Center Section: Status Toggle */}
        <div className="nd-header-center">
          <div className="nd-status-wrapper">
            <span className="nd-status-label">Current Status</span>
            <button
              className={`nd-status-btn ${isOnline ? 'online' : 'offline'}`}
              onClick={toggleStatus}
              disabled={!currentDeliveryPerson}
            >
              <span className="nd-status-dot"></span>
              {isOnline ? 'Available for Orders' : 'Offline / Busy'}
            </button>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="nd-header-right">

          {/* Notifications */}
          <div className="nd-header-action-wrapper">
            <button
              className={`nd-header-action-btn ${showNotifications ? 'active' : ''}`}
              onClick={() => {
                toggleDropdown();
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
            >
              <i className="fas fa-bell" style={{ fontSize: '20px' }}></i>
              {unreadCount > 0 && (
                <span className="nd-notification-badge">{unreadCount}</span>
              )}
            </button>

            {showDropdown && (
              <div className="nd-dropdown-panel nd-notifications-dropdown">
                <div className="nd-dropdown-header">
                  <h3>Notifications</h3>
                  <div className="nd-dropdown-actions">
                    <button
                      className="nd-text-btn"
                      onClick={handleMarkAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      Mark all read
                    </button>
                    <button
                      className="nd-close-btn"
                      onClick={() => {
                        closeDropdown();
                        setShowNotifications(false);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="nd-dropdown-content">
                  {isLoading ? (
                    <div className="nd-empty-state">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="nd-empty-state">
                      <div className="nd-empty-icon">🔔</div>
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map(notification => (
                      <div
                        key={notification.notification_id}
                        className={`nd-notification-item ${!notification.is_read ? 'unread' : ''}`}
                      >
                        <div className="nd-notif-icon">
                          {notification.type === 'delivery' && '📦'}
                          {notification.type === 'payment' && '💰'}
                          {notification.type === 'rating' && '⭐'}
                          {notification.type === 'system' && '🔔'}
                        </div>
                        <div className="nd-notif-body">
                          <p className="nd-notif-message">{notification.message}</p>
                          <span className="nd-notif-time">
                            {new Date(notification.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="nd-dropdown-footer">
                  <button className="nd-view-all-btn" onClick={() => window.location.href = '/delivery/notifications'}>
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="nd-header-user-wrapper">
            <button
              className={`nd-user-btn ${showUserMenu ? 'active' : ''}`}
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
            >
              <div className="nd-user-avatar-wrapper">
                <img
                  src={getAvatarUrl()}
                  alt={currentDeliveryPerson?.name || 'User'}
                  className="nd-user-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=128&bold=true';
                  }}
                />
                <span className={`nd-user-status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
              </div>
              <div className="nd-user-info">
                <span className="nd-user-name">{currentDeliveryPerson?.name ? currentDeliveryPerson.name.split(' ')[0] : 'Partner'}</span>
                <i className={`fas fa-chevron-down nd-user-chevron ${showUserMenu ? 'rotate' : ''}`} style={{ fontSize: '14px' }}></i>
              </div>
            </button>

            {showUserMenu && (
              <div className="nd-dropdown-panel nd-user-dropdown">
                <div className="nd-user-dropdown-header">
                  <div className="nd-user-dropdown-avatar">
                    <img src={getAvatarUrl()} alt="User" />
                  </div>
                  <div className="nd-user-dropdown-details">
                    <h4>{currentDeliveryPerson?.name || 'Delivery Partner'}</h4>
                    <span>{currentDeliveryPerson?.email || 'partner@nexora.com'}</span>
                  </div>
                </div>

                <div className="nd-dropdown-items">
                  <button
                    className="nd-dropdown-item"
                    onClick={() => window.location.href = '/delivery/profile'}
                  >
                    <i className="fas fa-user" style={{ fontSize: '16px' }}></i>
                    <span>My Profile</span>
                  </button>
                  <button
                    className="nd-dropdown-item"
                    onClick={() => window.location.href = '/admin/help'}
                  >
                    <i className="fas fa-question-circle" style={{ fontSize: '16px' }}></i>
                    <span>Help & Support</span>
                  </button>
                  <div className="nd-dropdown-divider"></div>
                  <button
                    className="nd-dropdown-item logout"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt" style={{ fontSize: '16px' }}></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backdrops */}
        {(showDropdown || showUserMenu) && (
          <div
            className="nd-backdrop"
            onClick={() => {
              closeDropdown();
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
          />
        )}
      </div>
    </header>
  );
};

export default DeliveryHeader;
