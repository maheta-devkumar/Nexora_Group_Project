import React, { useState } from 'react';
import './CancelOrderModal.css';

const CancelOrderModal = ({ order, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const cancellationReasons = [
    'Found better price elsewhere',
    'Changed my mind',
    'Delivery takes too long',
    'Ordered by mistake',
    'Product not needed anymore',
    'Other reason'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) return;
    
    onConfirm({
      reason,
      additionalNotes,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="modal-overlay">
      <div className="cancel-order-modal">
        <div className="modal-header">
          <h2>Cancel Order</h2>
          <button className="btn-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          <div className="order-info">
            <h4>Order #{order.order_id || order.id}</h4>
            <p>Placed on {new Date(order.placed_at || order.date).toLocaleDateString()}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Reason for Cancellation *</label>
              <div className="reason-options">
                {cancellationReasons.map((reasonOption) => (
                  <label key={reasonOption} className="reason-option">
                    <input
                      type="radio"
                      name="cancellationReason"
                      value={reasonOption}
                      checked={reason === reasonOption}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    {reasonOption}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Additional Notes (Optional)</label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Please provide any additional details about your cancellation..."
                rows="4"
              />
            </div>

            <div className="cancellation-notice">
              <i className="fas fa-info-circle"></i>
              <p>
                Once cancelled, this action cannot be undone. 
                Refunds will be processed within 5-7 business days.
              </p>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={onClose}
              >
                Keep Order
              </button>
              <button 
                type="submit" 
                className="btn-confirm-cancel"
                disabled={!reason}
              >
                Confirm Cancellation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;