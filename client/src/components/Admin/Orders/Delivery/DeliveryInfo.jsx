import React from 'react';
import StatusBadge from '../common/StatusBadge';
import './DeliveryInfo.css';

const DeliveryInfo = ({ order, onAssign, onUpdate, onViewDetails }) => {
    return (
        <div className="delivery-info-card">
            <div className="delivery-header">
                <h3>Order #{order.order_id}</h3>
                <p>
                    Customer: {order.user?.name || `User #${order.user_id}`}
                </p>
                <div className="status-badge-wrapper">
                    <StatusBadge status={order.order_status} type="order" />
                </div>
            </div>
            
            <div className="delivery-details">
                <div className="detail-row">
                    <span className="detail-label">Total Amount:</span>
                    <span className="detail-value">${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Delivery Fee:</span>
                    <span className="detail-value">${parseFloat(order.delivery_fee || 0).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Delivery Person:</span>
                    <span className="detail-value">
                        {order.delivery_user_id ? `User #${order.delivery_user_id}` : 'Not assigned'}
                    </span>
                </div>
            </div>
            
            <div className="delivery-actions">
                <div className="action-buttons">
                    <button
                        onClick={onAssign}
                        className="action-button assign"
                    >
                        Assign
                    </button>
                    {order.delivery_user_id && (
                        <button
                            onClick={onUpdate}
                            className="action-button update"
                        >
                            Update
                        </button>
                    )}
                    <button
                        onClick={onViewDetails}
                        className="action-button details"
                    >
                        Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeliveryInfo;