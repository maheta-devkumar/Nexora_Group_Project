import React from 'react';
import { useAvailableDeliveriesContext } from '../../../context/delivery_panel/AvailableDeliveriesContext';
import './AvailableDeliveryActions.css';
import { toast } from 'react-toastify';

const AvailableDeliveryActions = ({ delivery, onActionComplete }) => {
  const { acceptDelivery, cancelDelivery, actionInProgress } = useAvailableDeliveriesContext();

  const handleAccept = async () => {
    try {
      if (!delivery || !delivery.delivery_id) {
        console.error('Invalid delivery object:', delivery);
        toast.error('Cannot accept: Invalid delivery data');
        return;
      }
      await acceptDelivery(delivery.delivery_id);
      onActionComplete();
    } catch (error) {
      console.error('Error accepting delivery:', error);
      toast.error('Failed to accept delivery: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this delivery?')) {
      return;
    }

    try {
      await cancelDelivery(delivery.delivery_id);
      onActionComplete();
    } catch (error) {
      console.error('Error canceling delivery:', error);
    }
  };

  const handleCallCustomer = () => {
    if (delivery.customer_phone) {
      window.open(`tel:${delivery.customer_phone}`, '_blank');
    } else {
      toast.warning('Customer phone number not available');
    }
  };

  const handleNavigate = () => {
    if (delivery.delivery_address) {
      const address = encodeURIComponent(delivery.delivery_address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    } else {
      toast.warning('Delivery address not available');
    }
  };

  if (!delivery) return null;

  return (
    <div className="delivery-actions-panel">
      <div className="actions-header">
        <h3>Delivery Actions</h3>
        <div className="selected-delivery">
          <strong>Order #{delivery.order_id || delivery.delivery_id}</strong>
          <span>{delivery.customer_name}</span>
        </div>
      </div>

      <div className="actions-grid">
        <button
          className="action-btn primary"
          onClick={handleAccept}
          disabled={actionInProgress}
        >
          <div className="action-icon">
            <i data-lucide="check-circle"></i>
          </div>
          <div className="action-content">
            <strong>Accept Delivery</strong>
            <span>Mark as accepted and start delivery</span>
          </div>
          {actionInProgress && (
            <div className="loading-indicator"></div>
          )}
        </button>

        <button
          className="action-btn secondary"
          onClick={handleNavigate}
          disabled={actionInProgress}
        >
          <div className="action-icon">
            <i data-lucide="navigation"></i>
          </div>
          <div className="action-content">
            <strong>Navigate</strong>
            <span>Open in maps app</span>
          </div>
        </button>

        <button
          className="action-btn secondary"
          onClick={handleCallCustomer}
          disabled={actionInProgress || !delivery.customer_phone}
        >
          <div className="action-icon">
            <i data-lucide="phone"></i>
          </div>
          <div className="action-content">
            <strong>Call Customer</strong>
            <span>{delivery.customer_phone || 'Phone not available'}</span>
          </div>
        </button>

        <button
          className="action-btn danger"
          onClick={handleCancel}
          disabled={actionInProgress}
        >
          <div className="action-icon">
            <i data-lucide="x-circle"></i>
          </div>
          <div className="action-content">
            <strong>Cancel Delivery</strong>
            <span>Reject this delivery request</span>
          </div>
        </button>
      </div>

      <div className="actions-info">
        <div className="info-item">
          <i data-lucide="info"></i>
          <span>Accepting will assign this delivery to you and remove it from available list</span>
        </div>
        <div className="info-item">
          <i data-lucide="alert-circle"></i>
          <span>Cancelling will make this delivery available for other delivery partners</span>
        </div>
      </div>
    </div>
  );
};

export default AvailableDeliveryActions;