import React, { useState } from 'react';
import { useOrderAdminContext } from '../../../../context/OrderAdminContext';
import './RefundModals.css';

const RefundModals = ({ refund, actionType, onClose, onActionComplete }) => {
    const { updateRefundStatus, retryRefund } = useOrderAdminContext();
    const [newStatus, setNewStatus] = useState(refund?.status || '');

    const handleUpdateStatus = async () => {
        if (!newStatus) return;
        
        const result = await updateRefundStatus(refund.refund_id, newStatus);
        if (result.success) {
            onActionComplete();
        }
    };

    const handleRetry = async () => {
        const result = await retryRefund(refund.refund_id);
        if (result.success) {
            onActionComplete();
        }
    };

    if (!refund) return null;

    if (actionType === 'view') {
        return (
            <div className="refund-modal-overlay">
                <div className="refund-modal">
                    <div className="refund-modal-header">
                        <h3>Refund Details</h3>
                        <p className="refund-subtitle">Refund #{refund.refund_id}</p>
                    </div>
                    
                    <div className="refund-details">
                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="detail-label">Refund ID</span>
                                <span className="detail-value">#{refund.refund_id}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Return ID</span>
                                <span className="detail-value">#{refund.return_id}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Amount</span>
                                <span className="detail-value">${parseFloat(refund.amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Status</span>
                                <span className="detail-value">{refund.status}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Created Date</span>
                                <span className="detail-value">
                                    {new Date(refund.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Payment Method</span>
                                <span className="detail-value">{refund.payment_method || 'N/A'}</span>
                            </div>
                        </div>
                        
                        {refund.reason && (
                            <div className="reason-section">
                                <span className="detail-label">Reason</span>
                                <span className="detail-value">{refund.reason}</span>
                            </div>
                        )}
                        
                        {refund.transaction_id && (
                            <div className="detail-item">
                                <span className="detail-label">Transaction ID</span>
                                <span className="detail-value">{refund.transaction_id}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="refund-modal-actions">
                        <button
                            onClick={onClose}
                            className="refund-modal-button close"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (actionType === 'update') {
        return (
            <div className="refund-modal-overlay">
                <div className="refund-modal">
                    <div className="refund-modal-header">
                        <h3>Update Refund Status</h3>
                        <p className="refund-subtitle">Refund #{refund.refund_id}</p>
                    </div>
                    
                    <div className="refund-form">
                        <label>New Status</label>
                        <select
                            className="refund-select"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                        >
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                    
                    <div className="refund-modal-actions">
                        <button
                            onClick={handleUpdateStatus}
                            className="refund-modal-button update"
                        >
                            Update Status
                        </button>
                        <button
                            onClick={onClose}
                            className="refund-modal-button cancel"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (actionType === 'retry') {
        return (
            <div className="refund-modal-overlay">
                <div className="refund-modal">
                    <div className="refund-modal-header">
                        <h3>Retry Refund</h3>
                        <p className="modal-description">
                            Are you sure you want to retry refund #{refund.refund_id}?
                        </p>
                    </div>
                    <div className="refund-modal-actions">
                        <button
                            onClick={handleRetry}
                            className="refund-modal-button retry"
                        >
                            Yes, Retry
                        </button>
                        <button
                            onClick={onClose}
                            className="refund-modal-button cancel"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default RefundModals;