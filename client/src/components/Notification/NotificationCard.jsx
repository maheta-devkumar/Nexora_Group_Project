import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationCard.css';

const NotificationCard = ({ notification, compact = false, onClose }) => {
  const { markAsRead, deleteNotification } = useNotification();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case 'ORDER':
        return '📦';
      case 'PAYMENT':
        return '💳';
      case 'DELIVERY':
        return '🚚';
      case 'OFFER':
        return '💰';
      case 'FEEDBACK':
        return '⭐';
      case 'SYSTEM':
        return '🔔';
      default:
        return '🔔';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'ORDER':
        return '#667eea';
      case 'PAYMENT':
        return '#10b981';
      case 'DELIVERY':
        return '#f59e0b';
      case 'OFFER':
        return '#ef4444';
      case 'FEEDBACK':
        return '#8b5cf6';
      case 'SYSTEM':
        return '#6366f1';
      default:
        return '#94a3b8';
    }
  };

  const getActionText = (type) => {
    switch (type) {
      case 'ORDER':
        return 'View Order';
      case 'PAYMENT':
        return 'View Details';
      case 'DELIVERY':
        return 'Track Order';
      case 'OFFER':
        return 'Shop Now';
      case 'FEEDBACK':
        return 'Leave Review';
      default:
        return 'View Details';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }
    
    if (onClose) onClose();
    
    // Navigate based on notification type and reference_id
    if (notification.reference_id) {
      switch (notification.type) {
        case 'ORDER':
          navigate(`/orders/${notification.reference_id}`);
          break;
        case 'PAYMENT':
          navigate(`/payments/${notification.reference_id}`);
          break;
        default:
          navigate('/notifications');
      }
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    await deleteNotification(notification.notification_id);
    setIsDeleting(false);
  };

  const handleAction = (e) => {
    e.stopPropagation();
    if (onClose) onClose();
    
    switch (notification.type) {
      case 'ORDER':
        navigate(`/orders/${notification.reference_id || ''}`);
        break;
      case 'DELIVERY':
        navigate(`/tracking/${notification.reference_id || ''}`);
        break;
      case 'OFFER':
        navigate('/products');
        break;
      default:
        navigate('/notifications');
    }
  };

  return (
    <div 
      className={`notification-card ${compact ? 'compact' : ''} ${notification.is_read ? 'read' : 'unread'}`}
      onClick={handleClick}
    >
      <div className="card-content">
        <div 
          className="notification-icon"
          style={{ backgroundColor: `${getIconColor(notification.type)}15` }}
        >
          <span style={{ color: getIconColor(notification.type) }}>
            {getIcon(notification.type)}
          </span>
        </div>
        
        <div className="notification-info">
          <div className="notification-header">
            <h4 className="notification-title">{notification.title}</h4>
            {!notification.is_read && <span className="unread-indicator"></span>}
          </div>
          
          <p className="notification-message">
            {compact && notification.message.length > 60 
              ? `${notification.message.substring(0, 60)}...` 
              : notification.message}
          </p>
          
          <div className="notification-footer">
            <span className="notification-time">
              {formatTime(notification.created_at)}
            </span>
            
            {!compact && (
              <button 
                className="notification-action-btn"
                onClick={handleAction}
              >
                {getActionText(notification.type)}
              </button>
            )}
          </div>
        </div>
        
        <button 
          className={`delete-btn ${isDeleting ? 'deleting' : ''}`}
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Delete notification"
        >
          {isDeleting ? (
            <div className="delete-spinner"></div>
          ) : (
            <i className="fas fa-times"></i>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationCard;