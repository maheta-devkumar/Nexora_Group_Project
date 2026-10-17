import React, { useState } from 'react';
import { useActiveDeliveriesContext } from '../../../context/delivery_panel/ActiveDeliveriesContext';
import './DeliveryActions.css';

const DeliveryActions = ({ delivery, onActionComplete }) => {
  const {
    updateDeliveryStatus,
    updateDeliveryProgress,
    validateStatusTransition,
    loading: contextLoading
  } = useActiveDeliveriesContext();

  const [actionLoading, setActionLoading] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [targetAction, setTargetAction] = useState(null);

  // Safe data accessors
  const getOrderNumber = () => {
    return delivery?.order_number || delivery?.order_id || delivery?.id || 'N/A';
  };

  const getCustomerName = () => {
    if (!delivery?.customer) return 'Customer';
    return delivery.customer.name || delivery.customer.customer_name || 'Customer';
  };

  const getDeliveryAddress = () => {
    if (!delivery) return 'Address not specified';

    // Handle different possible address fields
    const address = delivery.delivery_address || delivery.address || delivery.shipping_address;

    if (!address) return 'Address not specified';

    // Check if address is string
    if (typeof address === 'string') {
      return address.length > 50 ? `${address.substring(0, 50)}...` : address;
    }

    // If address is an object, try to get formatted address
    if (typeof address === 'object' && address !== null) {
      // Check for backend schema properties (line1, area_name, city_name)
      if (address.line1 || address.area_name || address.city_name) {
        const parts = [];
        if (address.line1) parts.push(address.line1);
        if (address.line2) parts.push(address.line2);
        if (address.area_name) parts.push(address.area_name);
        if (address.city_name) parts.push(address.city_name);
        if (address.pincode) parts.push(address.pincode);

        const fullAddress = parts.join(', ');
        return fullAddress.length > 50 ? `${fullAddress.substring(0, 50)}...` : fullAddress;
      }

      const street = address.street || address.address_line1 || '';
      const city = address.city || '';
      const state = address.state || '';
      const zip = address.zip_code || address.pincode || '';
      const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');
      return fullAddress.length > 50 ? `${fullAddress.substring(0, 50)}...` : fullAddress;
    }

    return 'Address not specified';
  };

  const getCustomerPhone = () => {
    if (!delivery?.customer) return null;
    return delivery.customer.phone || delivery.customer.contact_number || delivery.customer.mobile;
  };

  const handleAction = async (action) => {
    if (!delivery?.id) {
      console.error('No delivery ID provided');
      return;
    }

    setActionLoading(true);
    let result;

    try {
      const deliveryId = delivery.id || delivery.delivery_id;

      switch (action) {
        case 'mark_picked':
          result = await updateDeliveryStatus(deliveryId, 'picked_up', notes);
          break;

        case 'start_delivery':
          result = await updateDeliveryStatus(deliveryId, 'out_for_delivery', notes);
          break;

        case 'mark_delivered':
          result = await updateDeliveryStatus(deliveryId, 'delivered', notes);
          break;

        case 'update_progress':
          // Example: Update progress to 50%
          result = await updateDeliveryProgress(deliveryId, 50, notes);
          break;

        default:
          console.error('Unknown action:', action);
      }

      if (result && result.success) {
        setShowNotesModal(false);
        setNotes('');
        setTargetAction(null);
        if (onActionComplete) {
          onActionComplete();
        }
      } else if (result) {
        console.error('Action failed:', result.message);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openNotesModal = (action) => {
    if (!delivery?.id) {
      console.error('Cannot open modal: No delivery selected');
      return;
    }
    setTargetAction(action);
    setShowNotesModal(true);
  };

  const getActionButtons = () => {
    if (!delivery?.status) return null;

    const status = delivery.status.toLowerCase();

    switch (status) {
      case 'pending_pickup':
      case 'pending':
      case 'assigned':
        return (
          <button
            className="action-btn primary"
            onClick={() => openNotesModal('mark_picked')}
            disabled={actionLoading || contextLoading}
          >
            <i data-lucide="check"></i>
            Mark as Picked Up
          </button>
        );

      case 'picked_up':
      case 'picked':
        return (
          <>
            <button
              className="action-btn primary"
              onClick={() => openNotesModal('start_delivery')}
              disabled={actionLoading || contextLoading}
            >
              <i data-lucide="arrow-right"></i>
              Start Delivery
            </button>
            <button
              className="action-btn secondary"
              onClick={() => openNotesModal('update_progress')}
              disabled={actionLoading || contextLoading}
            >
              <i data-lucide="refresh-cw"></i>
              Update Progress
            </button>
          </>
        );

      case 'out_for_delivery':
      case 'in_transit':
      case 'transit':
        return (
          <>
            <button
              className="action-btn success"
              onClick={() => openNotesModal('mark_delivered')}
              disabled={actionLoading || contextLoading}
            >
              <i data-lucide="check-circle"></i>
              Mark as Delivered
            </button>
            <button
              className="action-btn secondary"
              onClick={() => openNotesModal('update_progress')}
              disabled={actionLoading || contextLoading}
            >
              <i data-lucide="refresh-cw"></i>
              Update Progress
            </button>
          </>
        );

      default:
        return (
          <button
            className="action-btn primary"
            onClick={() => openNotesModal('update_progress')}
            disabled={actionLoading || contextLoading}
          >
            <i data-lucide="refresh-cw"></i>
            Update Progress
          </button>
        );
    }
  };

  const getActionDescription = () => {
    if (!delivery?.status) return 'Update the delivery status as needed.';

    const status = delivery.status.toLowerCase();

    switch (status) {
      case 'pending_pickup':
      case 'pending':
      case 'assigned':
        return 'Pick up the package from the specified location.';

      case 'picked_up':
      case 'picked':
        return 'Start delivering the package to the customer.';

      case 'out_for_delivery':
      case 'in_transit':
      case 'transit':
        return 'Mark the delivery as completed when handed over to customer.';

      default:
        return 'Update the delivery status as needed.';
    }
  };

  const handleSubmitNotes = () => {
    if (targetAction) {
      handleAction(targetAction);
    }
  };

  // If no delivery is provided, don't render
  if (!delivery) {
    return (
      <div className="delivery-actions-panel">
        <div className="actions-header">
          <h3>Delivery Actions</h3>
          <span className="action-description">No delivery selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-actions-panel">
      <div className="actions-header">
        <h3>Delivery Actions</h3>
        <span className="action-description">{getActionDescription()}</span>
      </div>

      <div className="actions-content">
        <div className="selected-delivery-info">
          <div className="info-item">
            <i data-lucide="package"></i>
            <span><strong>Order ID:</strong> #{getOrderNumber()}</span>
          </div>
          <div className="info-item">
            <i data-lucide="user"></i>
            <span><strong>Customer:</strong> {getCustomerName()}</span>
          </div>
          <div className="info-item">
            <i data-lucide="map-pin"></i>
            <span><strong>To:</strong> {getDeliveryAddress()}</span>
          </div>
        </div>

        <div className="action-buttons">
          {getActionButtons()}

          <button
            className="action-btn outline"
            onClick={() => {
              const phone = getCustomerPhone();
              if (phone) {
                window.location.href = `tel:${phone}`;
              }
            }}
            disabled={!getCustomerPhone()}
          >
            <i data-lucide="phone"></i>
            Call Customer
          </button>

          <button
            className="action-btn outline"
            onClick={() => {
              // Navigate to address
              const address = encodeURIComponent(getDeliveryAddress());
              window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
            }}
          >
            <i data-lucide="navigation"></i>
            Navigate to Address
          </button>
        </div>
      </div>

      {showNotesModal && (
        <div className="notes-modal-overlay">
          <div className="notes-modal">
            <div className="modal-header">
              <h3>Add Notes (Optional)</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowNotesModal(false);
                  setNotes('');
                  setTargetAction(null);
                }}
                disabled={actionLoading}
              >
                <i data-lucide="x"></i>
              </button>
            </div>

            <div className="modal-body">
              <p>Add any notes about this delivery (optional):</p>
              <textarea
                className="notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter notes about this delivery..."
                rows={4}
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowNotesModal(false);
                  setNotes('');
                  setTargetAction(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmitNotes}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryActions;