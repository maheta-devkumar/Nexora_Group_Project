import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, ArrowRight } from 'lucide-react';
import './Widgets.css';

const RecentOrders = ({ orders = [], isLoading = false }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString || '—';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <AlertCircle size={16} />;
    const s = status.toLowerCase();
    if (['delivered','completed','paid'].includes(s)) 
      return <CheckCircle size={16} className="status-icon completed" />;
    if (['cancelled','failed','refunded'].includes(s)) 
      return <XCircle size={16} className="status-icon cancelled" />;
    if (['pending','processing'].includes(s)) 
      return <Clock size={16} className="status-icon pending" />;
    return <AlertCircle size={16} className="status-icon processing" />;
  };

  const getStatusColor = (status) => {
    if (!status) return 'gray';
    const s = status.toLowerCase();
    if (['delivered','completed','paid'].includes(s)) return 'completed';
    if (['cancelled','failed','refunded'].includes(s)) return 'cancelled';
    if (['pending','processing'].includes(s)) return 'pending';
    return 'processing';
  };

  const ordersToDisplay = orders && orders.length ? orders.slice(0, 5) : [
    { order_id: 1, order_no: 'ORD-1001', customer_name: 'John Doe', total_amount: 129.99, order_status: 'completed', placed_at: new Date() },
    { order_id: 2, order_no: 'ORD-1002', customer_name: 'Jane Smith', total_amount: 89.50, order_status: 'pending', placed_at: new Date() },
    { order_id: 3, order_no: 'ORD-1003', customer_name: 'Bob Johnson', total_amount: 250.00, order_status: 'processing', placed_at: new Date() },
    { order_id: 4, order_no: 'ORD-1004', customer_name: 'Alice Brown', total_amount: 75.25, order_status: 'completed', placed_at: new Date() },
    { order_id: 5, order_no: 'ORD-1005', customer_name: 'Charlie Wilson', total_amount: 199.99, order_status: 'cancelled', placed_at: new Date() },
  ];

  if (isLoading) {
    return (
      <div className="widget-card recent-orders-widget">
        <div className="widget-header">
          <h3 className="widget-title">Recent Orders</h3>
        </div>
        <div className="widget-content">
          {[...Array(5)].map((_, i) => (
            <div className="order-item skeleton" key={i}>
              <div className="skeleton-line small"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card recent-orders-widget">
      <div className="widget-header">
        <h3 className="widget-title">Recent Orders</h3>
        <button 
          className="view-all-btn"
          onClick={() => navigate('/admin/orders')}
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div className="widget-content">
        {ordersToDisplay.length > 0 ? (
          <div className="orders-list">
            {ordersToDisplay.map((order) => (
              <div className="order-item" key={order.order_id || order.id || Math.random()}>
                <div className="order-info">
                  <div className="order-header">
                    <span className="order-id">#{order.order_no || `ORD-${order.order_id}`}</span>
                    <span className="order-date">{formatDate(order.placed_at || order.created_at || order.created)}</span>
                  </div>
                  <span className="order-customer">
                    {order.customer_name || (order.user && `${order.user.first_name} ${order.user.last_name}`) || 'Customer'}
                  </span>
                </div>

                <div className="order-details">
                  <span className="order-amount">${(order.total_amount ?? order.total ?? 0).toFixed(2)}</span>
                  <div className={`order-status ${getStatusColor(order.order_status || order.status)}`}>
                    {getStatusIcon(order.order_status || order.status)}
                    <span className="status-text">{order.order_status || order.status || 'Pending'}</span>
                  </div>
                  <button 
                    className="view-order-btn" 
                    onClick={() => navigate(`/admin/orders/${order.order_id || order.id || order.order_no}`)}
                    title="View Order"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <AlertCircle size={48} />
            <p>No recent orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentOrders;