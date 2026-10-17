import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, Bell } from 'lucide-react';
import './Widgets.css';

const SystemAlerts = ({ alerts = [], isLoading = false }) => {
  const [dismissed, setDismissed] = useState([]);

  const alertsToDisplay = alerts && alerts.length ? alerts.slice(0, 5) : [
    { id: 1, message: 'System backup completed successfully', created_at: new Date().toISOString(), severity: 'success' },
    { id: 2, message: 'Payment gateway API response slow', created_at: new Date(Date.now() - 3600000).toISOString(), severity: 'warning' },
    { id: 3, message: 'New user registered: john@example.com', created_at: new Date(Date.now() - 7200000).toISOString(), severity: 'info' },
    { id: 4, message: 'Order #1001 completed successfully', created_at: new Date(Date.now() - 10800000).toISOString(), severity: 'success' },
    { id: 5, message: 'Database connection optimized', created_at: new Date(Date.now() - 14400000).toISOString(), severity: 'info' },
  ];

  const activeAlerts = alertsToDisplay.filter(alert => !dismissed.includes(alert.id));

  const iconForSeverity = (severity) => {
    const sev = (severity || 'info').toLowerCase();
    switch (sev) {
      case 'success':
        return <CheckCircle size={16} className="alert-icon success" />;
      case 'error':
      case 'danger':
        return <XCircle size={16} className="alert-icon error" />;
      case 'warning':
        return <AlertCircle size={16} className="alert-icon warning" />;
      default:
        return <Info size={16} className="alert-icon info" />;
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return dateString || '—';
    }
  };

  if (isLoading) {
    return (
      <div className="widget-card system-alerts-widget">
        <div className="widget-header">
          <h3 className="widget-title">System Alerts</h3>
        </div>
        <div className="widget-content">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="system-alert skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card system-alerts-widget">
      <div className="widget-header">
        <div className="header-title">
          <Bell size={20} />
          <h3 className="widget-title">System Alerts</h3>
        </div>
        {activeAlerts.length > 0 && (
          <span className="alert-count">{activeAlerts.length}</span>
        )}
      </div>
      
      <div className="widget-content">
        {activeAlerts.length === 0 ? (
          <div className="empty-state success-state">
            <CheckCircle size={48} className="success" />
            <p>All systems operational</p>
          </div>
        ) : (
          <div className="alerts-list">
            {activeAlerts.map(alert => (
              <div 
                className={`system-alert ${alert.severity || 'info'}`} 
                key={alert.id}
              >
                <div className="alert-content">
                  {iconForSeverity(alert.severity)}
                  <div className="alert-message">
                    <p>{alert.message}</p>
                    <span className="alert-time">
                      {formatTime(alert.created_at)}
                    </span>
                  </div>
                </div>
                <button 
                  className="dismiss-btn"
                  onClick={() => setDismissed(prev => [...prev, alert.id])}
                  title="Dismiss alert"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {activeAlerts.length > 0 && (
        <div className="widget-footer">
          <button 
            className="dismiss-all-btn"
            onClick={() => setDismissed(activeAlerts.map(a => a.id))}
          >
            Dismiss All
          </button>
        </div>
      )}
    </div>
  );
};

export default SystemAlerts;