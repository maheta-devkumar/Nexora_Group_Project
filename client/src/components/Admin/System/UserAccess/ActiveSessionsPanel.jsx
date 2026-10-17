import React from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import { FiMonitor, FiSmartphone, FiTablet, FiClock, FiMapPin } from 'react-icons/fi';
import './ActiveSessionsPanel.css';

const ActiveSessionsPanel = () => {
  const { sessions, loading } = useSystemContext();

  const getDeviceIcon = (deviceType) => {
    if (!deviceType) return <FiMonitor className="text-gray-500" />;
    
    switch(deviceType.toLowerCase()) {
      case 'desktop': return <FiMonitor className="active-sessions-device desktop" />;
      case 'mobile': return <FiSmartphone className="active-sessions-device mobile" />;
      case 'tablet': return <FiTablet className="active-sessions-device tablet" />;
      default: return <FiMonitor className="active-sessions-device" />;
    }
  };

  const formatDuration = (startTime) => {
    if (!startTime) return 'N/A';
    try {
      const start = new Date(startTime);
      const now = new Date();
      const diffMs = now - start;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffHours > 0) {
        return `${diffHours}h ${diffMins % 60}m`;
      }
      return `${diffMins}m`;
    } catch (error) {
      return 'N/A';
    }
  };

  const activeSessions = Array.isArray(sessions.activeSessions) ? sessions.activeSessions : [];

  return (
    <div className="active-sessions-panel">
      <div className="active-sessions-header">
        <h3>Active Sessions</h3>
        <p>Real-time user sessions across the system</p>
      </div>
      
      <ul className="active-sessions-list">
        {loading ? (
          <div className="active-sessions-loading">
            <div className="spinner"></div>
            <p>Loading sessions...</p>
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="active-sessions-empty">
            <p>No active sessions found</p>
          </div>
        ) : (
          activeSessions.map((session, index) => (
            <li key={index} className="active-sessions-item">
              <div className="active-sessions-content">
                <div className="active-sessions-info">
                  <div className="active-sessions-device">
                    {getDeviceIcon(session.device_type)}
                  </div>
                  <div className="active-sessions-details">
                    <h4>
                      {session.username || session.user_name || 'Unknown User'}
                      <span className="active-sessions-role">
                        {session.role || 'User'}
                      </span>
                    </h4>
                    <div className="active-sessions-meta">
                      <div className="active-sessions-meta-item">
                        <FiClock className="icon" />
                        <span>{formatDuration(session.session_start || session.created_at)} active</span>
                      </div>
                      {session.ip_address && (
                        <>
                          <span>•</span>
                          <div className="active-sessions-meta-item">
                            <FiMapPin className="icon" />
                            <span>{session.ip_address}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="active-sessions-connection">
                  <div className="active-sessions-device-type">
                    {session.device_type || 'Device'}
                  </div>
                  <div className="active-sessions-browser">
                    {session.browser || 'Browser'} • {session.os || 'OS'}
                  </div>
                </div>
              </div>
              
              {session.location && (
                <div className="active-sessions-location">
                  Location: {session.location.city}, {session.location.country}
                  {session.location.isp && ` • ${session.location.isp}`}
                </div>
              )}
            </li>
          ))
        )}
      </ul>
      
      {activeSessions.length > 0 && (
        <div className="active-sessions-footer">
          <span className="active-sessions-count">
            Showing {activeSessions.length} active session{activeSessions.length !== 1 ? 's' : ''}
          </span>
          <button className="active-sessions-view-all">
            View All Sessions →
          </button>
        </div>
      )}
    </div>
  );
};

export default ActiveSessionsPanel;