import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderContext } from '../../context/OrderContext';
import OrderTimeline from '../../components/Checkout/OrderTimeline';
import { toastInfo } from '../../utils/customToast';
import './TrackOrder.css';

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { fetchOrderById, currentOrder, loading, error } = useOrderContext();
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (orderId) {
      console.log(`Fetching order with ID: ${orderId}`);
      fetchOrderById(orderId);
    }
  }, [orderId, fetchOrderById]);

  const handleShareTracking = () => {
    const trackingUrl = `${window.location.origin}/orders/${orderId}/track`;
    navigator.clipboard.writeText(trackingUrl);
    toastInfo('Tracking link copied to clipboard!');
  };

  const handleContactCarrier = () => {
    toastInfo('Opening carrier contact information');
  };

  const handleContactSupport = () => {
    navigate('/support');
  };

  const handleUpdateAddress = () => {
    navigate('/addresses');
  };

  const handleViewInstructions = () => {
    setShowInstructions(true);
  };

  const closeInstructions = () => {
    setShowInstructions(false);
  };

  // Check if loading is true
  if (loading) {
    return (
      <div className="track-order-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading tracking information...</p>
        </div>
      </div>
    );
  }

  // Show error if exists
  if (error) {
    return (
      <div className="track-order-page">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Error Loading Order</h2>
          <p>{error}</p>
          <button
            className="btn-retry"
            onClick={() => fetchOrderById(orderId)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show message if no order found
  if (!currentOrder) {
    return (
      <div className="track-order-page">
        <div className="error-container">
          <i className="fas fa-search"></i>
          <h2>Order Not Found</h2>
          <p>We couldn't find order #{orderId}</p>
          <button
            className="btn-back"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Helper function to create timeline from order status
  const getTimelineFromOrder = () => {
    const baseTimeline = [
      {
        id: 1,
        title: 'Order Placed',
        description: 'Your order has been confirmed',
        date: new Date(currentOrder.placed_at).toLocaleString(),
        status: 'completed'
      }
    ];

    // Add Processing step if applicable
    if (currentOrder.order_status === 'PROCESSING' ||
      currentOrder.order_status === 'SHIPPED' ||
      currentOrder.order_status === 'DELIVERED') {
      baseTimeline.push({
        id: 2,
        title: 'Order Processed',
        description: 'Seller is preparing your order',
        date: new Date(new Date(currentOrder.placed_at).getTime() + 2 * 60 * 60 * 1000).toLocaleString(),
        status: 'completed'
      });
    }

    // Add Shipped step if applicable
    if (currentOrder.order_status === 'SHIPPED' ||
      currentOrder.order_status === 'DELIVERED') {
      baseTimeline.push({
        id: 3,
        title: 'Shipped',
        description: 'Your order has been shipped',
        date: new Date(new Date(currentOrder.placed_at).getTime() + 4 * 60 * 60 * 1000).toLocaleString(),
        status: 'completed'
      });
    }

    // Add Delivery steps if applicable
    if (currentOrder.order_status === 'DELIVERED') {
      baseTimeline.push({
        id: 4,
        title: 'Out for Delivery',
        description: 'Your order is out for delivery',
        date: new Date(new Date(currentOrder.placed_at).getTime() + 6 * 60 * 60 * 1000).toLocaleString(),
        status: 'completed'
      });
      baseTimeline.push({
        id: 5,
        title: 'Delivered',
        description: 'Your order has been delivered',
        date: new Date(new Date(currentOrder.placed_at).getTime() + 8 * 60 * 60 * 1000).toLocaleString(),
        status: 'completed'
      });
    } else {
      // Add pending steps based on current status
      if (currentOrder.order_status === 'PLACED') {
        baseTimeline.push({
          id: 2,
          title: 'Processing',
          description: 'Your order is being processed',
          date: 'Pending',
          status: 'pending'
        });
      }
      if (currentOrder.order_status === 'PROCESSING') {
        baseTimeline.push({
          id: 3,
          title: 'Shipping',
          description: 'Your order will be shipped soon',
          date: 'Pending',
          status: 'pending'
        });
      }
    }

    return baseTimeline;
  };

  const timeline = getTimelineFromOrder();

  return (
    <div className="track-order-page">
      <div className="track-order-container">
        {/* Header Section */}
        <div className="track-order-header">
          <h1>Track Your Order</h1>
          <p className="order-number">Order #{orderId}</p>
          <div className="status-badge-large">
            <span className={`status-${currentOrder.order_status.toLowerCase()}`}>
              {currentOrder.order_status}
            </span>
          </div>
        </div>

        {/* Tracking Overview */}
        <div className="tracking-overview">
          <div className="tracking-card">
            <div className="tracking-info">
              <div className="tracking-number">
                <h3><i className="fas fa-hashtag"></i> Order ID</h3>
                <p>{orderId}</p>
              </div>
              <div className="carrier-info">
                <h3><i className="fas fa-truck"></i> Carrier</h3>
                <p>{currentOrder.tracking_number ? 'Standard Shipping' : 'Not Shipped Yet'}</p>
              </div>
              <div className="estimated-delivery">
                <h3><i className="fas fa-calendar-alt"></i> Order Date</h3>
                <p>{new Date(currentOrder.placed_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              {currentOrder.tracking_number && (
                <div className="tracking-number-display">
                  <h3><i className="fas fa-barcode"></i> Tracking Number</h3>
                  <p className="tracking-code">{currentOrder.tracking_number}</p>
                </div>
              )}
            </div>

            <div className="tracking-actions">
              <button
                className="btn-share-tracking"
                onClick={handleShareTracking}
              >
                <i className="fas fa-share-alt"></i>
                Share Tracking
              </button>
              <button
                className="btn-contact-carrier"
                onClick={handleContactCarrier}
              >
                <i className="fas fa-phone"></i>
                Contact Carrier
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="tracking-timeline-section">
          <h2><i className="fas fa-road"></i> Order Journey</h2>
          <div className="timeline-container">
            <OrderTimeline
              status={currentOrder.order_status.toLowerCase()}
              timeline={timeline}
            />
          </div>
        </div>

        {/* Order Details */}
        <div className="order-details-section">
          <h2><i className="fas fa-box-open"></i> Order Details</h2>
          <div className="order-items">
            {currentOrder.items && currentOrder.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-image">
                  <div className="image-placeholder">
                    <i className="fas fa-box"></i>
                  </div>
                </div>
                <div className="item-info">
                  <h4>{item.product_name || 'Product'}</h4>
                  {item.variant_name && item.variant_name !== 'Default' && (
                    <p className="variant">Variant: {item.variant_name}</p>
                  )}
                  <p className="quantity">Quantity: {item.quantity}</p>
                  <p className="price">Price: ₹{item.price?.toLocaleString()}</p>
                </div>
                <div className="item-total">
                  <p>₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="tracking-help-section">
          <h2><i className="fas fa-question-circle"></i> Need Help?</h2>
          <div className="help-cards">
            <div className="help-card">
              <i className="fas fa-headset"></i>
              <h4>Customer Support</h4>
              <p>Contact our support team for any questions about your order</p>
              <button className="btn-contact-support" onClick={handleContactSupport}>
                Contact Support
              </button>
            </div>
            <div className="help-card">
              <i className="fas fa-box-open"></i>
              <h4>Delivery Instructions</h4>
              <p>Make sure someone is available to receive the package</p>
              <button className="btn-delivery-info" onClick={handleViewInstructions}>
                View Instructions
              </button>
            </div>
            <div className="help-card">
              <i className="fas fa-map-marker-alt"></i>
              <h4>Delivery Address</h4>
              <p>
                {currentOrder.address?.line1 || 'Address not available'},
                {currentOrder.address?.city_name || ''},
                {currentOrder.address?.state_name || ''}
                {currentOrder.address?.pincode || ''}
              </p>
              <button className="btn-update-address" onClick={handleUpdateAddress}>
                Update Address
              </button>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="order-summary-section">
          <h2><i className="fas fa-file-invoice-dollar"></i> Order Summary</h2>
          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{(currentOrder.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>₹{(currentOrder.delivery_fee || 0).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Tax Amount</span>
              <span>₹{(currentOrder.tax_amount || 0).toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount</span>
              <span>₹{(currentOrder.total_amount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Instructions Modal */}
      {showInstructions && (
        <div className="modal-overlay" onClick={closeInstructions}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delivery Instructions</h2>
              <button className="close-btn" onClick={closeInstructions}>×</button>
            </div>
            <div className="modal-body">
              <ul>
                <li><i className="fas fa-check-circle"></i> Please ensure someone is available at the address to receive the package.</li>
                <li><i className="fas fa-check-circle"></i> If you are not available, the courier will attempt delivery again the next day.</li>
                <li><i className="fas fa-check-circle"></i> You can check the package contents before sharing the OTP (if applicable).</li>
                <li><i className="fas fa-check-circle"></i> For contactless delivery, please leave a note at your door.</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={closeInstructions}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;