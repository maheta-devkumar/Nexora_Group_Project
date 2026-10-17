import React from 'react';
import { Link } from 'react-router-dom';
import OrdersTable from './OrdersTable';
import './OrderListPage.css';

const OrderListPage = ({ orders, onViewOrder, loading }) => {
    return (
        <div className="order-list-page">
            <div className="page-header">
                <div className="header-content">
                    <h2>All Orders</h2>
                    <p className="order-count">
                        {orders.length} orders found
                    </p>
                </div>
                <div className="header-actions">
                    <Link
                        to="/admin/orders/analytics"
                        className="header-link analytics"
                    >
                        Analytics
                    </Link>
                    <Link
                        to="/admin/orders/returns"
                        className="header-link returns"
                    >
                        View Returns
                    </Link>
                </div>
            </div>
            
            <OrdersTable 
                orders={orders}
                onViewOrder={onViewOrder}
                loading={loading}
            />
        </div>
    );
};

export default OrderListPage;