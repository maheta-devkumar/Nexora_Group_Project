import React, { useState } from 'react';
import {
  Package,
  DollarSign,
  Star,
  Bell,
  MessageSquare,
  CheckCircle,
  Trash2,
  Clock,
  ExternalLink,
  AlertCircle,
  ChevronRight,
  MapPin,
  Truck,
  Wallet,
  Award,
  Info
} from 'lucide-react';
import './NotificationCard.css';

const NotificationCard = ({ notification, onDelete, onMarkAsRead }) => {
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get notification icon based on type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'delivery':
        return <Package size={20} />;
      case 'payment':
        return <DollarSign size={20} />;
      case 'rating':
        return <Star size={20} />;
      case 'system':
        return <Bell size={20} />;
      default:
        return <MessageSquare size={20} />;
    }
  };

  // Get notification type label
  const getNotificationTypeLabel = () => {
    switch (notification.type) {
      case 'delivery':
        return 'Delivery Update';
      case 'payment':
        return 'Payment';
      case 'rating':
        return 'Rating';
      case 'system':
        return 'System';
      default:
        return 'Notification';
    }
  };

  // Get notification color based on type and status
  const getNotificationColor = () => {
    if (!notification.is_read) {
      return 'var(--notification-unread-bg)';
    }
    switch (notification.type) {
      case 'delivery':
        return 'var(--notification-delivery-bg)';
      case 'payment':
        return 'var(--notification-payment-bg)';
      case 'rating':
        return 'var(--notification-rating-bg)';
      case 'system':
        return 'var(--notification-system-bg)';
      default:
        return 'var(--notification-default-bg)';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
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
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle mark as read
  const handleMarkAsRead = async () => {
    if (onMarkAsRead && !notification.is_read) {
      try {
        await onMarkAsRead(notification.notification_id);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      setIsDeleting(true);
      try {
        if (onDelete) {
          await onDelete(notification.notification_id);
        }
      } catch (error) {
        console.error('Failed to delete notification:', error);
        setIsDeleting(false);
      }
    }
  };

  // Get priority level
  const getPriority = () => {
    if (notification.priority) return notification.priority;
    
    // Determine priority based on type and content
    if (notification.type === 'delivery') {
      if (notification.message?.toLowerCase().includes('urgent') || 
          notification.message?.toLowerCase().includes('important')) {
        return 'high';
      }
      return 'medium';
    }
    if (notification.type === 'payment') return 'medium';
    if (notification.type === 'system') return 'low';
    return 'low';
  };

  // Get action button based on notification type
  const getActionButton = () => {
    if (!notification.action_url && !notification.action_text) return null;

    const handleAction = () => {
      if (notification.action_url) {
        window.open(notification.action_url, '_blank');
      }
      // Mark as read when action is taken
      if (!notification.is_read) {
        handleMarkAsRead();
      }
    };

    return (
      <button 
        className="action-button"
        onClick={handleAction}
        disabled={isDeleting}
      >
        {notification.action_text || 'View Details'}
        <ChevronRight size={14} />
      </button>
    );
  };

  // Get metadata display
  const renderMetadata = () => {
    if (!notification.metadata) return null;

    const metadata = notification.metadata;
    
    return (
      <div className="notification-metadata">
        {metadata.order_id && (
          <div className="metadata-item">
            <Truck size={14} />
            <span>Order #{metadata.order_id}</span>
          </div>
        )}
        {metadata.amount && (
          <div className="metadata-item">
            <Wallet size={14} />
            <span>₹{metadata.amount}</span>
          </div>
        )}
        {metadata.rating && (
          <div className="metadata-item">
            <Award size={14} />
            <span>{metadata.rating}★</span>
          </div>
        )}
        {metadata.location && (
          <div className="metadata-item">
            <MapPin size={14} />
            <span>{metadata.location}</span>
          </div>
        )}
        {metadata.estimated_time && (
          <div className="metadata-item">
            <Clock size={14} />
            <span>ETA: {metadata.estimated_time}</span>
          </div>
        )}
      </div>
    );
  };

  // Get priority badge
  const renderPriorityBadge = () => {
    const priority = getPriority();
    
    if (priority === 'low') return null;

    return (
      <span className={`priority-badge priority-${priority}`}>
        {priority === 'high' ? 'High Priority' : 'Medium Priority'}
      </span>
    );
  };

  return (
    <div 
      className={`notification-card ${notification.is_read ? 'read' : 'unread'} ${expanded ? 'expanded' : ''}`}
      style={{ borderLeftColor: getNotificationColor() }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="unread-indicator" style={{ backgroundColor: getNotificationColor() }}></div>
      )}

      {/* Main content */}
      <div className="notification-main">
        <div className="notification-icon-container">
          <div 
            className="notification-icon"
            style={{ backgroundColor: getNotificationColor() }}
          >
            {getNotificationIcon()}
          </div>
        </div>

        <div className="notification-content">
          <div className="notification-header">
            <div className="notification-title-section">
              <h4 className="notification-title">{notification.message}</h4>
              {renderPriorityBadge()}
            </div>
            
            <div className="notification-time">
              <Clock size={14} />
              <span>{formatDate(notification.created_at)}</span>
              <span className="time-detail"> • {formatTime(notification.created_at)}</span>
            </div>
          </div>

          <div className="notification-type">
            <span className="type-label">{getNotificationTypeLabel()}</span>
          </div>

          {notification.description && (
            <p className="notification-description">
              {notification.description}
            </p>
          )}

          {renderMetadata()}

          {/* Expanded content */}
          {expanded && notification.details && (
            <div className="notification-details">
              <div className="details-header">
                <Info size={16} />
                <span>Details</span>
              </div>
              <p>{notification.details}</p>
            </div>
          )}

          {/* Action button */}
          {getActionButton()}
        </div>
      </div>

      {/* Actions */}
      <div className="notification-actions" onClick={(e) => e.stopPropagation()}>
        {!notification.is_read && (
          <button 
            className="action-btn mark-read"
            onClick={handleMarkAsRead}
            title="Mark as read"
            disabled={isDeleting}
          >
            <CheckCircle size={18} />
          </button>
        )}
        
        <button 
          className="action-btn delete"
          onClick={handleDelete}
          title="Delete notification"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <div className="spinner-small"></div>
          ) : (
            <Trash2 size={18} />
          )}
        </button>
        
        <button 
          className="action-btn expand"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          <ChevronRight size={18} className={expanded ? 'expanded' : ''} />
        </button>
      </div>
    </div>
  );
};

export default NotificationCard;