import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartContext } from '../../context/CartContext';
import { useCouponContext } from '../../context/CouponContext';
import CouponCard from '../../components/Coupon/CouponCard';
import ApplyCouponModal from '../../components/Coupon/ApplyCouponModal';
import './ApplyCouponPage.css';

const ApplyCouponPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCartContext();
  const { activeCoupons, validateCouponCode, loading } = useCouponContext();
  
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    // Check for coupon code in navigation state
    const couponCode = location.state?.couponCode;
    if (couponCode) {
      applyCouponByCode(couponCode);
    }
  }, [location.state]);

  const variantIds = cart.items?.map(item => item.variant_id) || [];
  const orderTotal = cart.subtotal || 0;

  const applyCouponByCode = async (code) => {
    const result = await validateCouponCode(code, variantIds, orderTotal);
    if (result.success && result.data.valid) {
      setAppliedCoupon(result.data.coupon);
      setDiscountAmount(result.data.discount_amount);
      setValidationResult(result.data);
    }
  };

  const handleCouponSelect = (coupon) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleApplyCoupon = (coupon, discount) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discount);
    setValidationResult({
      valid: true,
      discount_amount: discount,
      message: 'Coupon applied successfully',
      coupon
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setValidationResult(null);
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout', { 
      state: { 
        coupon: appliedCoupon,
        discountAmount 
      }
    });
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const filteredCoupons = activeCoupons.filter(coupon => {
    if (!coupon.variants || coupon.variants.length === 0) return true;
    return variantIds.some(id => coupon.variants.includes(id));
  });

  const cartTotal = cart.subtotal || 0;
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  return (
    <div className="apply-coupon-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fas fa-ticket-alt"></i> Apply Coupon
          </h1>
          <p className="page-subtitle">
            Select a coupon to apply to your order
          </p>
        </div>

        <div className="page-content">
          <div className="coupons-section">
            <div className="section-header">
              <h2 className="section-title">Available Coupons</h2>
              <div className="cart-info">
                <span className="cart-items">{cart.items?.length || 0} items in cart</span>
                <span className="cart-total">Total: ${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {loading ? (
              <div className="loading-coupons">
                <div className="loading-spinner"></div>
                <p>Loading available coupons...</p>
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="no-coupons">
                <i className="fas fa-gift"></i>
                <h3>No coupons available for your cart</h3>
                <p>Try adding different products or check back later for new offers</p>
              </div>
            ) : (
              <div className="coupons-grid">
                {filteredCoupons.map(coupon => (
                  <CouponCard
                    key={coupon.coupon_id}
                    coupon={coupon}
                    onAction={(action) => {
                      if (action === 'apply') {
                        handleCouponSelect(coupon);
                      }
                    }}
                  />
                ))}
              </div>
            )}

            <div className="manual-entry">
              <p>Have a coupon code?</p>
              <button 
                className="btn-enter-manually"
                onClick={() => setIsModalOpen(true)}
              >
                <i className="fas fa-keyboard"></i> Enter Code Manually
              </button>
            </div>
          </div>

          <div className="order-summary-section">
            <div className="summary-card">
              <h3 className="summary-title">Order Summary</h3>
              
              <div className="summary-items">
                <div className="summary-item">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="summary-discount">
                    <div className="discount-header">
                      <span>
                        <i className="fas fa-ticket-alt"></i> {appliedCoupon.code}
                      </span>
                      <span className="discount-amount">-${discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="discount-details">
                      {appliedCoupon.discount_type === 'PERCENT' 
                        ? `${appliedCoupon.discount_value}% discount` 
                        : `$${appliedCoupon.discount_value} off`}
                    </div>
                  </div>
                )}
                
                <div className="summary-total">
                  <span>Total</span>
                  <span className="total-amount">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {appliedCoupon ? (
                <div className="applied-coupon-info">
                  <div className="applied-coupon-header">
                    <span className="coupon-code">{appliedCoupon.code}</span>
                    <button 
                      className="btn-remove"
                      onClick={handleRemoveCoupon}
                    >
                      <i className="fas fa-times"></i> Remove
                    </button>
                  </div>
                  <p className="coupon-savings">
                    You save <strong>${discountAmount.toFixed(2)}</strong> with this coupon!
                  </p>
                </div>
              ) : (
                <div className="no-coupon-applied">
                  <i className="fas fa-info-circle"></i>
                  <p>No coupon applied. Select a coupon above to save money!</p>
                </div>
              )}

              <div className="summary-actions">
                <button 
                  className="btn-checkout"
                  onClick={handleProceedToCheckout}
                  disabled={!cart.items || cart.items.length === 0}
                >
                  <i className="fas fa-lock"></i> 
                  {appliedCoupon ? 'Proceed to Checkout' : 'Checkout Without Coupon'}
                </button>
                
                <button 
                  className="btn-continue"
                  onClick={handleContinueShopping}
                >
                  <i className="fas fa-shopping-cart"></i> Continue Shopping
                </button>
              </div>
            </div>

            {!appliedCoupon && filteredCoupons.length > 0 && (
              <div className="savings-tip">
                <i className="fas fa-lightbulb"></i>
                <div className="tip-content">
                  <strong>Tip:</strong> Applying a coupon can save you up to $
                  {Math.max(...filteredCoupons.map(c => 
                    c.discount_type === 'PERCENT' 
                      ? (cartTotal * c.discount_value / 100).toFixed(2)
                      : c.discount_value
                  ))} on this order!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ApplyCouponModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variantIds={variantIds}
        orderTotal={orderTotal}
        onApply={handleApplyCoupon}
        appliedCoupon={appliedCoupon}
      />
    </div>
  );
};

export default ApplyCouponPage;