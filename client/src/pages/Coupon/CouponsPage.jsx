import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCouponContext } from '../../context/CouponContext';
import CouponList from '../../components/Coupon/CouponList';
import './CouponsPage.css';

const CouponsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    activeCoupons,
    fetchActiveCoupons,
    loading,
    error
  } = useCouponContext();

  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchActiveCoupons();
  }, [fetchActiveCoupons]);

  const handleCouponAction = async (action, coupon) => {
    switch (action) {
      case 'apply':
        // Copy to clipboard
        navigator.clipboard.writeText(coupon.code);
        showNotification('success', `Coupon code "${coupon.code}" copied to clipboard!`);
        break;

      case 'copied':
        showNotification('success', `Copied "${coupon.code}" to clipboard!`);
        break;

      default:
        break;
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  return (
    <div className="coupons-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fas fa-ticket-alt"></i>
            Available Coupons
          </h1>
          <p className="page-subtitle">
            Save more on your favorite products with these active coupons
          </p>
        </div>

        {notification.message && (
          <div className={`notification ${notification.type}`}>
            <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {notification.message}
          </div>
        )}

        {error && !loading && (
          <div className="error-alert">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
            <button className="retry-btn" onClick={() => fetchActiveCoupons()}>
              Retry
            </button>
          </div>
        )}

        <div className="coupons-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner-large"></div>
              <p>Loading coupons...</p>
            </div>
          ) : activeCoupons.length === 0 ? (
            <div className="no-data-container">
              <i className="fas fa-ticket-alt"></i>
              <h3>No coupons available</h3>
              <p>Check back later for new discounts!</p>
              <button className="btn-shop-now" onClick={() => navigate('/products')}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <CouponList
              coupons={activeCoupons}
              isAdmin={false}
              onCouponAction={handleCouponAction}
              emptyMessage="No available coupons at the moment"
            />
          )}
        </div>

        {!isAuthenticated && (
          <div className="login-cta">
            <div className="cta-content">
              <h3>Want to save more?</h3>
              <p>Sign in to access exclusive member-only coupons!</p>
              <button
                className="btn-login"
                onClick={() => navigate('/login')}
              >
                <i className="fas fa-sign-in-alt"></i> Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponsPage;