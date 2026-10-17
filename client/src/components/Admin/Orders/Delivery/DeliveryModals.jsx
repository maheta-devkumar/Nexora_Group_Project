import React, { useState } from 'react';
import { useOrderAdminContext } from '../../../../context/OrderAdminContext';
import './DeliveryModals.css';

const DeliveryModals = ({ order, actionType, onClose, onActionComplete }) => {
    const { assignDeliveryPerson, updateDeliveryPerson, fetchDeliveryDetails } = useOrderAdminContext();
    const [deliveryUserId, setDeliveryUserId] = useState(order?.delivery_user_id || '');
    const [deliveryDetails, setDeliveryDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    React.useEffect(() => {
        if (actionType === 'view' && order) {
            loadDeliveryDetails();
        }
    }, [actionType, order]);

    const loadDeliveryDetails = async () => {
        setLoadingDetails(true);
        const result = await fetchDeliveryDetails(order.order_id);
        if (result.success) {
            setDeliveryDetails(result.data);
        }
        setLoadingDetails(false);
    };

    const handleAssign = async () => {
        if (!deliveryUserId) {
            alert('Please enter delivery user ID');
            return;
        }
        
        const result = await assignDeliveryPerson(order.order_id, parseInt(deliveryUserId));
        if (result.success) {
            onActionComplete();
        }
    };

    const handleUpdate = async () => {
        if (!deliveryUserId) {
            alert('Please enter delivery user ID');
            return;
        }
        
        const result = await updateDeliveryPerson(order.order_id, parseInt(deliveryUserId));
        if (result.success) {
            onActionComplete();
        }
    };

    if (!order) return null;

    if (actionType === 'view') {
        return (
            <div className="delivery-modal-overlay">
                <div className="delivery-modal">
                    <div className="modal-header">
                        <div>
                            <h3>Delivery Details</h3>
                            <p className="modal-subtitle">Order #{order.order_id}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="close-button"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div className="modal-content">
                        {loadingDetails ? (
                            <p>Loading delivery details...</p>
                        ) : deliveryDetails ? (
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Order ID</span>
                                    <span className="detail-value">#{deliveryDetails.order_id}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Delivery Person ID</span>
                                    <span className="detail-value">{deliveryDetails.delivery_user_id || 'Not assigned'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Delivery Status</span>
                                    <span className="detail-value">{deliveryDetails.delivery_status}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Delivery Address</span>
                                    <span className="detail-value">{deliveryDetails.delivery_address || 'N/A'}</span>
                                </div>
                                {deliveryDetails.estimated_delivery && (
                                    <div className="detail-item">
                                        <span className="detail-label">Estimated Delivery</span>
                                        <span className="detail-value">
                                            {new Date(deliveryDetails.estimated_delivery).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500">No delivery details available.</p>
                        )}
                    </div>
                    
                    <div className="modal-actions">
                        <button
                            onClick={onClose}
                            className="modal-button close"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (actionType === 'assign' || actionType === 'update') {
        return (
            <div className="delivery-modal-overlay">
                <div className="delivery-modal">
                    <div className="modal-header">
                        <div>
                            <h3>
                                {actionType === 'assign' ? 'Assign Delivery Person' : 'Update Delivery Person'}
                            </h3>
                            <p className="modal-subtitle">Order #{order.order_id}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="close-button"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div className="modal-content">
                        <div className="input-group">
                            <label>Delivery User ID</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Enter delivery user ID"
                                value={deliveryUserId}
                                onChange={(e) => setDeliveryUserId(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="modal-actions">
                        <button
                            onClick={actionType === 'assign' ? handleAssign : handleUpdate}
                            className="modal-button primary"
                        >
                            {actionType === 'assign' ? 'Assign' : 'Update'}
                        </button>
                        <button
                            onClick={onClose}
                            className="modal-button cancel"
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

export default DeliveryModals;