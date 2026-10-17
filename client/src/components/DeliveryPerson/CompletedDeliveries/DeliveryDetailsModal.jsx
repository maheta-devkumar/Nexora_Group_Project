import React, { useState } from 'react';
import { useCompletedDeliveriesContext } from '../../../context/delivery_panel/CompletedDeliveriesContext';
import './DeliveryDetailsModal.css';

const DeliveryDetailsModal = ({ delivery, onClose, onDownloadPOD }) => {
  const { fetchProofOfDelivery, loading } = useCompletedDeliveriesContext();
  const [proofOfDelivery, setProofOfDelivery] = useState(null);
  const [showPOD, setShowPOD] = useState(false);
  const [podLoading, setPodLoading] = useState(false);

  // Safe data accessors
  const getOrderNumber = () => {
    return delivery?.order_number || delivery?.order_id || delivery?.delivery_id || 'N/A';
  };

  const getCustomerName = () => {
    if (!delivery?.customer) return 'Customer';
    return delivery.customer.name || delivery.customer.customer_name || 'Customer';
  };

  const getCustomerAvatar = () => {
    if (delivery?.customer?.profile_picture) {
      return delivery.customer.profile_picture;
    }
    
    const name = getCustomerName();
    const bgColor = ['3b82f6', '10b981', 'f59e0b', 'ef4444'][Math.floor(Math.random() * 4)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=fff&size=120`;
  };

  const getCustomerPhone = () => {
    if (!delivery?.customer) return 'N/A';
    return delivery.customer.phone || delivery.customer.contact_number || delivery.customer.mobile || 'N/A';
  };

  const getCustomerEmail = () => {
    if (!delivery?.customer) return 'N/A';
    return delivery.customer.email || delivery.customer.email_address || 'N/A';
  };

  const getDeliveryAddress = () => {
    if (!delivery) return 'Address not specified';
    
    const address = delivery.delivery_address || delivery.address || delivery.shipping_address;
    
    if (!address) return 'Address not specified';
    
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object' && address !== null) {
      const street = address.street || address.address_line1 || '';
      const city = address.city || '';
      const state = address.state || '';
      const zip = address.zip_code || address.pincode || '';
      const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');
      return fullAddress;
    }
    
    return 'Address not specified';
  };

  const getPickupAddress = () => {
    if (!delivery) return 'Pickup location not specified';
    
    const address = delivery.pickup_address || delivery.store_address || delivery.pickup_location;
    
    if (!address) return 'Pickup location not specified';
    
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object' && address !== null) {
      const name = address.name || address.store_name || '';
      const street = address.street || address.address || '';
      const fullAddress = [name, street].filter(Boolean).join(', ');
      return fullAddress;
    }
    
    return 'Pickup location not specified';
  };

  const getAmount = () => {
    const amount = delivery?.amount || delivery?.order_amount || delivery?.total_amount;
    if (amount && typeof amount === 'number') {
      return `₹${amount.toFixed(2)}`;
    }
    return '₹0.00';
  };

  const getPaymentMethod = () => {
    const method = delivery?.payment_method || delivery?.payment_type;
    if (method) {
      return method === 'cod' ? 'Cash on Delivery' : 
             method === 'online' ? 'Online Payment' : 
             method === 'card' ? 'Card Payment' : 
             String(method).toUpperCase();
    }
    return 'N/A';
  };

  const getDeliveredAt = () => {
    const date = delivery?.delivered_at || delivery?.completed_at || delivery?.created_at;
    if (!date) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return date;
    }
  };

  const getEarnings = () => {
    const earnings = delivery?.earnings || delivery?.delivery_charge || delivery?.commission;
    if (earnings && typeof earnings === 'number') {
      return `₹${earnings.toFixed(2)}`;
    }
    return '₹0.00';
  };

  const getRating = () => {
    const rating = delivery?.rating || delivery?.customer_rating;
    if (rating && typeof rating === 'number') {
      return rating.toFixed(1);
    }
    return 'N/A';
  };

  const getRatingStars = () => {
    const rating = delivery?.rating || delivery?.customer_rating;
    if (!rating || typeof rating !== 'number') {
      return null;
    }
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="rating-stars-modal">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <i key={i} data-lucide="star" className="star-filled"></i>;
          } else if (i === fullStars && hasHalfStar) {
            return <i key={i} data-lucide="star" className="star-half"></i>;
          } else {
            return <i key={i} data-lucide="star" className="star-empty"></i>;
          }
        })}
        <span className="rating-value-modal">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getItems = () => {
    const items = delivery?.items || delivery?.order_items;
    if (Array.isArray(items) && items.length > 0) {
      return items.map((item, index) => (
        <div key={index} className="item-row">
          <span className="item-name">{item.name || `Item ${index + 1}`}</span>
          <span className="item-qty">Qty: {item.quantity || 1}</span>
          {item.price && (
            <span className="item-price">₹{item.price.toFixed(2)}</span>
          )}
        </div>
      ));
    }
    return <p className="no-items">No item details available</p>;
  };

  const handleViewPOD = async () => {
    if (!delivery?.delivery_id) return;
    
    setPodLoading(true);
    try {
      const result = await fetchProofOfDelivery(delivery.delivery_id);
      if (result.success) {
        setProofOfDelivery(result.data);
        setShowPOD(true);
      }
    } catch (error) {
      console.error('Error fetching POD:', error);
    } finally {
      setPodLoading(false);
    }
  };

  const handleDownloadPODClick = () => {
    if (onDownloadPOD && delivery?.delivery_id) {
      onDownloadPOD(delivery.delivery_id);
    }
  };

  return (
    <div className="delivery-modal-overlay">
      <div className="delivery-modal">
        <div className="modal-header">
          <h3>Delivery Details</h3>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            <i data-lucide="x"></i>
          </button>
        </div>
        
        <div className="modal-body">
          {/* Order Summary */}
          <div className="order-summary">
            <div className="order-header">
              <div className="order-id">
                <strong>Order #{getOrderNumber()}</strong>
                <span className="delivery-date">Delivered on {getDeliveredAt()}</span>
              </div>
              <div className="order-earnings">
                <span className="earnings-label">Earnings</span>
                <span className="earnings-value">{getEarnings()}</span>
              </div>
            </div>
            
            {getRating() !== 'N/A' && (
              <div className="order-rating">
                {getRatingStars()}
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="section">
            <h4 className="section-title">
              <i data-lucide="user"></i>
              Customer Information
            </h4>
            <div className="customer-info-grid">
              <div className="customer-avatar">
                <img 
                  src={getCustomerAvatar()} 
                  alt={getCustomerName()}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=Customer&background=3b82f6&color=fff&size=120`;
                  }}
                />
              </div>
              <div className="customer-details">
                <div className="detail-row">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{getCustomerName()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{getCustomerPhone()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{getCustomerEmail()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="section">
            <h4 className="section-title">
              <i data-lucide="map-pin"></i>
              Delivery Information
            </h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Pickup Location</span>
                <span className="info-value">{getPickupAddress()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Delivery Address</span>
                <span className="info-value">{getDeliveryAddress()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Order Amount</span>
                <span className="info-value">{getAmount()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Payment Method</span>
                <span className="info-value">{getPaymentMethod()}</span>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="section">
            <h4 className="section-title">
              <i data-lucide="package"></i>
              Items Delivered
            </h4>
            <div className="items-list">
              {getItems()}
            </div>
          </div>

          {/* Proof of Delivery */}
          <div className="section">
            <h4 className="section-title">
              <i data-lucide="file-check"></i>
              Proof of Delivery
            </h4>
            <div className="pod-actions">
              <button 
                className="btn-secondary"
                onClick={handleViewPOD}
                disabled={podLoading || loading}
              >
                {podLoading ? (
                  <>
                    <div className="spinner-small"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <i data-lucide="eye"></i>
                    View POD
                  </>
                )}
              </button>
              <button 
                className="btn-primary"
                onClick={handleDownloadPODClick}
                disabled={loading}
              >
                <i data-lucide="download"></i>
                Download POD
              </button>
            </div>
            
            {showPOD && proofOfDelivery && (
              <div className="pod-preview">
                {proofOfDelivery.image_url ? (
                  <img 
                    src={proofOfDelivery.image_url} 
                    alt="Proof of Delivery" 
                    className="pod-image"
                  />
                ) : (
                  <div className="pod-placeholder">
                    <i data-lucide="file-text"></i>
                    <p>POD document available</p>
                    <span>Signatures and timestamps recorded</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
          <button 
            className="btn-primary"
            onClick={() => {
              // In a real app, this would share the delivery details
              alert('Share feature would be implemented here');
            }}
            disabled={loading}
          >
            <i data-lucide="share-2"></i>
            Share Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailsModal;