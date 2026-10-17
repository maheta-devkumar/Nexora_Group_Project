import React, { useState } from 'react';
import { useOrderAdminContext } from '../../../../context/OrderAdminContext';
import './ReturnModals.css';

const ReturnModals = ({ returnItem, actionType, onClose, onActionComplete }) => {
    const { approveReturn, rejectReturn, fetchReturnItems } = useOrderAdminContext();
    const [rejectReason, setRejectReason] = useState('');
    const [returnItems, setReturnItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

    React.useEffect(() => {
        if (actionType === 'view' && returnItem) {
            loadReturnItems();
        }
    }, [actionType, returnItem]);

    const loadReturnItems = async () => {
        setLoadingItems(true);
        const result = await fetchReturnItems(returnItem.return_id);
        if (result.success) {
            setReturnItems(result.data);
        }
        setLoadingItems(false);
    };

    const handleApprove = async () => {
        const result = await approveReturn(returnItem.return_id);
        if (result.success) {
            onActionComplete();
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }
        
        const result = await rejectReturn(returnItem.return_id, rejectReason);
        if (result.success) {
            onActionComplete();
        }
    };

    if (!returnItem) return null;

    if (actionType === 'view') {
        return (
            <div className="return-modal-overlay">
                <div className="return-modal">
                    <div className="return-modal-header">
                        <h3>Return Items</h3>
                        <p className="return-subtitle">Return #{returnItem.return_id}</p>
                    </div>
                    
                    <div className="return-items-container">
                        {loadingItems ? (
                            <p className="loading-items">Loading items...</p>
                        ) : returnItems.length > 0 ? (
                            <div className="items-table-container">
                                <table className="items-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.variant?.product?.name || `Item ${index + 1}`}</td>
                                                <td>{item.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="empty-items">No items found for this return.</p>
                        )}
                    </div>
                    
                    <div className="return-modal-actions">
                        <button
                            onClick={onClose}
                            className="return-modal-button close"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (actionType === 'approve') {
        return (
            <div className="return-modal-overlay">
                <div className="return-modal">
                    <div className="return-modal-header">
                        <h3>Approve Return</h3>
                        <p className="modal-description">
                            Are you sure you want to approve return #{returnItem.return_id}?
                        </p>
                    </div>
                    <div className="return-modal-actions">
                        <button
                            onClick={handleApprove}
                            className="return-modal-button approve"
                        >
                            Yes, Approve
                        </button>
                        <button
                            onClick={onClose}
                            className="return-modal-button cancel"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (actionType === 'reject') {
        return (
            <div className="return-modal-overlay">
                <div className="return-modal">
                    <div className="return-modal-header">
                        <h3>Reject Return</h3>
                        <p className="modal-description">
                            Please provide a reason for rejecting return #{returnItem.return_id}
                        </p>
                    </div>
                    <div className="reason-input">
                        <textarea
                            className="reason-textarea"
                            rows="3"
                            placeholder="Enter rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <div className="return-modal-actions">
                        <button
                            onClick={handleReject}
                            className="return-modal-button reject"
                        >
                            Reject Return
                        </button>
                        <button
                            onClick={onClose}
                            className="return-modal-button cancel"
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

export default ReturnModals;