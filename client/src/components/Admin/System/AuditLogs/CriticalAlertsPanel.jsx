import React from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import './CriticalAlertsPanel.css'; // Added CSS import
import { FiAlertTriangle, FiClock, FiUser, FiActivity } from 'react-icons/fi';

const CriticalAlertsPanel = () => {
  const { adminLogs } = useSystemContext();

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 60) {
        return `${diffMins} minutes ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'N/A';
    }
  };

  const criticalActions = Array.isArray(adminLogs.criticalAdminActions) ? adminLogs.criticalAdminActions : [];

  if (criticalActions.length === 0) {
    return null;
  }

  return (
    <div className="critical-alerts-panel">
      <div className="critical-alerts-header">
        <div className="flex items-center">
          <FiAlertTriangle className="critical-alert-icon mr-2" />
          <h3 className="critical-alerts-header">Critical Actions Alert</h3>
          <span className="critical-alerts-count">
            {criticalActions.length} Critical
          </span>
        </div>
        <p className="critical-alerts-description">
          These actions require immediate attention and review
        </p>
      </div>

      <div className="critical-alerts-list">
        {criticalActions.slice(0, 5).map((action, index) => (
          <div key={index} className="critical-alert-item">
            <div className="critical-alert-content">
              <div className="critical-alert-icon">
                <FiAlertTriangle />
              </div>
              <div className="critical-alert-details">
                <div className="critical-alert-header">
                  <p className="critical-alert-title">
                    {action.action_description || action.description || 'Critical Action'}
                  </p>
                  <span className="critical-alert-time">
                    {formatTime(action.timestamp || action.created_at)}
                  </span>
                </div>
                <div className="critical-alert-meta">
                  <FiUser className="mr-1" size={14} />
                  <span className="font-medium">{action.admin_name || action.admin_username || 'Unknown Admin'}</span>
                  <span className="mx-2">•</span>
                  <FiActivity className="mr-1" size={14} />
                  <span className="capitalize">{action.action_type || 'action'}</span>
                  {action.resource_type && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{action.resource_type}</span>
                    </>
                  )}
                </div>
                {action.ip_address && (
                  <div className="mt-1 text-xs text-red-600">
                    IP: {action.ip_address}
                  </div>
                )}
                {action.reason && (
                  <div className="critical-alert-reason">
                    <p>Reason: {action.reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {criticalActions.length > 5 && (
        <div className="critical-alerts-footer">
          <button className="text-red-700 hover:text-red-900 text-sm font-medium transition-colors">
            View All {criticalActions.length} Critical Actions →
          </button>
        </div>
      )}
    </div>
  );
};

export default CriticalAlertsPanel;