import React from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import './QuickMetricsGrid.css'; // Added CSS import
import { 
  FiUsers, 
  FiActivity, 
  FiServer, 
  FiBell, 
  FiShield, 
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';

const QuickMetricsGrid = () => {
  const {
    userAccess,
    sessions,
    systemHealth,
    notifications,
    adminLogs
  } = useSystemContext();

  const metrics = [
    {
      title: 'Active Users',
      value: userAccess.activeUsersCount?.active_users || userAccess.activeUsersCount?.count || 0,
      icon: <FiUsers />,
      color: 'blue'
    },
    {
      title: 'Active Sessions',
      value: Array.isArray(sessions.activeSessions) ? sessions.activeSessions.length : 0,
      icon: <FiActivity />,
      color: 'green'
    },
    {
      title: 'System Health',
      value: systemHealth?.healthStatus?.overall_status || 'LOADING',
      icon: <FiServer />,
      status: true,
      color: 'purple'
    },
    {
      title: 'Unread Notifications',
      value: notifications.unreadCount?.count || notifications.unreadCount?.unread_count || 0,
      icon: <FiBell />,
      color: 'yellow'
    },
    {
      title: 'Critical Actions (7d)',
      value: Array.isArray(adminLogs.criticalAdminActions) ? adminLogs.criticalAdminActions.length : 0,
      icon: <FiAlertTriangle />,
      color: 'red'
    },
    {
      title: 'Failed Operations',
      value: systemHealth?.failedOperationsSummary?.total_failed || systemHealth?.failedOperationsSummary?.count || 0,
      icon: <FiShield />,
      color: 'orange'
    }
  ];

  return (
    <div className="quick-metrics-grid columns-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`quick-metric-card ${metric.color}`}
        >
          <div className="quick-metric-header">
            <div className={`quick-metric-icon ${metric.color}`}>
              {metric.icon}
            </div>
          </div>
          
          <div className="quick-metric-content">
            <div className="quick-metric-value">
              {typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
            </div>
            <p className="quick-metric-title">{metric.title}</p>
          </div>
          
          {metric.status && (
            <div className="quick-metric-status">
              <div className="quick-metric-progress">
                <div 
                  className={`quick-metric-progress-fill ${metric.color}`}
                  style={{ width: '85%' }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuickMetricsGrid;