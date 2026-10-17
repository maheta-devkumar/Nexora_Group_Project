import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderContext } from '../../context/OrderContext';
import { toastInfo, toastError } from '../../utils/customToast';
import './Orders.css';

const Orders = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { orders, fetchUserOrders, loading } = useOrderContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserOrders(1, 10, activeFilter === 'all' ? null : activeFilter);
  }, [activeFilter]);

  // Derived Status Class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'placed': return 'status-placed';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const filteredOrders = orders?.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return order.order_id.toString().includes(searchLower) ||
      order.items.some(item => item.product_name.toLowerCase().includes(searchLower));
  }) || [];

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1>My Orders</h1>
        </div>

        <div className="orders-controls">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by Order ID or Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-tabs">
            {['all', 'PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(filter => (
              <button
                key={filter}
                className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'all' ? 'All Orders' : filter.charAt(0) + filter.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="orders-list">
          {loading && page === 1 ? (
            <div className="load-more-section">Loading orders...</div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <div key={order.order_id} className="order-card">
                <div className="order-header">
                  <div>
                    <div className="order-id">Order #{order.order_id}</div>
                    <div className="order-date">
                      {new Date(order.placed_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className={`order-status ${getStatusClass(order.order_status)}`}>
                    {order.order_status}
                  </div>
                </div>
                <div className="order-body">
                  <div className="order-items-preview">
                    {order.items.map((item, idx) => (
                      <img
                        key={idx}
                        src={item.product_image || 'https://via.placeholder.com/100'}
                        alt={item.product_name}
                        className="item-thumb"
                        title={item.product_name}
                      />
                    ))}
                  </div>
                </div>
                <div className="order-footer">
                  <div className="order-total">
                    Total: ₹{order.total_amount?.toLocaleString()}
                  </div>
                  <button
                    className="btn-view-order"
                    onClick={() => navigate(`/orders/${order.order_id}`)}
                  >
                    View Details
                  </button>
                  {order.order_status !== 'CANCELLED' && (
                    <button
                      className="btn-track-order"
                      onClick={() => navigate(`/orders/${order.order_id}/track`)}
                      style={{ marginLeft: '10px', background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Track Order
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-orders">
              <i className="fas fa-box-open"></i>
              <h3>No orders found</h3>
              <button className="btn-view-order" onClick={() => navigate('/products')}>Shop Now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;