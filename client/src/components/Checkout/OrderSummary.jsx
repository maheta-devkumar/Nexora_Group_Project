import React from 'react';
import './OrderSummary.css';

const OrderSummary = ({ items, subtotal, shipping, tax, total, loading }) => {
  if (loading) {
    return (
      <div className="order-summary loading">
        <h3>Order Summary</h3>
        <div className="order-items">
          {[1, 2, 3].map(i => (
            <div key={i} className="order-item loading-skeleton">
              <div className="item-image">
                <div className="image-placeholder"></div>
              </div>
              <div className="item-details">
                <h4 className="loading-skeleton-text"></h4>
                <p className="loading-skeleton-text short"></p>
                <p className="item-price loading-skeleton-text"></p>
              </div>
              <div className="item-total loading-skeleton-text"></div>
            </div>
          ))}
        </div>
        <div className="order-totals">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="total-row loading-skeleton-text"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="order-summary">
      <h3>Order Summary</h3>
      
      <div className="order-items">
        {items && items.length > 0 ? (
          items.map(item => (
            <div key={item.variant_id || item.id} className="order-item">
              <div className="item-image">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name || item.name} />
                ) : (
                  <div className="image-placeholder">
                    <i className="fas fa-box"></i>
                  </div>
                )}
              </div>
              <div className="item-details">
                <h4>{item.product_name || item.name}</h4>
                {item.variant_name && <p className="variant">{item.variant_name}</p>}
                <p>Quantity: {item.quantity}</p>
                <p className="item-price">${(item.price || 0).toFixed(2)}</p>
              </div>
              <div className="item-total">
                ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
              </div>
            </div>
          ))
        ) : (
          <div className="no-items">
            <i className="fas fa-shopping-cart"></i>
            <p>No items in cart</p>
          </div>
        )}
      </div>
      
      <div className="order-totals">
        <div className="total-row">
          <span>Subtotal</span>
          <span>${(subtotal || 0).toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Shipping</span>
          <span>${(shipping || 0).toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Tax</span>
          <span>${(tax || 0).toFixed(2)}</span>
        </div>
        <div className="total-row grand-total">
          <span>Total</span>
          <span>${(total || 0).toFixed(2)}</span>
        </div>
      </div>
      
      <div className="order-protection">
        <div className="protection-item">
          <i className="fas fa-shield-alt"></i>
          <span>Secure Payment</span>
        </div>
        <div className="protection-item">
          <i className="fas fa-truck"></i>
          <span>Free Returns</span>
        </div>
        <div className="protection-item">
          <i className="fas fa-lock"></i>
          <span>Privacy Protected</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;