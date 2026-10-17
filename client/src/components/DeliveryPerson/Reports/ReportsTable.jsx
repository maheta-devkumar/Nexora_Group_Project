import React from 'react';
import './ReportsTable.css';

const ReportsTable = ({ ordersData, loading, onRefresh }) => {
    // Use provided ordersData or empty array
    const orders = ordersData || [];

    const getStatusBadge = (status) => {
        const statusMap = {
            'DELIVERED': {
                label: 'Delivered',
                class: 'status-delivered',
                icon: 'check-circle'
            },
            'OUT_FOR_DELIVERY': {
                label: 'Out for Delivery',
                class: 'status-intransit',
                icon: 'truck'
            },
            'FAILED': {
                label: 'Failed',
                class: 'status-failed',
                icon: 'x-circle'
            },
            'CANCELLED': {
                label: 'Cancelled',
                class: 'status-cancelled',
                icon: 'x'
            },
            'ASSIGNED': {
                label: 'Assigned',
                class: 'status-assigned',
                icon: 'package'
            },
            'PENDING': {
                label: 'Pending',
                class: 'status-pending',
                icon: 'clock'
            }
        };

        const statusInfo = statusMap[status] || {
            label: status || 'Unknown',
            class: 'status-unknown',
            icon: 'help-circle'
        };

        return (
            <span className={`status-badge ${statusInfo.class}`}>
                <i data-lucide={statusInfo.icon}></i>
                {statusInfo.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="orders-section">
            <div className="section-header">
                <div className="section-title">
                    <h3>
                        <i data-lucide="package"></i>
                        Order-wise Report
                    </h3>
                    <span className="order-count">
                        {orders.length} orders found
                    </span>
                </div>

                <button
                    className={`refresh-btn ${loading ? 'loading' : ''}`}
                    onClick={onRefresh}
                    disabled={loading}
                >
                    <i data-lucide="refresh-cw"></i>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="table-container">
                {loading && orders.length === 0 ? (
                    <div className="table-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading order data...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="table-empty">
                        <i data-lucide="inbox"></i>
                        <h4>No orders found</h4>
                        <p>Try adjusting your filters or check back later.</p>
                    </div>
                ) : (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Distance</th>
                                <th>Earnings</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 10).map((order, index) => (
                                <tr key={index} className="order-row">
                                    <td className="order-id">
                                        <span className="order-link">
                                            #{order.order_id || order.delivery_id || `ORD-${1000 + index}`}
                                        </span>
                                    </td>
                                    <td className="order-date">
                                        {formatDate(order.delivery_date || order.date)}
                                    </td>
                                    <td className="order-customer">
                                        <div className="customer-info">
                                            <div className="customer-avatar">
                                                {order.customer_name?.charAt(0) || 'C'}
                                            </div>
                                            <div className="customer-details">
                                                <strong>{order.customer_name || `Customer ${index + 1}`}</strong>
                                                <span className="customer-phone">
                                                    {order.customer_phone || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="order-status">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="order-distance">
                                        {order.distance_km || order.distance || 0} km
                                    </td>
                                    <td className="order-earnings">
                                        <strong>₹{order.earning_amount || order.earnings || 0}</strong>
                                    </td>
                                    <td className="order-actions">
                                        <button className="action-btn view-btn" title="View Details">
                                            <i data-lucide="eye"></i>
                                        </button>
                                        <button className="action-btn download-btn" title="Download POD">
                                            <i data-lucide="download"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {orders.length > 10 && (
                <div className="table-footer">
                    <p className="showing-text">
                        Showing 10 of {orders.length} orders
                    </p>
                    <div className="pagination">
                        <button className="page-btn" disabled>
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <button className="page-btn active">1</button>
                        <button className="page-btn">2</button>
                        <button className="page-btn">3</button>
                        <span className="page-dots">...</span>
                        <button className="page-btn">10</button>
                        <button className="page-btn">
                            <i data-lucide="chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsTable;