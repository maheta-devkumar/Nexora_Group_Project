import React, { useEffect, useCallback } from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import QuickMetricsGrid from './QuickMetricsGrid';
import RecentActivityFeed from './RecentActivityFeed';
import './SystemDashboard.css'; // Added CSS import
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { FaUserCheck, FaServer, FaBell, FaChartLine } from 'react-icons/fa';

const SystemDashboard = () => {
  const {
    fetchAllSystemData,
    dashboard,
    userAccess,
    sessions,
    systemHealth,
    notifications,
    loading,
    error,
    clearError
  } = useSystemContext();

  const handleRefresh = useCallback(() => {
    fetchAllSystemData();
  }, [fetchAllSystemData]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  if (loading && !dashboard && !userAccess.activeUsersCount) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiAlertCircle className="text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={clearError} className="text-red-600 hover:text-red-800">
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="system-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring and analytics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Quick Metrics */}
      <QuickMetricsGrid />

      {/* Dashboard Overview */}
      <div className="dashboard-overview">
        {/* System Health Status */}
        <div className="dashboard-overview-card">
          <div className="dashboard-overview-card-header">
            <h3>System Health</h3>
            <div className={`dashboard-status-badge ${systemHealth?.healthStatus?.overall_status?.toLowerCase() || 'loading'}`}>
              {systemHealth?.healthStatus?.overall_status || 'LOADING'}
            </div>
          </div>
          
          {systemHealth?.healthStatus?.components && (
            <div className="dashboard-health-components">
              {Object.entries(systemHealth.healthStatus.components).map(([component, status]) => (
                <div key={component} className="dashboard-health-item">
                  <span className="dashboard-health-item-name">{component.replace('_', ' ')}</span>
                  <span className={`dashboard-health-item-status ${status?.toLowerCase() || 'unknown'}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Activity */}
        <div className="dashboard-overview-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Activity</h3>
          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card blue">
              <div className="dashboard-stat-icon">
                <FaUserCheck className="text-blue-600 text-2xl" />
              </div>
              <div className="dashboard-stat-value">
                {userAccess.activeUsersCount?.active_users || userAccess.activeUsersCount?.count || 0}
              </div>
              <p className="dashboard-stat-label">Active Users</p>
            </div>
            
            <div className="dashboard-stat-card green">
              <div className="dashboard-stat-icon">
                <FaServer className="text-green-600 text-2xl" />
              </div>
              <div className="dashboard-stat-value">
                {Array.isArray(sessions.activeSessions) ? sessions.activeSessions.length : 0}
              </div>
              <p className="dashboard-stat-label">Active Sessions</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="dashboard-overview-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
          <div className="dashboard-performance-metrics">
            <div className="dashboard-performance-item">
              <span className="dashboard-performance-label">Unread Notifications</span>
              <span className="dashboard-performance-value">
                {notifications.unreadCount?.count || notifications.unreadCount?.unread_count || 0}
              </span>
            </div>
            <div className="dashboard-performance-item">
              <span className="dashboard-performance-label">Delivery Rate</span>
              <span className="dashboard-performance-value">
                {notifications.deliverySummary?.success_rate 
                  ? `${Math.round(notifications.deliverySummary.success_rate)}%`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="dashboard-overview-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
          <div className="dashboard-performance-metrics">
            <div className="dashboard-performance-item">
              <span className="dashboard-performance-label">API Response Time</span>
              <span className="dashboard-performance-value">
                {systemHealth?.apiUsageOverview?.avg_response_time 
                  ? `${systemHealth.apiUsageOverview.avg_response_time}ms`
                  : systemHealth?.apiUsageOverview?.average_response_time
                  ? `${systemHealth.apiUsageOverview.average_response_time}ms`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="dashboard-performance-item">
              <span className="dashboard-performance-label">Request Count</span>
              <span className="dashboard-performance-value">
                {systemHealth?.apiUsageOverview?.total_requests || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <RecentActivityFeed />
    </div>
  );
};

export default SystemDashboard;