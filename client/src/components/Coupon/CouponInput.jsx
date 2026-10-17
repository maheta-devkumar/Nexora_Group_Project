import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useCouponContext } from '../../context/CouponContext';
import './CouponInput.css';

const CouponInput = ({ 
  variantIds = [], 
  orderTotal = 0, 
  onApply, 
  appliedCoupon,
  placeholder = "Enter coupon code",
  showLabel = true,
  compact = false 
}) => {
  const { validateCouponCode, loading } = useCouponContext();
  
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleApply = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setError('');
    setSuccess('');
    setIsValidating(true);

    const result = await validateCouponCode(couponCode, variantIds, orderTotal);

    setIsValidating(false);

    if (result.success && result.data.valid) {
      setSuccess(result.data.message);
      if (onApply) {
        onApply({
          coupon: result.data.coupon,
          discountAmount: result.data.discount_amount
        });
      }
    } else {
      setError(result.data?.message || 'Invalid coupon code');
    }
  };

  const handleRemove = () => {
    setCouponCode('');
    setError('');
    setSuccess('');
    if (onApply) {
      onApply(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  if (appliedCoupon) {
    return (
      <div className={`coupon-input-container ${compact ? 'compact' : ''} applied`}>
        {showLabel && <div className="coupon-label">Applied Coupon</div>}
        <div className="applied-coupon-display">
          <div className="applied-coupon-info">
            <span className="coupon-code">{appliedCoupon.code}</span>
            <span className="coupon-discount">
              {appliedCoupon.discount_type === 'PERCENT' 
                ? `-${appliedCoupon.discount_value}%` 
                : `-$${appliedCoupon.discount_value}`}
            </span>
          </div>
          <button 
            className="remove-coupon-btn"
            onClick={handleRemove}
            title="Remove coupon"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        {success && <div className="coupon-success">{success}</div>}
      </div>
    );
  }

  return (
    <div className={`coupon-input-container ${compact ? 'compact' : ''}`}>
      {showLabel && <div className="coupon-label">Have a coupon code?</div>}
      
      <div className="coupon-input-group">
        <div className="input-wrapper">
          <i className="fas fa-ticket-alt input-icon"></i>
          <input
            type="text"
            placeholder={placeholder}
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="coupon-input-field"
            disabled={loading || isValidating}
          />
        </div>
        <button
          className="apply-coupon-btn"
          onClick={handleApply}
          disabled={loading || isValidating || !couponCode.trim()}
        >
          {isValidating ? (
            <>
              <span className="loading-spinner"></span>
              Validating...
            </>
          ) : (
            <>
              <i className="fas fa-check"></i> Apply
            </>
          )}
        </button>
      </div>
      
      {error && <div className="coupon-error">{error}</div>}
      {success && <div className="coupon-success">{success}</div>}
      
      {variantIds.length > 0 && !compact && (
        <div className="coupon-hint">
          <i className="fas fa-info-circle"></i>
          Coupon will be validated for {variantIds.length} item{variantIds.length !== 1 ? 's' : ''} in your cart
        </div>
      )}
    </div>
  );
};

CouponInput.propTypes = {
  variantIds: PropTypes.array,
  orderTotal: PropTypes.number,
  onApply: PropTypes.func.isRequired,
  appliedCoupon: PropTypes.object,
  placeholder: PropTypes.string,
  showLabel: PropTypes.bool,
  compact: PropTypes.bool
};

export default CouponInput;