import React, { useEffect, useCallback } from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import { 
  FiBell, 
  FiCheckCircle, 
  FiXCircle, 
  FiSend,
  FiRefreshCw,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import './NotificationsView.css';

const NotificationsView = () => {
  const {
    fetchNotificationDeliverySummary,
    fetchUnreadNotificationsCount,
    notifications,
    loading,
    error,
    clearError
  } = useSystemContext();

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchNotificationDeliverySummary(),
        fetchUnreadNotificationsCount()
      ]);
    } catch (err) {
      console.error('Error loading notification data:', err);
    }
  }, [fetchNotificationDeliverySummary, fetchUnreadNotificationsCount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = notifications.deliverySummary;
  const unreadCount = notifications.unreadCount;

  const getStatusIcon = (status) => {
    if (!status) return <FiBell className="text-gray-500" />;
    
    switch(status.toLowerCase()) {
      case 'delivered': return <FiCheckCircle className="notifications-status-icon delivered" />;
      case 'failed': return <FiXCircle className="notifications-status-icon failed" />;
      case 'pending': return <FiSend className="notifications-status-icon pending" />;
      default: return <FiBell className="notifications-status-icon default" />;
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <FiTrendingUp className="text-green-500" />;
    if (trend < 0) return <FiTrendingDown className="text-red-500" />;
    return null;
  };

  return (
    <div className="notifications-container">
      {/* Header */}
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Monitor notification delivery and status</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="notifications-error">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiXCircle className="text-red-500 mr-2" />
              <span>{error}</span>
            </div>
            <button onClick={clearError} className="text-red-600 hover:text-red-800">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="notifications-overview">
        {/* Unread Notifications */}
        <div className="notifications-card">
          <div className="notifications-card-header">
            <div className="notifications-card-icon blue">
              <FiBell className="text-blue-600 text-2xl" />
            </div>
            <div className="notifications-card-title">
              <h3>Unread</h3>
              <p>Require attention</p>
            </div>
          </div>
          <div className="notifications-card-value">
            {unreadCount?.count || unreadCount?.unread_count || 0}
          </div>
          {unreadCount?.trend !== undefined && (
            <div className={`notifications-card-trend ${unreadCount.trend > 0 ? 'negative' : 'positive'}`}>
              {getTrendIcon(unreadCount.trend)}
              <span className="ml-1">
                {unreadCount.trend > 0 ? '+' : ''}{unreadCount.trend}%
              </span>
            </div>
          )}
        </div>

        {/* Success Rate */}
        <div className="notifications-card">
          <div className="notifications-card-header">
            <div className="notifications-card-icon green">
              <FiCheckCircle className="text-green-600 text-2xl" />
            </div>
            <div className="notifications-card-title">
              <h3>Success Rate</h3>
              <p>Delivery success</p>
            </div>
          </div>
          <div className="notifications-card-value">
            {summary?.success_rate 
              ? `${Math.round(summary.success_rate)}%`
              : 'N/A'
            }
          </div>
          <div className="notifications-progress">
            <div 
              className="notifications-progress-fill"
              style={{ width: `${summary?.success_rate || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Total Sent */}
        <div className="notifications-card">
          <div className="notifications-card-header">
            <div className="notifications-card-icon purple">
              <FiSend className="text-purple-600 text-2xl" />
            </div>
            <div className="notifications-card-title">
              <h3>Total Sent</h3>
              <p>Last 7 days</p>
            </div>
          </div>
          <div className="notifications-card-value">
            {(summary?.total_sent || 0).toLocaleString()}
          </div>
        </div>

        {/* Avg Delivery Time */}
        <div className="notifications-card">
          <div className="notifications-card-header">
            <div className="notifications-card-icon orange">
              <FiBarChart2 className="text-orange-600 text-2xl" />
            </div>
            <div className="notifications-card-title">
              <h3>Avg. Delivery</h3>
              <p>Time to deliver</p>
            </div>
          </div>
          <div className="notifications-card-value">
            {summary?.avg_delivery_time 
              ? `${summary.avg_delivery_time}s`
              : 'N/A'
            }
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      {summary && (
        <div className="notifications-details">
          {/* Delivery Status Breakdown */}
          {summary.delivery_breakdown && summary.delivery_breakdown.length > 0 && (
            <div className="notifications-section">
              <h3>Delivery Status</h3>
              <div className="notifications-status-list">
                {summary.delivery_breakdown.map((status, index) => (
                  <div key={index} className="notifications-status-item">
                    <div className="notifications-status-info">
                      {getStatusIcon(status.status)}
                      <span className="notifications-status-name">
                        {status.status || 'unknown'}
                      </span>
                    </div>
                    <div className="notifications-status-stats">
                      <div className="notifications-status-count">
                        {(status.count || 0).toLocaleString()}
                      </div>
                      <div className="notifications-status-percentage">
                        {summary.total_sent ? Math.round((status.count / summary.total_sent) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel Performance */}
          {summary.channel_performance && summary.channel_performance.length > 0 && (
            <div className="notifications-section">
              <h3>Channel Performance</h3>
              <div className="notifications-channel-list">
                {summary.channel_performance.map((channel, index) => (
                  <div key={index} className="notifications-channel-item">
                    <div className="notifications-channel-header">
                      <span className="notifications-channel-name">
                        {channel.channel || 'unknown'}
                      </span>
                      <span className="notifications-channel-rate">
                        {channel.success_rate ? `${Math.round(channel.success_rate)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="notifications-channel-progress">
                      <div 
                        className="notifications-channel-progress-fill"
                        style={{ width: `${channel.success_rate || 0}%` }}
                      ></div>
                    </div>
                    <div className="notifications-channel-stats">
                      <span>Sent: {(channel.sent || 0).toLocaleString()}</span>
                      <span>Delivered: {(channel.delivered || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Notifications */}
      {summary?.recent_notifications && summary.recent_notifications.length > 0 && (
        <div className="notifications-section">
          <div className="p-6 border-b border-gray-200">
            <h3>Recent Notifications</h3>
          </div>
          <ul className="notifications-recent-list">
            {summary.recent_notifications.slice(0, 10).map((notification, index) => (
              <li key={index} className="notifications-recent-item">
                <div className="notifications-recent-header">
                  <div className="notifications-recent-icon">
                    {getStatusIcon(notification.status)}
                  </div>
                  <p className="notifications-recent-title">
                    {notification.title || 'Notification'}
                  </p>
                  <span className="notifications-recent-time">
                    {notification.sent_at ? new Date(notification.sent_at).toLocaleString() : 'Unknown time'}
                  </span>
                </div>
                <p className="notifications-recent-message">
                  {notification.message || 'No message'}
                </p>
                <div className="notifications-recent-meta">
                  <span className="capitalize">{notification.channel || 'unknown'}</span>
                  <span>•</span>
                  <span>To: {notification.recipient_count || 0} users</span>
                  {notification.status === 'failed' && notification.error && (
                    <>
                      <span>•</span>
                      <span className="notifications-recent-error">Error: {notification.error}</span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;