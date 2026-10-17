import React, { useState } from 'react';
import { useOrderAdminContext } from '../../../../context/OrderAdminContext';
import './OrderModals.css';

const OrderModals = ({ order, onUpdate }) => {
    const { updateOrder, cancelOrder, addOrderHistory } = useOrderAdminContext();
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [updateData, setUpdateData] = useState({
        order_status: order?.order_status || '',
        payment_status: order?.payment_status || '',
        delivery_fee: order?.delivery_fee || 0,
        tax_amount: order?.tax_amount || 0
    });
    const [newStatus, setNewStatus] = useState('');

    const handleUpdateOrder = async () => {
        const result = await updateOrder(order.order_id, updateData);
        if (result.success) {
            setShowUpdateModal(false);
            onUpdate();
        }
    };

    const handleCancelOrder = async () => {
        const result = await cancelOrder(order.order_id);
        if (result.success) {
            setShowCancelModal(false);
            onUpdate();
        }
    };

    const handleAddHistory = async () => {
        if (newStatus) {
            const result = await addOrderHistory(order.order_id, newStatus);
            if (result.success) {
                setShowHistoryModal(false);
                setNewStatus('');
                onUpdate();
            }
        }
    };

    return (
        <>
            <div className="admin-om-container">
                <button
                    onClick={() => setShowUpdateModal(true)}
                    className="admin-om-btn update"
                >
                    Update Order
                </button>
                <button
                    onClick={() => setShowHistoryModal(true)}
                    className="admin-om-btn history"
                >
                    Add History
                </button>
                {order?.order_status !== 'CANCELLED' && (
                    <button
                        onClick={() => setShowCancelModal(true)}
                        className="admin-om-btn cancel"
                    >
                        Cancel Order
                    </button>
                )}
            </div>

            {/* Update Order Modal */}
            {showUpdateModal && (
                <div className="admin-om-overlay">
                    <div className="admin-om-modal">
                        <div className="admin-om-title">
                            <h3>Update Order</h3>
                        </div>
                        <div className="admin-om-form">
                            <div className="admin-om-group">
                                <label>Order Status</label>
                                <select
                                    className="admin-om-select"
                                    value={updateData.order_status}
                                    onChange={(e) => setUpdateData({ ...updateData, order_status: e.target.value })}
                                >
                                    <option value="PLACED">Placed</option>
                                    <option value="PROCESSING">Processing</option>
                                    <option value="SHIPPED">Shipped</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <div className="admin-om-group">
                                <label>Payment Status</label>
                                <select
                                    className="admin-om-select"
                                    value={updateData.payment_status}
                                    onChange={(e) => setUpdateData({ ...updateData, payment_status: e.target.value })}
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="FAILED">Failed</option>
                                    <option value="REFUNDED">Refunded</option>
                                </select>
                            </div>
                        </div>
                        <div className="admin-om-actions">
                            <button
                                onClick={handleUpdateOrder}
                                className="admin-om-modal-btn primary"
                            >
                                Update
                            </button>
                            <button
                                onClick={() => setShowUpdateModal(false)}
                                className="admin-om-modal-btn cancel"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Order Modal */}
            {showCancelModal && (
                <div className="admin-om-overlay">
                    <div className="admin-om-modal">
                        <div className="admin-om-title">
                            <h3>Cancel Order</h3>
                            <p className="admin-om-description">
                                Are you sure you want to cancel this order? This action cannot be undone.
                            </p>
                        </div>
                        <div className="admin-om-actions">
                            <button
                                onClick={handleCancelOrder}
                                className="admin-om-modal-btn danger"
                            >
                                Yes, Cancel Order
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="admin-om-modal-btn cancel"
                            >
                                No, Keep Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add History Modal */}
            {showHistoryModal && (
                <div className="admin-om-overlay">
                    <div className="admin-om-modal">
                        <div className="admin-om-title">
                            <h3>Add Order History</h3>
                        </div>
                        <div className="admin-om-form">
                            <div className="admin-om-group">
                                <label>Status</label>
                                <input
                                    type="text"
                                    className="admin-om-input"
                                    placeholder="Enter status update"
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="admin-om-actions">
                            <button
                                onClick={handleAddHistory}
                                className="admin-om-modal-btn primary"
                            >
                                Add History
                            </button>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="admin-om-modal-btn cancel"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OrderModals;