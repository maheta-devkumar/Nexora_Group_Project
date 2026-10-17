import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useCartContext } from '../../context/CartContext';
import { useCouponContext } from '../../context/CouponContext';
import ApplyCouponModal from '../Coupon/ApplyCouponModal';
import ActiveCouponBadge from '../Coupon/ActiveCouponBadge';
import './CheckoutCouponSection.css';

const CheckoutCouponSection = ({ appliedCoupon, onCouponApplied, onCouponRemoved }) => {
  const { cart } = useCartContext();
  const { activeCoupons } = useCouponContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const variantIds = cart.items?.map(item => item.variant_id) || [];
  const orderTotal = cart.subtotal || 0;
  
  const handleCouponApplied = (coupon, discountAmount) => {
    if (onCouponApplied) {
      onCouponApplied(coupon, discountAmount);
    }
  };
  
  const handleCouponRemoved = () => {
    if (onCouponRemoved) {
      onCouponRemoved();
    }
  };
  
  const handleBadgeClick = () => {
    setIsModalOpen(true);
  };
  
  const hasActiveCoupons = activeCoupons.length > 0;
  
  return (
    <div className="checkout-coupon-section">
      <div className="section-header">
        <h3 className="section-title">
          <i className="fas fa-ticket-alt"></i> Coupon Code
        </h3>
        {hasActiveCoupons && !appliedCoupon && (
          <button 
            className="view-coupons-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="fas fa-gift"></i> View Available Coupons
          </button>
        )}
      </div>
      
      <div className="section-body">
        {appliedCoupon ? (
          <div className="applied-coupon-container">
            <div className="applied-coupon-header">
              <ActiveCouponBadge 
                coupon={appliedCoupon} 
                onClick={handleBadgeClick}
                pulse={true}
              />
              <button 
                className="remove-coupon-btn"
                onClick={handleCouponRemoved}
              >
                <i className="fas fa-times"></i> Remove
              </button>
            </div>
            
            <div className="coupon-savings">
              <div className="savings-item">
                <span>Discount Applied:</span>
                <span className="savings-amount">
                  {appliedCoupon.discount_type === 'PERCENT' 
                    ? `${appliedCoupon.discount_value}%` 
                    : `$${appliedCoupon.discount_value}`}
                </span>
              </div>
              {appliedCoupon.min_order_amount && (
                <div className="savings-note">
                  <i className="fas fa-info-circle"></i>
                  Minimum order amount: ${appliedCoupon.min_order_amount}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="coupon-input-container">
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter coupon code"
                className="coupon-input"
                onClick={() => setIsModalOpen(true)}
                readOnly
              />
              <button 
                className="apply-coupon-btn"
                onClick={() => setIsModalOpen(true)}
              >
                <i className="fas fa-ticket-alt"></i> Apply
              </button>
            </div>
            
            {hasActiveCoupons && (
              <div className="available-coupons-hint">
                <i className="fas fa-gift"></i>
                {activeCoupons.length} coupon{activeCoupons.length !== 1 ? 's' : ''} available
              </div>
            )}
          </div>
        )}
      </div>
      
      <ApplyCouponModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variantIds={variantIds}
        orderTotal={orderTotal}
        onApply={handleCouponApplied}
        appliedCoupon={appliedCoupon}
      />
    </div>
  );
};

CheckoutCouponSection.propTypes = {
  appliedCoupon: PropTypes.object,
  onCouponApplied: PropTypes.func.isRequired,
  onCouponRemoved: PropTypes.func.isRequired
};

export default CheckoutCouponSection;