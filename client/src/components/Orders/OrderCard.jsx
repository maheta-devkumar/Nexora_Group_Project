import React from 'react';
import OrderStatusBadge from './OrderStatusBadge';
import './OrderCard.css';

const OrderCard = ({ order, onViewOrder, onTrackOrder, onReorder }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const orderId = order.order_id || order.id;
  const orderDate = order.placed_at || order.date;
  const orderStatus = order.order_status || order.status;

  return (
    <div className="order-card">
      <div className="order-header">
        <div className="order-info">
          <h3 className="order-id">#{orderId}</h3>
          <p className="order-date">Placed on {formatDate(orderDate)}</p>
        </div>
        <OrderStatusBadge status={orderStatus.toLowerCase()} />
      </div>

      <div className="order-items-preview">
        {order.items.slice(0, 3).map((item, index) => (
          <div key={index} className="order-item-preview">
            <div className="item-image-placeholder">
              <i className="fas fa-box"></i>
            </div>
            <div className="item-details">
              <span className="item-name">{item.product_name || item.name}</span>
              <span className="item-quantity">Qty: {item.quantity}</span>
            </div>
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="more-items">
            +{order.items.length - 3} more items
          </div>
        )}
      </div>

      <div className="order-footer">
        <div className="order-total">
          <span>Total: </span>
          <strong>${order.total_amount?.toFixed(2) || order.total?.toFixed(2)}</strong>
        </div>
        
        <div className="order-actions">
          <button 
            className="btn-view-order"
            onClick={() => onViewOrder(orderId)}
          >
            <i className="fas fa-eye"></i>
            View Details
          </button>
          
          {(orderStatus === 'SHIPPED' || orderStatus === 'shipped' || orderStatus === 'DELIVERED' || orderStatus === 'delivered') && (
            <button 
              className="btn-track-order"
              onClick={() => onTrackOrder(orderId)}
            >
              <i className="fas fa-shipping-fast"></i>
              Track Order
            </button>
          )}
          
          {(orderStatus === 'DELIVERED' || orderStatus === 'delivered') && (
            <button 
              className="btn-reorder"
              onClick={() => onReorder(orderId)}
            >
              <i className="fas fa-redo"></i>
              Reorder
            </button>
          )}
        </div>
      </div>

      {order.tracking_number && (
        <div className="order-tracking">
          <i className="fas fa-truck"></i>
          <span>Tracking: {order.tracking_number}</span>
        </div>
      )}
      
      {order.delivery_date && (
        <div className="order-delivery">
          <i className="fas fa-calendar-check"></i>
          <span>Delivered on {formatDate(order.delivery_date)}</span>
        </div>
      )}
      
      {order.estimated_delivery && (
        <div className="order-estimated-delivery">
          <i className="fas fa-clock"></i>
          <span>Est. delivery: {formatDate(order.estimated_delivery)}</span>
        </div>
      )}
    </div>
  );
};

export default OrderCard;