import React, { useState } from 'react';
import { usePendingPickupsContext } from '../../../context/delivery_panel/PendingPickupsContext';
import { useAvailableDeliveriesContext } from '../../../context/delivery_panel/AvailableDeliveriesContext';
import './PickupActions.css';

const PickupActions = ({ pickup, onActionComplete }) => {
  const {
    confirmPickup,
    fetchVendorContact,
    fetchPickupNavigation,
    loading: contextLoading,
    cancelDelivery // Add cancel delivery function from PendingPickups context
  } = usePendingPickupsContext();

  // Also import from AvailableDeliveriesContext if needed
  const { cancelDelivery: cancelAvailableDelivery } = useAvailableDeliveriesContext();

  const [actionLoading, setActionLoading] = useState(false);

  // Removed showQRModal state
  // Removed qrData state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [podImageUrl, setPodImageUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  // Safe data accessors
  const getPickupId = () => {
    return pickup?.pickup_id || pickup?.delivery_id || pickup?.id || 'N/A';
  };

  const getOrderNumber = () => {
    return pickup?.order_number || pickup?.order_id || 'N/A';
  };

  const getCustomerName = () => {
    if (!pickup?.customer) return 'Customer';
    return pickup.customer.name || pickup.customer.customer_name || 'Customer';
  };

  const getLocationName = () => {
    const location = pickup?.pickup_location || pickup?.location;
    if (!location) return 'Pickup Location';
    return location.location_name || location.name || location.address || 'Pickup Location';
  };

  const getPackageInfo = () => {
    const count = pickup?.package_count || pickup?.items_count || pickup?.total_items || 1;
    const type = pickup?.package_type || pickup?.package_size || '';

    let info = `${count} package${count !== 1 ? 's' : ''}`;
    if (type) {
      info += ` • ${type}`;
    }

    if (pickup?.priority === 'URGENT') {
      info += ' • URGENT';
    }

    return info;
  };

  const getPickupWindow = () => {
    return pickup?.pickup_window || pickup?.expected_pickup_time || 'N/A';
  };

  const getInstructions = () => {
    return pickup?.pickup_instructions || pickup?.special_instructions || 'No special instructions';
  };



  const handleConfirmPickup = async () => {
    setActionLoading(true);
    try {
      const result = await confirmPickup(getPickupId(), notes, podImageUrl || null, signatureUrl || null);
      if (result.success) {
        setShowConfirmModal(false);
        setNotes('');
        setPodImageUrl('');
        setSignatureUrl('');
        if (onActionComplete) {
          onActionComplete();
        }
        alert('Pickup confirmed successfully!');
      } else {
        alert(`Failed to confirm pickup: ${result.message}`);
      }
    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Failed to confirm pickup');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancel delivery
  const handleCancelDelivery = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this pickup? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      // Try to use the PendingPickups context cancel first
      let result;
      if (cancelDelivery) {
        result = await cancelDelivery(getPickupId(), cancelReason);
      } else if (cancelAvailableDelivery) {
        // Fallback to AvailableDeliveries context
        result = await cancelAvailableDelivery(getPickupId());
      } else {
        throw new Error('No cancel delivery function available');
      }

      if (result.success) {
        setShowCancelModal(false);
        setCancelReason('');
        if (onActionComplete) {
          onActionComplete();
        }
        alert('Pickup cancelled successfully!');
      } else {
        alert(`Failed to cancel pickup: ${result.message}`);
      }
    } catch (error) {
      console.error('Error cancelling pickup:', error);
      alert('Failed to cancel pickup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallVendor = async () => {
    try {
      const result = await fetchVendorContact(getPickupId());
      if (result.success && result.data.phone) {
        window.location.href = `tel:${result.data.phone}`;
      } else {
        alert('Vendor contact information not available');
      }
    } catch (error) {
      console.error('Error calling vendor:', error);
      alert('Failed to get vendor contact');
    }
  };

  const handleNavigate = async () => {
    try {
      const result = await fetchPickupNavigation(getPickupId());
      if (result.success && result.data.navigation_url) {
        window.open(result.data.navigation_url, '_blank');
      } else {
        // Fallback to Google Maps
        const location = pickup?.pickup_location || pickup?.location;
        const address = location?.address || getLocationName();
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
      }
    } catch (error) {
      console.error('Error getting navigation:', error);
      alert('Failed to get navigation details');
    }
  };

  // If no pickup is provided, don't render
  if (!pickup) {
    return (
      <div className="pickup-actions-panel">
        <div className="actions-header">
          <h3>Pickup Actions</h3>
          <span className="action-description">No pickup selected</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pickup-actions-panel">
        <div className="actions-header">
          <h3>Pickup Actions</h3>
          <span className="action-description">
            Complete the pickup process for Order #{getOrderNumber()}
          </span>
        </div>

        <div className="actions-content">
          <div className="selected-pickup-info">
            <div className="info-grid">
              <div className="info-item">
                <i data-lucide="package"></i>
                <div>
                  <strong>Pickup ID</strong>
                  <span>#{getPickupId()}</span>
                </div>
              </div>
              <div className="info-item">
                <i data-lucide="shopping-bag"></i>
                <div>
                  <strong>Order Number</strong>
                  <span>#{getOrderNumber()}</span>
                </div>
              </div>
              <div className="info-item">
                <i data-lucide="user"></i>
                <div>
                  <strong>Customer</strong>
                  <span>{getCustomerName()}</span>
                </div>
              </div>
              <div className="info-item">
                <i data-lucide="store"></i>
                <div>
                  <strong>Pickup Location</strong>
                  <span>{getLocationName()}</span>
                </div>
              </div>
              <div className="info-item">
                <i data-lucide="box"></i>
                <div>
                  <strong>Packages</strong>
                  <span>{getPackageInfo()}</span>
                </div>
              </div>
              <div className="info-item">
                <i data-lucide="clock"></i>
                <div>
                  <strong>Pickup Window</strong>
                  <span>{getPickupWindow()}</span>
                </div>
              </div>
            </div>

            <div className="instructions-card">
              <div className="instructions-header">
                <i data-lucide="info"></i>
                <strong>Special Instructions</strong>
              </div>
              <p>{getInstructions()}</p>
            </div>
          </div>

          <div className="action-buttons">


            <button
              className="action-btn success"
              onClick={() => setShowConfirmModal(true)}
              disabled={actionLoading || contextLoading}
            >
              <i data-lucide="check-circle"></i>
              Confirm Pickup
            </button>

            <button
              className="action-btn secondary"
              onClick={handleCallVendor}
              disabled={actionLoading || contextLoading}
            >
              <i data-lucide="phone"></i>
              Call Vendor
            </button>

            <button
              className="action-btn secondary"
              onClick={handleNavigate}
              disabled={actionLoading || contextLoading}
            >
              <i data-lucide="navigation"></i>
              Navigate to Location
            </button>

            {/* ADDED CANCEL DELIVERY BUTTON */}
            <button
              className="action-btn danger"
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading || contextLoading}
            >
              <i data-lucide="x-circle"></i>
              Cancel Pickup
            </button>
          </div>
        </div>
      </div>



      {/* Confirm Pickup Modal */}
      {showConfirmModal && (
        <div className="pickup-modal-overlay">
          <div className="pickup-modal large">
            <div className="modal-header">
              <h3>Confirm Pickup</h3>
              <button
                className="close-btn"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
              >
                <i data-lucide="x"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="confirmation-info">
                <div className="info-row">
                  <span className="info-label">Pickup ID:</span>
                  <span className="info-value">#{getPickupId()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Order Number:</span>
                  <span className="info-value">#{getOrderNumber()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Customer:</span>
                  <span className="info-value">{getCustomerName()}</span>
                </div>
              </div>

              <div className="form-section">
                <label htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  className="form-textarea"
                  placeholder="Add any notes about this pickup..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={actionLoading}
                />
              </div>

              <div className="form-section">
                <label>Proof of Delivery (Optional)</label>
                <div className="file-upload-group">
                  <div className="file-upload">
                    <input
                      type="text"
                      placeholder="POD Image URL"
                      value={podImageUrl}
                      onChange={(e) => setPodImageUrl(e.target.value)}
                      disabled={actionLoading}
                    />
                  </div>
                  <div className="file-upload">
                    <input
                      type="text"
                      placeholder="Signature Image URL"
                      value={signatureUrl}
                      onChange={(e) => setSignatureUrl(e.target.value)}
                      disabled={actionLoading}
                    />
                  </div>
                  <p className="helper-text">
                    In a real app, these would be file uploads. For now, enter URLs.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmPickup}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <div className="spinner"></div>
                    Confirming...
                  </>
                ) : (
                  <>
                    <i data-lucide="check-circle"></i>
                    Confirm Pickup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Cancel Delivery Modal */}
      {showCancelModal && (
        <div className="pickup-modal-overlay">
          <div className="pickup-modal">
            <div className="modal-header">
              <h3>Cancel Pickup</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={actionLoading}
              >
                <i data-lucide="x"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-alert">
                <i data-lucide="alert-triangle"></i>
                <div>
                  <strong>Warning: This action cannot be undone</strong>
                  <p>Cancelling this pickup will make it available for other delivery partners.</p>
                </div>
              </div>

              <div className="form-section">
                <label htmlFor="cancelReason">
                  <strong>Reason for Cancellation *</strong>
                </label>
                <textarea
                  id="cancelReason"
                  className="form-textarea"
                  placeholder="Please provide a reason for cancelling this pickup..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  disabled={actionLoading}
                  required
                />
                <p className="helper-text">
                  Providing a reason helps improve our service quality.
                </p>
              </div>

              <div className="pickup-info-summary">
                <div className="summary-item">
                  <span className="summary-label">Order Number:</span>
                  <span className="summary-value">#{getOrderNumber()}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Customer:</span>
                  <span className="summary-value">{getCustomerName()}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Pickup Location:</span>
                  <span className="summary-value">{getLocationName()}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={actionLoading}
              >
                <i data-lucide="arrow-left"></i>
                Go Back
              </button>
              <button
                className="btn-danger"
                onClick={handleCancelDelivery}
                disabled={actionLoading || !cancelReason.trim()}
              >
                {actionLoading ? (
                  <>
                    <div className="spinner"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <i data-lucide="x-circle"></i>
                    Cancel Pickup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PickupActions;