import React from 'react';
import './CompletedDeliveryTable.css';

const CompletedDeliveryTable = ({ deliveries, onViewDetails, onDownloadPOD, loading }) => {
  // Safe data accessors
  const getOrderNumber = (delivery) => {
    return delivery?.order_number || delivery?.order_id || delivery?.delivery_id || 'N/A';
  };

  const getCustomerName = (delivery) => {
    if (!delivery?.customer) return 'Customer';
    return delivery.customer.name || delivery.customer.customer_name || 'Customer';
  };

  const getCustomerAvatar = (customer) => {
    if (customer?.profile_picture) {
      return customer.profile_picture;
    }
    
    const name = getCustomerName({ customer });
    const bgColor = ['3b82f6', '10b981', 'f59e0b', 'ef4444'][Math.floor(Math.random() * 4)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=fff`;
  };

  const getDeliveryAddress = (delivery) => {
    if (!delivery) return 'Address not specified';
    
    const address = delivery.delivery_address || delivery.address || delivery.shipping_address;
    
    if (!address) return 'Address not specified';
    
    if (typeof address === 'string') {
      return address.length > 30 ? `${address.substring(0, 30)}...` : address;
    }
    
    if (typeof address === 'object' && address !== null) {
      const street = address.street || address.address_line1 || '';
      const city = address.city || '';
      const state = address.state || '';
      const zip = address.zip_code || address.pincode || '';
      const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');
      return fullAddress.length > 30 ? `${fullAddress.substring(0, 30)}...` : fullAddress;
    }
    
    return 'Address not specified';
  };

  const getAmount = (delivery) => {
    const amount = delivery?.amount || delivery?.order_amount || delivery?.total_amount;
    if (amount && typeof amount === 'number') {
      return `₹${amount.toFixed(0)}`;
    }
    return '₹0';
  };

  const getDeliveredAt = (delivery) => {
    const date = delivery?.delivered_at || delivery?.completed_at || delivery?.created_at;
    if (!date) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return date;
    }
  };

  const getEarnings = (delivery) => {
    const earnings = delivery?.earnings || delivery?.delivery_charge || delivery?.commission;
    if (earnings && typeof earnings === 'number') {
      return `₹${earnings.toFixed(0)}`;
    }
    return '₹0';
  };

  const getRating = (delivery) => {
    const rating = delivery?.rating || delivery?.customer_rating;
    if (rating && typeof rating === 'number') {
      return rating.toFixed(1);
    }
    return 'N/A';
  };

  const getRatingStars = (rating) => {
    if (!rating || typeof rating !== 'number') {
      return null;
    }
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="rating-stars">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <i key={i} data-lucide="star" className="star-filled"></i>;
          } else if (i === fullStars && hasHalfStar) {
            return <i key={i} data-lucide="star" className="star-half"></i>;
          } else {
            return <i key={i} data-lucide="star" className="star-empty"></i>;
          }
        })}
      </div>
    );
  };

  if (loading && deliveries.length === 0) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p>Loading completed deliveries...</p>
      </div>
    );
  }

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="no-deliveries">
        <i data-lucide="package-check"></i>
        <h3>No Completed Deliveries</h3>
        <p>No completed deliveries found for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <div className="data-table-wrapper">
        <table className="completed-deliveries-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Delivery Address</th>
              <th>Amount</th>
              <th>Delivered At</th>
              <th>Earnings</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery, index) => {
              const orderNumber = getOrderNumber(delivery);
              const rating = getRating(delivery);
              
              return (
                <tr key={delivery.delivery_id || index}>
                  <td>
                    <span 
                      className="order-link"
                      onClick={() => onViewDetails(delivery)}
                    >
                      #{orderNumber}
                    </span>
                  </td>
                  <td>
                    <div className="table-customer">
                      <img 
                        src={getCustomerAvatar(delivery.customer)} 
                        alt={getCustomerName(delivery)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=Customer&background=3b82f6&color=fff`;
                        }}
                      />
                      <span>{getCustomerName(delivery)}</span>
                    </div>
                  </td>
                  <td title={getDeliveryAddress(delivery)}>
                    {getDeliveryAddress(delivery)}
                  </td>
                  <td>
                    <strong>{getAmount(delivery)}</strong>
                  </td>
                  <td>
                    <span className="delivery-time">{getDeliveredAt(delivery)}</span>
                  </td>
                  <td>
                    <strong>{getEarnings(delivery)}</strong>
                  </td>
                  <td>
                    <div className="rating-cell">
                      {rating !== 'N/A' ? (
                        <>
                          {getRatingStars(parseFloat(rating))}
                          <span className="rating-value">{rating}</span>
                        </>
                      ) : (
                        <span className="no-rating">No rating</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="icon-btn"
                        title="View Details"
                        onClick={() => onViewDetails(delivery)}
                      >
                        <i data-lucide="eye"></i>
                      </button>
                      <button 
                        className="icon-btn"
                        title="Download POD"
                        onClick={() => onDownloadPOD(delivery.delivery_id)}
                      >
                        <i data-lucide="download"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletedDeliveryTable;