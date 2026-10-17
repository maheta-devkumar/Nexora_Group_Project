import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderContext } from '../../context/OrderContext';
import OrderStatusBadge from '../../components/Orders/OrderStatusBadge';
import OrderTimeline from '../../components/Checkout/OrderTimeline';
import CancelOrderModal from '../../components/Orders/CancelOrderModal';
import ReturnOrderModal from '../../components/Orders/ReturnOrderModal';
import { toastSuccess, toastInfo, toastError } from '../../utils/customToast';
import './OrderDetail.css';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [orderError, setOrderError] = useState(null); // Add local error state

  const { fetchOrderById, currentOrder, cancelOrder, createReturnRequest, loading } = useOrderContext();

  useEffect(() => {
    if (orderId) {
      console.log(`📋 OrderDetail: Fetching order with ID: ${orderId}`);

      // Extract numeric ID if it's in format like "ORD_001"
      let numericOrderId = orderId;

      // If orderId is something like "ORD_001", extract the number
      if (typeof orderId === 'string' && orderId.startsWith('ORD_')) {
        const match = orderId.match(/ORD_(\d+)/);
        if (match && match[1]) {
          numericOrderId = parseInt(match[1], 10);
          console.log(`🔢 Extracted numeric ID: ${numericOrderId}`);
        }
      }

      // Convert to number if possible
      if (!isNaN(parseInt(numericOrderId, 10))) {
        numericOrderId = parseInt(numericOrderId, 10);
      }

      fetchOrderById(numericOrderId).then(result => {
        if (!result.success) {
          setOrderError(result.message);
          toastError(`Failed to load order: ${result.message}`);
        }
      });
    }
  }, [orderId, fetchOrderById]);

  const handleDownloadInvoice = () => {
    navigate(`/invoice/${currentOrder.order_id}`);
  };

  const handleReorder = () => {
    toastInfo('Adding all items to cart');
  };

  const handleContactSupport = () => {
    navigate('/support');
    toastInfo('Redirecting to support center...');
  };

  const handleCancelOrder = async (cancelData) => {
    const result = await cancelOrder(orderId);
    if (result.success) {
      setShowCancelModal(false);
      toastSuccess('Order cancellation requested');
    }
  };

  const handleReturnRequest = async (returnData) => {
    const result = await createReturnRequest(orderId, returnData);
    if (result.success) {
      setShowReturnModal(false);
      toastSuccess('Return request submitted');
    }
  };

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-container">
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin fa-2x"></i>
            <h3>Loading order details...</h3>
            <p>Order ID: {orderId}</p>
          </div>
        </div>
      </div>
    );
  }

  if (orderError) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-container">
          <div className="error-state">
            <i className="fas fa-exclamation-triangle fa-2x"></i>
            <h3>Failed to load order</h3>
            <p>{orderError}</p>
            <button
              className="btn-back"
              onClick={() => navigate('/orders')}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-container">
          <div className="error-state">
            <i className="fas fa-question-circle fa-2x"></i>
            <h3>Order not found</h3>
            <p>Order ID: {orderId} not found or you don't have permission to view it.</p>
            <button
              className="btn-back"
              onClick={() => navigate('/orders')}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canCancel = ['PLACED', 'PROCESSING'].includes(currentOrder?.order_status);
  const canReturn = ['DELIVERED'].includes(currentOrder?.order_status);

  return (
    <div className="order-detail-page">
      <div className="order-detail-container">
        <div className="order-detail-header">
          <button
            className="btn-back"
            onClick={() => navigate('/orders')}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Orders
          </button>

          <div className="header-actions">
            <button
              className="btn-download-invoice"
              onClick={handleDownloadInvoice}
            >
              <i className="fas fa-download"></i>
              Download Invoice
            </button>

            <button
              className="btn-reorder-all"
              onClick={handleReorder}
            >
              <i className="fas fa-redo"></i>
              Reorder All
            </button>
          </div>
        </div>

        <div className="order-detail-content">
          <div className="order-main-info">
            <div className="order-header-card">
              <div className="order-basic-info">
                <h1>Order #{currentOrder.order_id}</h1>
                <p>Placed on {new Date(currentOrder.placed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              <OrderStatusBadge status={currentOrder.order_status.toLowerCase()} />
            </div>

            <div className="order-items-section">
              <h3>Order Items</h3>
              <div className="order-items-list">
                {(currentOrder.items || []).map(item => (
                  <div key={item.variant_id || item.id} className="order-detail-item">
                    <div className="item-image">
                      <div className="image-placeholder">
                        <i className="fas fa-box"></i>
                      </div>
                    </div>
                    <div className="item-details">
                      <h4>{item.product_name || 'Product'}</h4>
                      <div className="item-attributes">
                        {item.variant_name && <span>Variant: {item.variant_name}</span>}
                      </div>
                      <div className="item-price">
                        ${(item.price || 0).toFixed(2)} × {item.quantity || 1}
                      </div>
                    </div>
                    <div className="item-total">
                      ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-actions-section">
              <h3>Order Actions</h3>
              <div className="action-buttons">
                {canCancel && (
                  <button
                    className="btn-cancel-order"
                    onClick={() => setShowCancelModal(true)}
                  >
                    <i className="fas fa-times"></i>
                    Cancel Order
                  </button>
                )}

                {canReturn && (
                  <button
                    className="btn-return-order"
                    onClick={() => setShowReturnModal(true)}
                  >
                    <i className="fas fa-undo"></i>
                    Return Items
                  </button>
                )}

                <button
                  className="btn-contact-support"
                  onClick={handleContactSupport}
                >
                  <i className="fas fa-headset"></i>
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          <div className="order-sidebar">
            <OrderTimeline
              status={currentOrder.order_status.toLowerCase()}
              timeline={(currentOrder.histories || []).map(history => ({
                id: history.history_id,
                title: history.status,
                description: `Updated by ${history.updated_by_name || 'System'}`,
                date: new Date(history.updated_at).toLocaleString(),
                status: 'completed'
              }))}
            />

            <div className="order-summary-card">
              <h4>Order Summary</h4>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${(currentOrder.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>${(currentOrder.delivery_fee || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>${(currentOrder.tax_amount || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${(currentOrder.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="shipping-info-card">
              <h4>Shipping Information</h4>
              <div className="address-details">
                {currentOrder.address ? (
                  <>
                    <p><strong>{currentOrder.address.line1 || ''}</strong></p>
                    <p>{currentOrder.address.line2 || ''}</p>
                    <p>{currentOrder.address.city_name || ''}, {currentOrder.address.state_name || ''} {currentOrder.address.pincode || ''}</p>
                  </>
                ) : (
                  <p>No shipping address available</p>
                )}
              </div>

              {currentOrder.tracking_number && (
                <div className="tracking-info">
                  <i className="fas fa-truck"></i>
                  <div>
                    <strong>Tracking Number</strong>
                    <p>{currentOrder.tracking_number}</p>
                    <button
                      className="btn-link"
                      onClick={() => navigate(`/orders/${currentOrder.order_id}/track`)}
                      style={{ color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: '4px' }}
                    >
                      Track Shipment
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="payment-info-card">
              <h4>Payment Method</h4>
              <div className="payment-method">
                <i className="fas fa-credit-card"></i>
                <span>{currentOrder.payment_status || 'PENDING'}</span>
              </div>
            </div>

            <div className="support-info-card">
              <h4>Need Help?</h4>
              <div className="support-contact">
                <div className="contact-row">
                  <i className="fas fa-envelope"></i>
                  <span>admin@nexora.com</span>
                </div>
                <div className="contact-row">
                  <i className="fas fa-phone"></i>
                  <span>+1 (800) 123-4567</span>
                </div>
                <button className="btn-visit-support" onClick={() => navigate('/support')}>
                  Visit Support Center
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelOrderModal
          order={currentOrder}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelOrder}
        />
      )}

      {showReturnModal && (
        <ReturnOrderModal
          order={currentOrder}
          onClose={() => setShowReturnModal(false)}
          onConfirm={handleReturnRequest}
        />
      )}
    </div>
  );
};

export default OrderDetail;