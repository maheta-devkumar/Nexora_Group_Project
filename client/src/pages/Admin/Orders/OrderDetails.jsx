import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderAdminContext } from '../../../context/OrderAdminContext';
import OrderInfo from '../../../components/Admin/Orders/OrderDetail/OrderDetails';
import OrderItems from '../../../components/Admin/Orders/OrderDetail/OrderItems';
import OrderModals from '../../../components/Admin/Orders/OrderDetail/OrderModals';
import StatusBadge from '../../../components/Admin/Orders/common/StatusBadge';
import './OrderDetails.css';

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const {
        currentOrder,
        loading,
        error,
        fetchOrderById,
        fetchOrderItems,
        fetchOrderHistory,
        clearError,
        clearCurrentOrder
    } = useOrderAdminContext();

    const [activeTab, setActiveTab] = useState('details');
    const [orderItems, setOrderItems] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);

    useEffect(() => {
        if (orderId) {
            fetchOrderById(orderId);
            loadOrderItems();
            loadOrderHistory();
        }

        return () => {
            clearCurrentOrder();
        };
    }, [orderId]);

    const loadOrderItems = async () => {
        const result = await fetchOrderItems(orderId);
        if (result.success) {
            setOrderItems(result.data);
        }
    };

    const loadOrderHistory = async () => {
        const result = await fetchOrderHistory(orderId);
        if (result.success) {
            setOrderHistory(result.data);
        }
    };

    const handleBack = () => {
        navigate('/admin/orders');
    };

    if (loading && !currentOrder) {
        return (
            <div className="admin-od-page admin-od-loading">
                <div>Loading order details...</div>
            </div>
        );
    }

    if (!currentOrder && !loading) {
        return (
            <div className="admin-od-page">
                <div className="admin-od-not-found">
                    <h2>Order Not Found</h2>
                    <p>The order you're looking for doesn't exist.</p>
                    <button
                        onClick={handleBack}
                        className="admin-od-back-btn"
                        style={{ justifyContent: 'center', marginTop: '16px' }}
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-od-page">
            <div className="admin-od-container">
                <div className="admin-od-header">
                    <button
                        onClick={handleBack}
                        className="admin-od-back-btn"
                    >
                        <span>←</span> Back to Orders
                    </button>

                    <div className="admin-od-title-section">
                        <div className="admin-od-title-group">
                            <h1 className="admin-od-title">Order #{currentOrder?.order_id}</h1>
                            <StatusBadge status={currentOrder?.order_status} type="order" />
                        </div>
                        <span className="admin-od-date-badge">
                            Placed on {new Date(currentOrder?.placed_at).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="admin-od-actions">
                        <OrderModals
                            order={currentOrder}
                            onUpdate={loadOrderItems}
                        />
                    </div>
                </div>

                {error && (
                    <div className="admin-od-error-alert">
                        <p>{error}</p>
                        <button onClick={clearError} className="admin-close-error">✕</button>
                    </div>
                )}

                <div className="admin-od-tabs-container">
                    <div className="admin-od-tabs-list">
                        {['details', 'items', 'history', 'delivery', 'issues', 'feedback'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`admin-od-tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="admin-od-content">
                    {activeTab === 'details' && (
                        <OrderInfo
                            order={currentOrder}
                            history={orderHistory}
                        />
                    )}

                    {activeTab === 'items' && (
                        <OrderItems
                            items={orderItems}
                            orderId={orderId}
                            onUpdate={loadOrderItems}
                        />
                    )}

                    {activeTab === 'history' && (
                        <div className="admin-od-card">
                            <h2 className="admin-od-card-title">Order History</h2>
                            {orderHistory.length > 0 ? (
                                <div className="admin-od-history-list">
                                    {orderHistory.map((history) => (
                                        <div key={history.history_id} className="admin-od-history-item">
                                            <div className="admin-od-history-dot"></div>
                                            <div className="admin-od-history-content">
                                                <div>
                                                    <span className="admin-od-history-status">{history.status}</span>
                                                    <span className="admin-od-history-user">Updated by: {history.updated_by || 'System'}</span>
                                                </div>
                                                <span className="admin-od-history-date">
                                                    {new Date(history.updated_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="admin-od-empty-state">
                                    <p>No history available for this order.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'delivery' && (
                        <div className="admin-od-card">
                            <h2 className="admin-od-card-title">Delivery Information</h2>
                            <div className="admin-od-delivery-grid">
                                <div>
                                    <h3 className="admin-od-subtitle">Delivery Address</h3>
                                    {currentOrder?.address ? (
                                        <div className="admin-od-address-box">
                                            <p style={{ fontWeight: 600 }}>{currentOrder.address.street}</p>
                                            <p>{currentOrder.address.city}, {currentOrder.address.state}</p>
                                            <p>{currentOrder.address.postal_code}</p>
                                            <p>{currentOrder.address.country}</p>
                                        </div>
                                    ) : (
                                        <div className="admin-od-empty-state">
                                            <p>No address information available.</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="admin-od-subtitle">Delivery Status</h3>
                                    <div className="admin-od-status-box">
                                        <div style={{ marginBottom: '16px' }}>
                                            <StatusBadge status={currentOrder?.order_status} type="order" />
                                        </div>
                                        <p className="admin-od-info-row">
                                            <span>Delivery Person:</span> {currentOrder?.delivery_user_id ? `User #${currentOrder.delivery_user_id}` : 'Not assigned'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'issues' && (
                        <div className="admin-od-card">
                            <h2 className="admin-od-card-title">Order Issues</h2>
                            <div className="admin-od-empty-state">
                                <span className="admin-od-empty-icon">✓</span>
                                <p>No issues reported for this order.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'feedback' && (
                        <div className="admin-od-card">
                            <h2 className="admin-od-card-title">Customer Feedback</h2>
                            <div className="admin-od-empty-state">
                                <span className="admin-od-empty-icon">💬</span>
                                <p>No feedback available for this order.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;