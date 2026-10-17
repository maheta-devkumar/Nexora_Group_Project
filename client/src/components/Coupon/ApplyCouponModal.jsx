import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCouponContext } from '../../context/CouponContext';
import './ApplyCouponModal.css';

const ApplyCouponModal = ({ isOpen, onClose, variantIds, orderTotal, onApply, appliedCoupon }) => {
  const { 
    activeCoupons, 
    validateCouponCode, 
    validationResult, 
    clearValidation,
    loading 
  } = useCouponContext();
  
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    if (appliedCoupon) {
      setCouponCode(appliedCoupon.code);
    }
  }, [appliedCoupon]);
  
  useEffect(() => {
    if (!isOpen) {
      setCouponCode('');
      setError('');
      setSuccess('');
      clearValidation();
    }
  }, [isOpen, clearValidation]);
  
  const handleValidate = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }
    
    setError('');
    setSuccess('');
    
    const result = await validateCouponCode(couponCode, variantIds || [], orderTotal || 0);
    
    if (result.success) {
      if (result.data.valid) {
        setSuccess('Coupon is valid!');
      } else {
        setError(result.data.message || 'Invalid coupon');
      }
    } else {
      setError(result.message || 'Validation failed');
    }
  };
  
  const handleApply = () => {
    if (validationResult?.valid && onApply) {
      onApply(validationResult.coupon, validationResult.discount_amount);
      onClose();
    }
  };
  
  const handleRemove = () => {
    if (onApply) {
      onApply(null, 0);
      onClose();
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="apply-coupon-modal-overlay">
      <div className="apply-coupon-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="fas fa-ticket-alt"></i> Apply Coupon
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          {appliedCoupon ? (
            <div className="applied-coupon-info">
              <div className="applied-coupon-header">
                <div className="applied-coupon-code">
                  <span className="code">{appliedCoupon.code}</span>
                  <span className="discount">
                    {appliedCoupon.discount_type === 'PERCENT' 
                      ? `${appliedCoupon.discount_value}% OFF` 
                      : `$${appliedCoupon.discount_value} OFF`}
                  </span>
                </div>
                <button className="remove-coupon" onClick={handleRemove}>
                  <i className="fas fa-times"></i> Remove
                </button>
              </div>
              <p className="applied-coupon-message">
                Coupon is currently applied to your order
              </p>
            </div>
          ) : (
            <>
              <div className="coupon-input-section">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    className="coupon-input"
                    disabled={loading}
                  />
                  <button 
                    className="validate-btn"
                    onClick={handleValidate}
                    disabled={loading || !couponCode.trim()}
                  >
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>
                        <i className="fas fa-check"></i> Validate
                      </>
                    )}
                  </button>
                </div>
                
                {error && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {error}
                  </div>
                )}
                
                {success && (
                  <div className="success-message">
                    <i className="fas fa-check-circle"></i> {success}
                  </div>
                )}
              </div>
              
              {validationResult && (
                <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
                  <div className="validation-header">
                    <div className="validation-status">
                      <i className={`fas fa-${validationResult.valid ? 'check-circle' : 'times-circle'}`}></i>
                      {validationResult.message}
                    </div>
                    {validationResult.valid && validationResult.coupon && (
                      <div className="validation-coupon-code">
                        Code: <strong>{validationResult.coupon.code}</strong>
                      </div>
                    )}
                  </div>
                  
                  {validationResult.valid && (
                    <>
                      <div className="validation-details">
                        <div className="discount-info">
                          <span>Discount Amount:</span>
                          <span className="discount-amount">
                            -${validationResult.discount_amount}
                          </span>
                        </div>
                        {validationResult.coupon && (
                          <>
                            <div className="coupon-info">
                              <span>Coupon Type:</span>
                              <span className="coupon-type">
                                {validationResult.coupon.discount_type === 'PERCENT' 
                                  ? 'Percentage Discount' 
                                  : 'Flat Discount'}
                              </span>
                            </div>
                            {validationResult.coupon.description && (
                              <div className="coupon-description">
                                {validationResult.coupon.description}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="validation-actions">
                        <button className="btn-apply" onClick={handleApply}>
                          <i className="fas fa-check"></i> Apply Coupon
                        </button>
                        <button className="btn-cancel" onClick={clearValidation}>
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {activeCoupons.length > 0 && (
                <div className="available-coupons">
                  <h3 className="available-coupons-title">
                    <i className="fas fa-gift"></i> Available Coupons
                  </h3>
                  <div className="coupons-grid">
                    {activeCoupons.slice(0, 3).map(coupon => (
                      <div 
                        key={coupon.coupon_id}
                        className="coupon-preview"
                        onClick={() => setCouponCode(coupon.code)}
                      >
                        <div className="preview-code">{coupon.code}</div>
                        <div className="preview-discount">
                          {coupon.discount_type === 'PERCENT' 
                            ? `${coupon.discount_value}% OFF` 
                            : `$${coupon.discount_value} OFF`}
                        </div>
                        <div className="preview-min">
                          {coupon.min_order_amount && (
                            <>Min: ${coupon.min_order_amount}</>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

ApplyCouponModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  variantIds: PropTypes.array,
  orderTotal: PropTypes.number,
  onApply: PropTypes.func.isRequired,
  appliedCoupon: PropTypes.object
};

export default ApplyCouponModal;