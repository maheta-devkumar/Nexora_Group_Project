import React from 'react';
import StatusBadge from '../common/StatusBadge';
import './OrderDetails.css';

const OrderInfo = ({ order, history }) => {
    if (!order) return null;

    return (
        <div className="admin-oi-container">
            <div className="admin-oi-grid">
                <div className="admin-oi-main-col">
                    <div className="admin-oi-card">
                        <h2 className="admin-oi-card-title">Order Information</h2>
                        <div className="admin-oi-section">
                            <div className="admin-oi-info-grid">
                                <div>
                                    <p className="admin-oi-label">Order ID</p>
                                    <p className="admin-oi-value">#{order.order_id}</p>
                                </div>
                                <div>
                                    <p className="admin-oi-label">Order Status</p>
                                    <div><StatusBadge status={order.order_status} type="order" /></div>
                                </div>
                                <div>
                                    <p className="admin-oi-label">Payment Status</p>
                                    <div><StatusBadge status={order.payment_status} type="payment" /></div>
                                </div>
                                <div>
                                    <p className="admin-oi-label">Order Date</p>
                                    <p className="admin-oi-text">
                                        {new Date(order.placed_at).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="admin-oi-label">Coupon Code</p>
                                    <p className="admin-oi-text">{order.coupon_code || 'None'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-oi-card">
                        <h2 className="admin-oi-card-title">Customer Information</h2>
                        <div className="admin-oi-section">
                            {order.user ? (
                                <div className="admin-oi-info-grid">
                                    <div>
                                        <p className="admin-oi-label">Name</p>
                                        <p className="admin-oi-text">{order.user.name}</p>
                                    </div>
                                    <div>
                                        <p className="admin-oi-label">Email</p>
                                        <p className="admin-oi-text">{order.user.email}</p>
                                    </div>
                                    <div>
                                        <p className="admin-oi-label">Phone</p>
                                        <p className="admin-oi-text">{order.user.phone || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p className="admin-oi-label">Customer ID</p>
                                        <p className="admin-oi-text">#{order.user.user_id}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="admin-oi-text-muted">Customer information not available.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="admin-oi-side-col">
                    <div className="admin-oi-card admin-oi-full-height">
                        <h2 className="admin-oi-card-title">Order Summary</h2>
                        <div className="admin-oi-section">
                            <div className="admin-oi-summary-list">
                                <div className="admin-oi-summary-row">
                                    <span className="admin-oi-summary-label">Subtotal</span>
                                    <span className="admin-oi-summary-value">${parseFloat(order.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="admin-oi-summary-row">
                                    <span className="admin-oi-summary-label">Discount</span>
                                    <span className="admin-oi-summary-value danger">
                                        -${parseFloat(order.discount_amount || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="admin-oi-summary-row">
                                    <span className="admin-oi-summary-label">Delivery Fee</span>
                                    <span className="admin-oi-summary-value">${parseFloat(order.delivery_fee || 0).toFixed(2)}</span>
                                </div>
                                <div className="admin-oi-summary-row">
                                    <span className="admin-oi-summary-label">Tax</span>
                                    <span className="admin-oi-summary-value">${parseFloat(order.tax_amount || 0).toFixed(2)}</span>
                                </div>
                                <div className="admin-oi-divider">
                                    <div className="admin-oi-summary-row">
                                        <span className="admin-oi-total-label">Total Amount</span>
                                        <span className="admin-oi-total-value">
                                            ${parseFloat(order.total_amount).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderInfo;