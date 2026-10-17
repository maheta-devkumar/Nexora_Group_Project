import React from 'react';
import './SystemCard.css'; // Added CSS import
import { FiAlertCircle, FiInfo } from 'react-icons/fi';

const SystemCard = ({ 
  title, 
  children, 
  icon, 
  status, 
  loading = false,
  error = null,
  className = '',
  onRefresh,
  actions
}) => {
  const getStatusColor = (status) => {
    if (!status) return 'border-gray-200 bg-white';
    
    switch(status.toLowerCase()) {
      case 'success':
      case 'healthy':
        return 'border-success bg-healthy';
      case 'warning':
      case 'degraded':
        return 'border-warning bg-degraded';
      case 'error':
      case 'critical':
      case 'unhealthy':
        return 'border-error bg-unhealthy';
      default:
        return 'border-default bg-white';
    }
  };

  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch(status.toLowerCase()) {
      case 'success':
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'critical':
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`system-card ${getStatusColor(status)} ${className}`}>
      {/* Header */}
      <div className="system-card-header">
        <div className="system-card-title">
          {icon && (
            <div className="system-card-icon">
              {icon}
            </div>
          )}
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {status && (
            <span className={`system-card-status ${status.toLowerCase()}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>
        
        <div className="system-card-actions">
          {actions}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className={`system-card-refresh-btn ${loading ? 'loading' : ''}`}
              title="Refresh"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              ) : (
                '↻'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="system-card-content">
        {error ? (
          <div className="system-card-error">
            <FiAlertCircle className="icon" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        ) : loading ? (
          <div className="system-card-loading">
            <div className="spinner"></div>
          </div>
        ) : children ? (
          children
        ) : (
          <div className="system-card-empty">
            <FiInfo className="icon" />
            <p>No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemCard;