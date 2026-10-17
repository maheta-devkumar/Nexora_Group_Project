import React from 'react';
import './AvailableDeliveryCard.css';

const AvailableDeliveryCard = ({ 
  delivery, 
  isSelected, 
  onSelect,
  calculateWaitingTime 
}) => {
  if (!delivery) return null;

  const waitingTime = calculateWaitingTime(delivery.available_since);
  const isUrgent = delivery.priority === 'urgent';
  const isLongWait = waitingTime > 60;

  const getStatusColor = () => {
    if (isUrgent) return 'urgent';
    if (isLongWait) return 'warning';
    return 'default';
  };

  return (
    <div 
      className={`delivery-card ${getStatusColor()} ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="card-header">
        <div className="delivery-id">
          <span className="order-number">#{delivery.order_id || delivery.delivery_id}</span>
          {isUrgent && <span className="priority-badge">URGENT</span>}
        </div>
        <div className="waiting-time">
          <i data-lucide="clock"></i>
          <span>{waitingTime} min wait</span>
        </div>
      </div>
      
      <div className="card-body">
        <div className="customer-info">
          <div className="avatar">
            {delivery.customer_name ? delivery.customer_name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="customer-details">
            <strong>{delivery.customer_name || 'Customer'}</strong>
            <span>{delivery.customer_phone || 'Phone not available'}</span>
          </div>
        </div>
        
        <div className="delivery-info">
          <div className="info-row">
            <i data-lucide="map-pin"></i>
            <span className="truncate">{delivery.delivery_address || 'Address not specified'}</span>
          </div>
          <div className="info-row">
            <i data-lucide="package"></i>
            <span>{delivery.items_count || 1} item • {delivery.payment_type === 'cod' ? 'COD' : 'Prepaid'}</span>
            {delivery.payment_type === 'cod' && delivery.order_amount && (
              <span className="amount">₹{delivery.order_amount}</span>
            )}
          </div>
          {delivery.expected_delivery_time && (
            <div className="info-row">
              <i data-lucide="calendar-clock"></i>
              <span>Expected: {new Date(delivery.expected_delivery_time).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="card-footer">
        <span className="distance">
          <i data-lucide="navigation"></i>
          {delivery.distance || 'Distance not available'}
        </span>
        <button 
          className={`btn-accept ${isUrgent ? 'urgent' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <i data-lucide="check"></i>
          Accept Delivery
        </button>
      </div>
    </div>
  );
};

export default AvailableDeliveryCard;