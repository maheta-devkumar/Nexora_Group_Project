import React from 'react';
import PropTypes from 'prop-types';
import './OrderSummaryWithCoupon.css';

const OrderSummaryWithCoupon = ({ 
  items = [], 
  subtotal = 0, 
  shipping = 0, 
  tax = 0, 
  coupon = null,
  discount = 0,
  onEdit,
  showEditButton = true 
}) => {
  const calculateTotal = () => {
    let total = subtotal + shipping + tax;
    if (discount) {
      total -= discount;
    }
    return Math.max(0, total);
  };
  
  const total = calculateTotal();
  
  return (
    <div className="order-summary-coupon">
      <div className="summary-header">
        <h3 className="summary-title">Order Summary</h3>
        {showEditButton && onEdit && (
          <button className="edit-order-btn" onClick={onEdit}>
            <i className="fas fa-edit"></i> Edit
          </button>
        )}
      </div>
      
      <div className="summary-items">
        <div className="summary-item">
          <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
          <span className="item-value">${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="summary-item">
          <span>Shipping</span>
          <span className="item-value">${shipping.toFixed(2)}</span>
        </div>
        
        <div className="summary-item">
          <span>Tax</span>
          <span className="item-value">${tax.toFixed(2)}</span>
        </div>
        
        {coupon && discount > 0 && (
          <div className="summary-discount">
            <div className="discount-header">
              <span className="discount-label">
                <i className="fas fa-ticket-alt"></i> Discount
                {coupon && <span className="coupon-code"> ({coupon.code})</span>}
              </span>
              <span className="discount-value">-${discount.toFixed(2)}</span>
            </div>
            {coupon && (
              <div className="discount-details">
                <span className="discount-type">
                  {coupon.discount_type === 'PERCENT' 
                    ? `${coupon.discount_value}% off` 
                    : `$${coupon.discount_value} off`}
                </span>
                {coupon.description && (
                  <span className="discount-description">{coupon.description}</span>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="summary-total">
          <span>Total</span>
          <span className="total-value">${total.toFixed(2)}</span>
        </div>
      </div>
      
      {coupon && (
        <div className="savings-message">
          <i className="fas fa-piggy-bank"></i>
          You saved <span className="savings-amount">${discount.toFixed(2)}</span> with this coupon!
        </div>
      )}
      
      <div className="summary-actions">
        <button className="checkout-btn">
          <i className="fas fa-lock"></i> Proceed to Checkout
        </button>
        <button className="continue-btn">
          <i className="fas fa-shopping-cart"></i> Continue Shopping
        </button>
      </div>
    </div>
  );
};

OrderSummaryWithCoupon.propTypes = {
  items: PropTypes.array,
  subtotal: PropTypes.number,
  shipping: PropTypes.number,
  tax: PropTypes.number,
  coupon: PropTypes.object,
  discount: PropTypes.number,
  onEdit: PropTypes.func,
  showEditButton: PropTypes.bool
};

export default OrderSummaryWithCoupon;