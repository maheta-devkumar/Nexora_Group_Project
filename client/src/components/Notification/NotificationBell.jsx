import React, { useRef, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import './NotificationBell.css';

const NotificationBell = () => {
  const { unreadCount, toggleDropdown, showDropdown, closeDropdown } = useNotification();
  const bellRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeDropdown]);

  return (
    <div className="notification-bell-container" ref={bellRef}>
      <button
        className="notification-bell-btn"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <i className="fas fa-bell bell-icon"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      <NotificationDropdown />
    </div>
  );
};

export default NotificationBell;