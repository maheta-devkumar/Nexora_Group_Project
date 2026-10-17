import React, { useState } from 'react';
import { useOrderAdminContext } from '../../../../context/OrderAdminContext';
import './OrderItems.css';

const OrderItems = ({ items, orderId, onUpdate }) => {
    const { updateOrderItemQty, removeOrderItem } = useOrderAdminContext();
    const [editingItem, setEditingItem] = useState(null);
    const [newQty, setNewQty] = useState('');

    const handleEditClick = (item) => {
        setEditingItem(item.variant_id);
        setNewQty(item.quantity);
    };

    const handleSaveQty = async (variantId) => {
        if (newQty && newQty > 0) {
            const result = await updateOrderItemQty(orderId, variantId, parseInt(newQty));
            if (result.success) {
                setEditingItem(null);
                onUpdate();
            }
        }
    };

    const handleRemoveItem = async (variantId) => {
        if (window.confirm('Are you sure you want to remove this item from the order?')) {
            const result = await removeOrderItem(orderId, variantId);
            if (result.success) {
                onUpdate();
            }
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    return (
        <div className="admin-card">
            <div className="admin-oitems-header">
                <h2 className="admin-oitems-title">Order Items ({items.length})</h2>
                <div className="admin-oitems-total-badge">
                    <span className="admin-oitems-total-label">Items Total: </span>
                    <span className="admin-oitems-total-amount">${calculateTotal().toFixed(2)}</span>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="admin-oitems-empty">
                    <span className="admin-oitems-empty-icon">📦</span>
                    <p>No items in this order.</p>
                </div>
            ) : (
                <div className="admin-oitems-table-container">
                    <table className="admin-oitems-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={`${item.order_id}-${item.variant_id}`}>
                                    <td>
                                        <div className="admin-oitems-product-cell">
                                            <span className="admin-oitems-product-name">
                                                {item.variant?.product?.name || `Variant #${item.variant_id}`}
                                            </span>
                                            <span className="admin-oitems-product-variant">
                                                {item.variant?.variant_name || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="admin-oitems-price">
                                        ${parseFloat(item.price).toFixed(2)}
                                    </td>
                                    <td>
                                        {editingItem === item.variant_id ? (
                                            <div className="admin-oitems-edit-wrapper">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={newQty}
                                                    onChange={(e) => setNewQty(e.target.value)}
                                                    className="admin-oitems-qty-input"
                                                />
                                                <div className="admin-oitems-actions">
                                                    <button
                                                        onClick={() => handleSaveQty(item.variant_id)}
                                                        className="admin-oitems-btn-save"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingItem(null)}
                                                        className="admin-oitems-btn-cancel"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="admin-oitems-qty-display">
                                                <span className="admin-oitems-qty-val">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    className="admin-oitems-btn-edit"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="admin-oitems-total">
                                        ${parseFloat(item.total).toFixed(2)}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleRemoveItem(item.variant_id)}
                                            className="admin-oitems-btn-remove"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrderItems;