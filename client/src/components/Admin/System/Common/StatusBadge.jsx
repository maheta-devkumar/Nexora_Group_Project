import React from 'react';
import './StatusBadge.css'; // Added CSS import
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiXCircle, 
  FiClock,
  FiActivity,
  FiAlertTriangle
} from 'react-icons/fi';

const StatusBadge = ({ 
  status, 
  size = 'md',
  showIcon = true,
  showText = true,
  className = ''
}) => {
  const config = {
    healthy: {
      color: 'healthy',
      icon: <FiCheckCircle />,
      label: 'Healthy'
    },
    active: {
      color: 'active',
      icon: <FiCheckCircle />,
      label: 'Active'
    },
    success: {
      color: 'success',
      icon: <FiCheckCircle />,
      label: 'Success'
    },
    warning: {
      color: 'warning',
      icon: <FiAlertTriangle />,
      label: 'Warning'
    },
    degraded: {
      color: 'degraded',
      icon: <FiAlertTriangle />,
      label: 'Degraded'
    },
    pending: {
      color: 'pending',
      icon: <FiClock />,
      label: 'Pending'
    },
    inactive: {
      color: 'inactive',
      icon: <FiClock />,
      label: 'Inactive'
    },
    error: {
      color: 'error',
      icon: <FiXCircle />,
      label: 'Error'
    },
    critical: {
      color: 'critical',
      icon: <FiAlertCircle />,
      label: 'Critical'
    },
    unhealthy: {
      color: 'unhealthy',
      icon: <FiAlertCircle />,
      label: 'Unhealthy'
    },
    processing: {
      color: 'processing',
      icon: <FiActivity />,
      label: 'Processing'
    },
    default: {
      color: 'default',
      icon: <FiActivity />,
      label: 'Unknown'
    }
  };

  const statusKey = status?.toLowerCase() || 'default';
  const statusConfig = config[statusKey] || config.default;

  const sizeClasses = {
    sm: 'sm',
    md: 'md',
    lg: 'lg'
  };

  const badgeClass = `status-badge ${sizeClasses[size]} ${statusConfig.color} ${className} ${!showText ? 'icon-only' : ''} ${!showIcon ? 'text-only' : ''}`;

  return (
    <span className={badgeClass}>
      {showIcon && <span className="icon">{statusConfig.icon}</span>}
      {showText && statusConfig.label}
    </span>
  );
};

export default StatusBadge;