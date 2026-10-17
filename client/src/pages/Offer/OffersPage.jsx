import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOfferContext } from '../../context/OfferContext';
import OfferList from '../../components/Offer/OfferList';
import './OffersPage.css';

const OffersPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    activeOffers,
    fetchActiveOffers,
    loading,
    error
  } = useOfferContext();

  useEffect(() => {
    fetchActiveOffers();
  }, [fetchActiveOffers]);

  const handleOfferSelect = (offer) => {
    // Navigate to products filtered by this offer or just general products
    navigate('/products', {
      state: {
        offerFilter: offer.variants || [],
        offerTitle: offer.title
      }
    });
  };

  return (
    <div className="offers-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fas fa-gift"></i>
            Special Offers
          </h1>
          <p className="page-subtitle">
            Discover amazing deals and limited-time discounts on our premium collection
          </p>
        </div>

        {error && !loading && (
          <div className="error-alert">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
            <button className="retry-btn" onClick={() => fetchActiveOffers()}>
              Retry
            </button>
          </div>
        )}

        <div className="offers-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner-large"></div>
              <p>Finding the best offers for you...</p>
            </div>
          ) : activeOffers.length === 0 ? (
            <div className="no-data-container">
              <i className="fas fa-tags"></i>
              <h3>No active offers right now</h3>
              <p>Our team is curating new deals. Check back soon!</p>
              <button className="btn-shop-now" onClick={() => navigate('/products')}>
                Explore Products
              </button>
            </div>
          ) : (
            <OfferList
              offers={activeOffers}
              onOfferSelect={handleOfferSelect}
              emptyMessage="No offers available at the moment"
              showFilters={true}
            />
          )}
        </div>

        {!isAuthenticated && (
          <div className="signup-cta">
            <div className="cta-content">
              <h3>Don't miss out on exclusive offers!</h3>
              <p>Sign up to get notified about new deals and special promotions</p>
              <button
                className="btn-signup"
                onClick={() => navigate('/register')}
              >
                <i className="fas fa-user-plus"></i> Sign Up Free
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersPage;