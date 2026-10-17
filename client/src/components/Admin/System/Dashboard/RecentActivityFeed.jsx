import React, { useEffect } from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import './RecentActivityFeed.css'; // Added CSS import
import { FiUser, FiCalendar, FiActivity, FiAlertCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const RecentActivityFeed = () => {
  const {
    fetchRecentAdminActions,
    adminLogs,
    loading
  } = useSystemContext();

  useEffect(() => {
    const loadData = async () => {
      await fetchRecentAdminActions(24); // Last 24 hours
    };
    loadData();
  }, [fetchRecentAdminActions]);

  const getActionIcon = (actionType) => {
    if (!actionType) return <FiActivity className="recent-activity-icon default" />;
    
    switch (actionType.toLowerCase()) {
      case 'create':
        return <FiCheckCircle className="recent-activity-icon create" />;
      case 'update':
        return <FiActivity className="recent-activity-icon update" />;
      case 'delete':
        return <FiXCircle className="recent-activity-icon delete" />;
      case 'critical':
        return <FiAlertCircle className="recent-activity-icon critical" />;
      default:
        return <FiActivity className="recent-activity-icon default" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 60) {
        return `${diffMins} min ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hr ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'N/A';
    }
  };

  const activities = adminLogs.recentAdminActions?.actions || 
                    adminLogs.recentAdminActions?.logs || 
                    adminLogs.recentAdminActions || 
                    [];

  return (
    <div className="recent-activity-feed">
      <div className="recent-activity-header">
        <h3>Recent Admin Activity</h3>
        <p>Last 24 hours of system activities</p>
      </div>
      
      <div className="recent-activity-list">
        {loading ? (
          <div className="recent-activity-loading">
            <div className="spinner"></div>
            <p className="mt-2 text-gray-600">Loading activities...</p>
          </div>
        ) : !activities.length ? (
          <div className="recent-activity-empty">
            <p className="text-gray-500">No recent activities found</p>
          </div>
        ) : (
          activities.slice(0, 10).map((activity, index) => (
            <div key={index} className="recent-activity-item">
              <div className="recent-activity-content">
                <div className="recent-activity-icon">
                  {getActionIcon(activity.action_type)}
                </div>
                <div className="recent-activity-details">
                  <div className="recent-activity-header-row">
                    <p className="recent-activity-title">
                      {activity.action_description || activity.description || 'Action performed'}
                    </p>
                    <span className="recent-activity-time">
                      {formatTime(activity.timestamp || activity.created_at)}
                    </span>
                  </div>
                  <div className="recent-activity-meta">
                    <div className="recent-activity-meta-item">
                      <FiUser className="icon" />
                      <span className="font-medium">{activity.admin_name || activity.admin_username || 'Unknown Admin'}</span>
                    </div>
                    <span className="mx-2">•</span>
                    <div className="recent-activity-meta-item">
                      <span className="capitalize">{activity.action_type || 'action'}</span>
                    </div>
                    {activity.resource_type && (
                      <>
                        <span className="mx-2">•</span>
                        <div className="recent-activity-meta-item">
                          <span>{activity.resource_type}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {activity.ip_address && (
                    <div className="recent-activity-ip">
                      IP: {activity.ip_address}
                      {activity.user_agent && (
                        <>
                          <span className="mx-2">•</span>
                          Device: {activity.user_agent}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length > 10 && (
        <div className="recent-activity-footer">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All Activities →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivityFeed;