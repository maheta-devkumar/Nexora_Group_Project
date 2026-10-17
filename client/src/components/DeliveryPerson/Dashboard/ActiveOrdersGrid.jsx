import React from 'react';
import './ActiveOrdersGrid.css';
import {
  MapPin,
  Clock,
  Package,
  Phone,
  Navigation,
  Check,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useDeliveryDashboardContext } from '../../../context/DeliveryPersonDashboardContext';

const ActiveOrdersGrid = () => {
  const {
    activeDeliveries,
    loading,
    markAsPicked,
    markAsDelivered,
    initiateCustomerCall,
    fetchNavigationDetails,
    addLog
  } = useDeliveryDashboardContext();

  const handleAction = async (orderId, action) => {
    console.log(`Action: ${action} on order ${orderId}`);

    try {
      switch (action) {
        case 'call':
          await initiateCustomerCall(orderId);
          addLog(`Call initiated for order ${orderId}`, 'success');
          break;
        case 'navigate':
          const navResult = await fetchNavigationDetails(orderId);
          if (navResult.success) {
            window.open(navResult.data.google_maps_url, '_blank');
            addLog(`Navigation opened for order ${orderId}`, 'success');
          }
          break;
        case 'mark-picked':
          const pickResult = await markAsPicked(orderId);
          if (pickResult.success) {
            addLog(`Order ${orderId} marked as picked`, 'success');
          }
          break;
        case 'mark-delivered':
          const deliverResult = await markAsDelivered(orderId);
          if (deliverResult.success) {
            addLog(`Order ${orderId} marked as delivered`, 'success');
          }
          break;
        default:
          console.log(`Unknown action: ${action}`);
      }
    } catch (error) {
      addLog(`Failed to perform ${action} on order ${orderId}: ${error.message}`, 'error');
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'assigned':
      case 'pending':
        return 'dp-status-pending';
      case 'out_for_delivery':
      case 'transit':
        return 'dp-status-transit';
      case 'picked_up':
      case 'picked':
        return 'dp-status-picked';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ASSIGNED': return 'Pending Pickup';
      case 'PICKED_UP': return 'Picked Up';
      case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
      default: return status || 'Unknown';
    }
  };

  const getActionButton = (orderId, action) => {
    switch (action) {
      case 'call':
        return (
          <button
            className="dp-btn dp-btn-secondary"
            onClick={() => handleAction(orderId, 'call')}
            disabled={loading}
          >
            <Phone size={16} />
            Call
          </button>
        );
      case 'navigate':
        return (
          <button
            className="dp-btn dp-btn-secondary"
            onClick={() => handleAction(orderId, 'navigate')}
            disabled={loading}
          >
            <Navigation size={16} />
            Navigate
          </button>
        );
      case 'mark-picked':
        return (
          <button
            className="dp-btn dp-btn-primary"
            onClick={() => handleAction(orderId, 'mark-picked')}
            disabled={loading}
          >
            <Check size={16} />
            Mark Picked
          </button>
        );
      case 'mark-delivered':
        return (
          <button
            className="dp-btn dp-btn-success"
            onClick={() => handleAction(orderId, 'mark-delivered')}
            disabled={loading}
          >
            <CheckCircle size={16} />
            Mark Delivered
          </button>
        );
      default:
        return null;
    }
  };

  // Get actions based on status
  const getActionsForStatus = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return ['call', 'navigate', 'mark-picked'];
      case 'PICKED_UP':
        return ['call', 'navigate', 'mark-delivered'];
      case 'OUT_FOR_DELIVERY':
        return ['call', 'navigate', 'mark-delivered'];
      default:
        return ['call', 'navigate'];
    }
  };

  // Format amount for display
  const formatAmount = (amount) => {
    if (!amount) return null;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading && activeDeliveries.length === 0) {
    return (
      <div className="dp-active-orders-grid">
        <div className="dp-section-header">
          <h3>Active Deliveries</h3>
          <button className="dp-view-all-btn">
            View All
          </button>
        </div>
        <div className="dp-loading-state">
          <p>Loading active deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-active-orders-grid">
      <div className="dp-section-header">
        <h3>Active Deliveries ({activeDeliveries.length})</h3>
        <button className="dp-view-all-btn">
          View All
        </button>
      </div>

      <div className="dp-orders-list">
        {activeDeliveries.length === 0 ? (
          <div className="dp-no-orders">
            <p>No active deliveries at the moment.</p>
          </div>
        ) : (
          activeDeliveries.map((order) => {
            const actions = getActionsForStatus(order.status);

            return (
              <div
                key={order.id}
                className={`dp-order-card ${order.priority ? 'urgent' : ''}`}
              >
                <div className="dp-order-header">
                  <div className="dp-order-id-group">
                    <span className="dp-order-number">#{order.id}</span>
                    {order.priority && (
                      <span className="dp-order-priority">{order.priority}</span>
                    )}
                  </div>
                  <span className={`dp-order-status ${getStatusClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div className="dp-order-body">
                  <div className="dp-customer-info">
                    <img
                      src={order.customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.customer.name)}&background=10b981&color=fff`}
                      alt={order.customer.name}
                      className="dp-customer-avatar"
                    />
                    <div className="dp-customer-details">
                      <strong>{order.customer.name}</strong>
                      <span>{order.customer.phone}</span>
                    </div>
                  </div>

                  <div className="dp-delivery-info">
                    <div className="dp-info-item">
                      <MapPin size={16} />
                      <span>{order.delivery_location} - {order.distance}</span>
                    </div>
                    <div className="dp-info-item">
                      <Clock size={16} />
                      <span>Expected: {order.expected_time}</span>
                    </div>
                    <div className="dp-info-item">
                      <Package size={16} />
                      <span>
                        {order.items} item{order.items > 1 ? 's' : ''}
                        {order.payment_type === 'cod' && order.amount && ` • COD ${formatAmount(order.amount)}`}
                        {order.payment_type === 'prepaid' && ' • Prepaid'}
                      </span>
                    </div>
                  </div>

                  {order.progress > 0 && (
                    <div className="dp-delivery-progress">
                      <div className="dp-progress-bar">
                        <div
                          className="dp-progress-fill"
                          style={{ width: `${order.progress}%` }}
                        ></div>
                      </div>
                      <span className="dp-progress-text">
                        <span>{order.progress}% Complete</span>
                        <span>{order.eta || 'In progress'}</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="dp-order-actions">
                  {actions.map((action) => (
                    <React.Fragment key={action}>
                      {getActionButton(order.order_id, action)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActiveOrdersGrid;
