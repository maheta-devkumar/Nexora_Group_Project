import React from 'react';
import StatusBadge from '../common/StatusBadge';
import './OrdersTable.css';

const OrdersTable = ({ orders, onViewOrder, loading }) => {
    if (loading && orders.length === 0) {
        return (
            <div className="admin-ot-loading">
                <div className="admin-ot-spinner"></div>
                <p>Loading orders...</p>
            </div>
        );
    }

    if (orders.length === 0 && !loading) {
        return (
            <div className="admin-ot-empty">
                <p>No orders found matching your criteria.</p>
            </div>
        );
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getButtonText = (orderStatus) => {
        if (['CANCELLED', 'DELIVERED', 'RETURNED'].includes(orderStatus)) {
            return 'View Details';
        }
        return 'Manage Order';
    };

    return (
        <div className="admin-table-responsive">
            <table className="admin-orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.order_id}>
                            <td>
                                <span className="admin-ot-id">
                                    #{order.order_id}
                                </span>
                            </td>
                            <td>
                                <div className="admin-ot-customer">
                                    <span className="admin-ot-customer-name">
                                        {order.user?.name || `User #${order.user_id}`}
                                    </span>
                                    <span className="admin-ot-customer-email">
                                        {order.user?.email}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div className="admin-ot-date">
                                    {formatDate(order.placed_at)}
                                </div>
                            </td>
                            <td>
                                <span className="admin-ot-amount">
                                    {formatCurrency(parseFloat(order.total_amount))}
                                </span>
                            </td>
                            <td>
                                <StatusBadge status={order.order_status} type="order" />
                            </td>
                            <td>
                                <StatusBadge status={order.payment_status} type="payment" />
                            </td>
                            <td>
                                <button
                                    onClick={() => onViewOrder(order.order_id)}
                                    className="admin-ot-btn-action"
                                >
                                    {getButtonText(order.order_status)}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrdersTable;