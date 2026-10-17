import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCheckoutContext } from '../../context/CheckoutContext';
import { useCartContext } from '../../context/CartContext'; // Import cart context
import { toastSuccess } from '../../utils/customToast';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const [showTracking, setShowTracking] = useState(false);
  const [order, setOrder] = useState(null);
  const [isCartCleared, setIsCartCleared] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { resetCheckout } = useCheckoutContext();
  const { clearUserCart } = useCartContext(); // Get clear cart function

  useEffect(() => {
    // Get order data from navigation state or create mock data
    const orderData = location.state?.order || createMockOrder();
    setOrder(orderData);

    // Clear checkout state
    resetCheckout();

    // Clear cart after order confirmation
    const clearCartAfterOrder = async () => {
      if (!isCartCleared) {
        try {
          console.log('🛒 Clearing cart after successful order...');
          const result = await clearUserCart();

          if (result.success) {
            console.log('✅ Cart cleared successfully');
            setIsCartCleared(true);
          } else {
            console.warn('⚠️ Cart not cleared:', result.message);
            // Still mark as cleared to prevent infinite loops
            setIsCartCleared(true);
          }
        } catch (error) {
          console.error('❌ Error clearing cart:', error);
          setIsCartCleared(true); // Prevent retry
        }
      }
    };

    // Clear cart with a small delay to ensure order processing is complete
    const clearTimer = setTimeout(() => {
      clearCartAfterOrder();
    }, 1000);

    // Track order confirmation
    console.log('Order confirmed:', orderData);

    return () => {
      clearTimeout(clearTimer);
    };
  }, [location.state, resetCheckout, clearUserCart, isCartCleared]);

  const createMockOrder = () => {
    return {
      order_id: `ORD_${Date.now()}`,
      order_status: 'confirmed',
      total_amount: 149.97,
      items: [
        {
          variant_id: 1,
          product_name: 'Wireless Headphones',
          quantity: 1,
          price: 99.99
        },
        {
          variant_id: 2,
          product_name: 'Phone Case',
          quantity: 2,
          price: 24.99
        }
      ],
      address: {
        line1: '123 Main Street',
        city_name: 'New York',
        state_name: 'NY',
        pincode: '10001'
      },
      tracking_number: `TRK_${Date.now()}`,
      estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
  };

  const handleTrackOrder = () => {
    setShowTracking(true);
    toastSuccess('Tracking information loaded');
  };

  const handleViewOrder = () => {
    if (order) {
      navigate(`/orders/${order.order_id}`);
    }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleDownloadInvoice = () => {
    navigate(`/invoice/${order.order_id}`);
  };

  if (!order) {
    return (
      <div className="order-confirmation-page">
        <div className="confirmation-container">
          <div className="loading-message">
            <i className="fas fa-spinner fa-spin"></i>
            <h2>Loading Order Details...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-header">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase. Your order has been successfully placed.</p>
          <div className="order-number">
            Order #: <strong>{order.order_id}</strong>
          </div>
        </div>

        <div className="confirmation-content">
          <div className="confirmation-main">
            <div className="delivery-info">
              <h3>Delivery Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <i className="fas fa-truck"></i>
                  <div>
                    <h4>Order Status</h4>
                    <p className="status-confirmed">{order.order_status}</p>
                  </div>
                </div>
                <div className="info-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <h4>Shipping Address</h4>
                    <p>{order.address.line1}<br />
                      {order.address.city_name}, {order.address.state_name} {order.address.pincode}</p>
                  </div>
                </div>
                <div className="info-item">
                  <i className="fas fa-calendar-alt"></i>
                  <div>
                    <h4>Estimated Delivery</h4>
                    <p>{order.estimated_delivery}</p>
                  </div>
                </div>
              </div>
            </div>

            {showTracking && order.tracking_number && (
              <div className="tracking-preview">
                <h3>Tracking Information</h3>
                <div className="tracking-details">
                  <div className="tracking-number">
                    <strong>Tracking Number:</strong> {order.tracking_number}
                  </div>
                  <button
                    className="btn-track-full"
                    onClick={() => navigate(`/orders/${order.order_id}/track`)}
                  >
                    View Full Tracking Details
                  </button>
                </div>
              </div>
            )}

            <div className="order-summary-preview">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {order.items.map(item => (
                  <div key={item.variant_id} className="summary-item">
                    <span className="item-name">{item.product_name}</span>
                    <span className="item-quantity">Qty: {item.quantity}</span>
                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <strong>Total: ${order.total_amount.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <div className="confirmation-sidebar">
            <div className="next-steps">
              <h4>What's Next?</h4>
              <div className="steps-list">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h5>Order Processing</h5>
                    <p>We'll prepare your items for shipping</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h5>Shipping</h5>
                    <p>Your order will be shipped within 24 hours</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h5>Delivery</h5>
                    <p>Expected delivery in 3-5 business days</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="support-card">
              <h4>Need Help?</h4>
              <p>Our customer support team is here to help</p>
              <div className="support-options">
                <button className="support-btn">
                  <i className="fas fa-headset"></i>
                  Contact Support
                </button>
                <button className="support-btn">
                  <i className="fas fa-comment"></i>
                  Live Chat
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <button className="btn-secondary" onClick={handleContinueShopping}>
            <i className="fas fa-shopping-bag"></i>
            Continue Shopping
          </button>
          <button className="btn-secondary" onClick={handleDownloadInvoice}>
            <i className="fas fa-download"></i>
            Download Invoice
          </button>
          <button className="btn-primary" onClick={handleViewOrder}>
            <i className="fas fa-eye"></i>
            View Order Details
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate(`/orders/${order.order_id}/track`)}
          >
            <i className="fas fa-shipping-fast"></i>
            Track Your Order
          </button>
        </div>

        <div className="confirmation-footer">
          <div className="trust-badges">
            <div className="trust-badge">
              <i className="fas fa-shield-alt"></i>
              <span>Secure Payment</span>
            </div>
            <div className="trust-badge">
              <i className="fas fa-undo"></i>
              <span>Easy Returns</span>
            </div>
            <div className="trust-badge">
              <i className="fas fa-truck"></i>
              <span>Free Shipping</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;