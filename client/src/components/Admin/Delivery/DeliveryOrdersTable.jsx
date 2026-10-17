import React, { useState, useEffect, useMemo } from 'react';
import { useDeliveryContext } from '../../../context/DeliveryContext';
import { useOrderAdminContext } from '../../../context/OrderAdminContext';
import AssignDeliveryModal from './AssignDeliveryModal';
import DeliveryTimelineModal from './DeliveryTimelineModal';
import './DeliveryOrdersTable.css';

const DeliveryOrdersTable = () => {
  const { 
    adminDeliveries = [], 
    adminGetAllDeliveries, 
    adminUpdateDeliveryStatus,
    adminReassignDeliveryPerson,
    loading 
  } = useDeliveryContext();

  const { fetchAllOrders } = useOrderAdminContext();

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    adminGetAllDeliveries();
    fetchAllOrders();
  }, [adminGetAllDeliveries, fetchAllOrders]);

  const handleAssign = (delivery) => {
    if (!delivery) return;
    setSelectedDelivery(delivery);
    setShowAssignModal(true);
  };

  const handleTimeline = (delivery) => {
    if (!delivery) return;
    setSelectedDelivery(delivery);
    setShowTimelineModal(true);
  };

  const handleStatusUpdate = async (deliveryId, status) => {
    if (!deliveryId) return;
    const result = await adminUpdateDeliveryStatus(deliveryId, status);
    if (result.success) {
      adminGetAllDeliveries();
    }
  };

  // Safe string conversion function
  const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    try {
      return String(value);
    } catch (err) {
      console.error('Failed to convert value to string:', value, err);
      return '';
    }
  };

  // Safe toLowerCase function
  const safeToLowerCase = (value) => {
    const str = safeToString(value);
    return str.toLowerCase();
  };

  // Memoized filtered deliveries
  const filteredDeliveries = useMemo(() => {
    if (!Array.isArray(adminDeliveries)) return [];
    
    return adminDeliveries.filter(delivery => {
      if (!delivery || typeof delivery !== 'object') return false;
      
      // Safe conversion of all values to strings
      const orderId = safeToString(delivery.order_id);
      const customerName = safeToString(delivery.customer_name);
      const deliveryPersonName = safeToString(delivery.delivery_person_name);
      const status = safeToString(delivery.status);
      
      const searchTermLower = safeToLowerCase(searchTerm);
      const matchesSearch = 
        safeToLowerCase(orderId).includes(searchTermLower) ||
        safeToLowerCase(customerName).includes(searchTermLower) ||
        safeToLowerCase(deliveryPersonName).includes(searchTermLower);
      
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [adminDeliveries, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    const statusStr = safeToString(status);
    if (!statusStr) return null;
    
    const statusConfig = {
      'PENDING': { color: '#FF9800', label: 'Pending' },
      'ASSIGNED': { color: '#2196F3', label: 'Assigned' },
      'PICKED_UP': { color: '#9C27B0', label: 'Picked Up' },
      'OUT_FOR_DELIVERY': { color: '#3F51B5', label: 'Out for Delivery' },
      'DELIVERED': { color: '#4CAF50', label: 'Delivered' },
      'FAILED': { color: '#F44336', label: 'Failed' },
      'CANCELLED': { color: '#9E9E9E', label: 'Cancelled' }
    };
    
    const config = statusConfig[statusStr] || { color: '#757575', label: statusStr };
    
    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: config.color + '20',
          color: config.color,
          borderColor: config.color
        }}
      >
        {config.label}
      </span>
    );
  };

  // Safe substring function
  const safeSubstring = (text, start, end) => {
    const str = safeToString(text);
    if (str.length <= end) return str;
    return str.substring(start, end) + '...';
  };

  return (
    <div className="delivery-orders-table">
      {/* Header with Filters */}
      <div className="table-header">
        <h2>Delivery Orders</h2>
        
        <div className="table-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search deliveries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              disabled={loading}
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <button 
            className="refresh-btn"
            onClick={adminGetAllDeliveries}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="table-loading">
            <div className="spinner"></div>
            <p>Loading deliveries...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📦</div>
            <p>No deliveries found</p>
            {searchTerm && (
              <p className="search-hint">Try a different search term or clear filters</p>
            )}
          </div>
        ) : (
          <table className="delivery-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Delivery Address</th>
                <th>Delivery Person</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((delivery, index) => {
                // Safe extraction of all values
                const orderId = safeToString(delivery.order_id);
                const customerName = safeToString(delivery.customer_name);
                const customerPhone = safeToString(delivery.customer_phone);
                const deliveryAddress = safeToString(delivery.delivery_address);
                const deliveryPersonName = safeToString(delivery.delivery_person_name);
                const deliveryPersonRating = safeToString(delivery.delivery_person_rating);
                const status = safeToString(delivery.status);
                const createdAt = delivery.created_at;
                const deliveryId = delivery.delivery_id;
                const deliveryPersonId = delivery.delivery_person_id;
                
                return (
                  <tr key={deliveryId || index}>
                    <td className="order-id">
                      <span className="order-id-text">{orderId || 'N/A'}</span>
                    </td>
                    <td className="customer-cell">
                      <div className="customer-info">
                        <div className="customer-name">{customerName || 'Unknown'}</div>
                        <div className="customer-phone">{customerPhone || 'No phone'}</div>
                      </div>
                    </td>
                    <td className="address-cell">
                      {deliveryAddress ? (
                        <div className="address-text">
                          {safeSubstring(deliveryAddress, 0, 40)}
                        </div>
                      ) : (
                        <span className="no-address">No address</span>
                      )}
                    </td>
                    <td className="delivery-person-cell">
                      {deliveryPersonName ? (
                        <div className="dp-info">
                          <div className="dp-name">{deliveryPersonName}</div>
                          <div className="dp-rating">
                            ⭐ {deliveryPersonRating || 'N/A'}
                          </div>
                        </div>
                      ) : (
                        <button 
                          className="assign-btn-small"
                          onClick={() => handleAssign(delivery)}
                          disabled={loading}
                        >
                          Assign
                        </button>
                      )}
                    </td>
                    <td>
                      {getStatusBadge(status)}
                    </td>
                    <td className="date-cell">
                      {createdAt && !isNaN(new Date(createdAt).getTime())
                        ? new Date(createdAt).toLocaleDateString()
                        : 'Unknown'
                      }
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        {!deliveryPersonId && (
                          <button
                            className="action-btn assign-action"
                            onClick={() => handleAssign(delivery)}
                            title="Assign Delivery Person"
                            disabled={loading}
                          >
                            👤 Assign
                          </button>
                        )}
                        <button
                          className="action-btn timeline-action"
                          onClick={() => handleTimeline(delivery)}
                          title="View Timeline"
                          disabled={loading || !deliveryId}
                        >
                          📋 Timeline
                        </button>
                        {deliveryPersonId && status !== 'DELIVERED' && (
                          <select
                            className="status-update-select"
                            value={status || 'PENDING'}
                            onChange={(e) => handleStatusUpdate(deliveryId, e.target.value)}
                            disabled={loading}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="PICKED_UP">Picked Up</option>
                            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="FAILED">Failed</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showAssignModal && selectedDelivery && (
        <AssignDeliveryModal
          delivery={selectedDelivery}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDelivery(null);
          }}
          onSuccess={() => {
            adminGetAllDeliveries();
            setShowAssignModal(false);
            setSelectedDelivery(null);
          }}
        />
      )}

      {showTimelineModal && selectedDelivery && selectedDelivery.delivery_id && (
        <DeliveryTimelineModal
          deliveryId={selectedDelivery.delivery_id}
          onClose={() => {
            setShowTimelineModal(false);
            setSelectedDelivery(null);
          }}
        />
      )}
    </div>
  );
};

export default DeliveryOrdersTable;