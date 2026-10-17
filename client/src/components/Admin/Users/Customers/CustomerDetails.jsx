import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomerContext } from '../../../../context/CustomerContext';
import {
  User, Mail, Phone, Calendar, DollarSign, Package,
  ChevronLeft, Edit, ShoppingBag, Clock, CheckCircle, XCircle,
  Activity, CreditCard, MapPin, History
} from 'lucide-react';
import './CustomerDetails.css';
import AdminLayout from '../../../Layout/AdminLayout';

const CustomerDetails = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const {
    currentCustomer,
    loading,
    error,
    fetchCustomerById,
    fetchCustomerOrders,
    fetchCustomerStats
  } = useCustomerContext();

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (customerId) {
      fetchCustomerById(customerId);
      loadCustomerData();
    }
  }, [customerId]);

  // Helper function to get customer name
  const getCustomerName = (customer) => {
    if (!customer) return 'Unknown Customer';

    // First try to use full_name if it exists
    if (customer.full_name && customer.full_name !== 'Unknown Customer') {
      return customer.full_name;
    }

    // Otherwise combine first_name and last_name
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }

    // Fallback to email or unknown
    return customer.email ? `Customer (${customer.email})` : 'Unknown Customer';
  };

  // Helper function to get initials for avatar
  const getCustomerInitials = (customer) => {
    const name = getCustomerName(customer);
    if (name && name !== 'Unknown Customer') {
      // Get first letter of each word
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
    }
    return customer?.email ? customer.email.charAt(0).toUpperCase() : 'C';
  };

  const loadCustomerData = async () => {
    // Load orders if needed
    const ordersResult = await fetchCustomerOrders(customerId);
    if (ordersResult.success) setOrders(ordersResult.data || []);

    // Load stats if needed
    const statsResult = await fetchCustomerStats(customerId);
    if (statsResult.success) setStats(statsResult.data);
  };

  if (loading) {
    return (
      <div className="admin-cd-loading">
        <div className="admin-cd-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-cd-error">
        <div className="admin-cd-error-box">
          <p>{error}</p>
          <button onClick={() => navigate('/admin/users/customers')} className="admin-cd-btn-view">
            <ChevronLeft size={16} /> Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentCustomer) {
    return (
      <div className="admin-cd-error">
        <h3 className="admin-cd-card-title">Customer not found</h3>
        <button onClick={() => navigate('/admin/users/customers')} className="admin-cd-btn-view">
          <ChevronLeft size={16} /> Back to Customers
        </button>
      </div>
    );
  }

  const customerName = getCustomerName(currentCustomer);
  const customerInitials = getCustomerInitials(currentCustomer);

  return (
    <AdminLayout>
      <div className="admin-cd-container">
        <div className="admin-cd-header">
          <button className="admin-cd-back-btn" onClick={() => navigate('/admin/users/customers')}>
            <ChevronLeft size={20} /> Back to Customers
          </button>

          <button className="admin-cd-action-btn" onClick={() => navigate(`/admin/users/customers/edit/${customerId}`)}>
            <Edit size={16} /> Edit Customer
          </button>
        </div>

        <div className="admin-cd-profile-card">
          <div className="admin-cd-profile-content">
            <div className="admin-cd-avatar">
              {customerInitials}
            </div>
            <div className="admin-cd-info-col">
              <h1 className="admin-cd-name">{customerName}</h1>
              <p className="admin-cd-id">Customer ID: #{currentCustomer.user_id}</p>
              <div className="admin-cd-tags">
                <span className={`admin-cd-status-badge ${currentCustomer.is_active ? 'active' : 'inactive'}`}>
                  {currentCustomer.is_active ? 'Active' : 'Inactive'}
                </span>
                {currentCustomer.created_at && (
                  <span className="admin-cd-date-badge">
                    <Calendar size={12} /> Member since {new Date(currentCustomer.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-cd-tabs">
          <button
            className={`admin-cd-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={16} /> Overview
          </button>
          <button
            className={`admin-cd-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={16} /> Orders ({orders.length})
          </button>
          <button
            className={`admin-cd-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <History size={16} /> Activity
          </button>
        </div>

        <div className="admin-cd-content">
          {activeTab === 'overview' && (
            <div className="admin-cd-grid">
              <div className="admin-cd-card">
                <h3 className="admin-cd-card-title">
                  <User size={18} /> Customer Information
                </h3>
                <div>
                  <div className="admin-cd-info-row">
                    <span className="admin-cd-label">Full Name</span>
                    <span className="admin-cd-value">{customerName}</span>
                  </div>
                  {currentCustomer.first_name && (
                    <div className="admin-cd-info-row">
                      <span className="admin-cd-label">First Name</span>
                      <span className="admin-cd-value">{currentCustomer.first_name}</span>
                    </div>
                  )}
                  {currentCustomer.last_name && (
                    <div className="admin-cd-info-row">
                      <span className="admin-cd-label">Last Name</span>
                      <span className="admin-cd-value">{currentCustomer.last_name}</span>
                    </div>
                  )}
                  <div className="admin-cd-info-row">
                    <span className="admin-cd-label">Email</span>
                    <span className="admin-cd-value">{currentCustomer.email || 'Not provided'}</span>
                  </div>
                  <div className="admin-cd-info-row">
                    <span className="admin-cd-label">Phone</span>
                    <span className="admin-cd-value">{currentCustomer.phone || 'Not provided'}</span>
                  </div>
                  <div className="admin-cd-info-row">
                    <span className="admin-cd-label">Customer ID</span>
                    <span className="admin-cd-value" style={{ fontFamily: 'monospace' }}>#{currentCustomer.user_id}</span>
                  </div>
                </div>
              </div>

              <div>
                {stats && (
                  <div className="admin-cd-stats-row">
                    <div className="admin-cd-stat-box">
                      <div className="admin-cd-stat-icon orders">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="admin-cd-stat-val">{stats.total_orders || 0}</p>
                        <p className="admin-cd-stat-lbl">Total Orders</p>
                      </div>
                    </div>
                    <div className="admin-cd-stat-box">
                      <div className="admin-cd-stat-icon spent">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="admin-cd-stat-val">${(stats.total_spent || 0).toFixed(2)}</p>
                        <p className="admin-cd-stat-lbl">Total Spent</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="admin-cd-card">
                  <h3 className="admin-cd-card-title">
                    <History size={18} /> Recent Activity
                  </h3>
                  <div>
                    <div className="admin-cd-activity-item">
                      <div className="admin-cd-act-icon">
                        <ShoppingBag size={14} />
                      </div>
                      <div>
                        <p className="admin-cd-act-text">Last order placed</p>
                        <p className="admin-cd-act-time">
                          {orders.length > 0 ?
                            new Date(orders[0]?.created_at || new Date()).toLocaleDateString() :
                            'No orders yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="admin-cd-card">
              <div className="admin-cd-header-row">
                <h3 className="admin-cd-card-title">Order History</h3>
                <span className="admin-cd-badge-pill">{orders.length} orders found</span>
              </div>

              {orders.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <h4>No orders yet</h4>
                  <p>This customer hasn't placed any orders yet.</p>
                </div>
              ) : (
                <div className="admin-cd-table-container">
                  <table className="admin-cd-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.order_id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#4f46e5' }}>#{order.order_id}</td>
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`admin-cd-order-status ${order.status?.toLowerCase() || 'processing'}`}>
                              {order.status || 'Processing'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>${order.total_amount?.toFixed(2) || '0.00'}</td>
                          <td>
                            <button
                              className="admin-cd-btn-view"
                              onClick={() => navigate(`/admin/orders/${order.order_id}`)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="admin-cd-card">
              <h3 className="admin-cd-card-title">Customer Activity Log</h3>
              <div>
                {orders.length > 0 ? (
                  orders.slice(0, 10).map((order, index) => (
                    <div key={index} className="admin-cd-activity-item">
                      <div className="admin-cd-act-icon">
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <p className="admin-cd-act-text">
                          Placed order <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{order.order_id}</span> for <span style={{ fontWeight: 700 }}>${order.total_amount?.toFixed(2)}</span>
                        </p>
                        <span className="admin-cd-act-time">{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontStyle: 'italic' }}>
                    <p>No recent activity recorded</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CustomerDetails;