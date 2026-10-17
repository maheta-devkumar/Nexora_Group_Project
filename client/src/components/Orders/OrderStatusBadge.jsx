import React from 'react';
import './OrderStatusBadge.css';

const OrderStatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      placed: {
        label: 'Placed',
        color: '#fdcb6e',
        bgColor: 'rgba(253, 203, 110, 0.1)',
        icon: 'fas fa-clock'
      },
      processing: {
        label: 'Processing',
        color: '#fdcb6e',
        bgColor: 'rgba(253, 203, 110, 0.1)',
        icon: 'fas fa-cog'
      },
      shipped: {
        label: 'Shipped',
        color: '#74b9ff',
        bgColor: 'rgba(116, 185, 255, 0.1)',
        icon: 'fas fa-shipping-fast'
      },
      delivered: {
        label: 'Delivered',
        color: '#00b894',
        bgColor: 'rgba(0, 184, 148, 0.1)',
        icon: 'fas fa-check-circle'
      },
      cancelled: {
        label: 'Cancelled',
        color: '#e74c3c',
        bgColor: 'rgba(231, 76, 60, 0.1)',
        icon: 'fas fa-times-circle'
      }
    };
    return configs[status] || configs.placed;
  };

  const config = getStatusConfig(status);

  return (
    <div 
      className="order-status-badge"
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.color
      }}
    >
      <i className={config.icon}></i>
      {config.label}
    </div>
  );
};

export default OrderStatusBadge;