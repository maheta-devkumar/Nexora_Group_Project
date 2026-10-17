import React from 'react';
import PropTypes from 'prop-types';
import { useOfferContext } from '../../context/OfferContext';
import './OfferCard.css';

const OfferCard = ({ offer, onApply, showActions = true, compact = false }) => {
  const { formatDiscountText } = useOfferContext();
  
  const now = new Date();
  const startDate = new Date(offer.start_date);
  const endDate = new Date(offer.end_date);
  
  const getStatus = () => {
    if (!offer.is_active) return 'inactive';
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'expired';
    return 'active';
  };
  
  const status = getStatus();
  const discountText = formatDiscountText(offer);
  const isExclusive = offer.variants && offer.variants.length > 0;
  
  const handleApply = () => {
    if (onApply && status === 'active') {
      onApply(offer);
    }
  };
  
  const getTimeRemaining = () => {
    if (status !== 'active') return null;
    
    const diff = endDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    } else {
      return 'Ending soon!';
    }
  };
  
  const timeRemaining = getTimeRemaining();
  
  if (compact) {
    return (
      <div className={`offer-card-compact ${status}`} onClick={handleApply}>
        <div className="compact-header">
          <div className="compact-discount">{discountText}</div>
          {isExclusive && (
            <div className="compact-badge">
              <i className="fas fa-star"></i> Exclusive
            </div>
          )}
        </div>
        <div className="compact-title">{offer.title}</div>
        {timeRemaining && (
          <div className="compact-timer">
            <i className="fas fa-clock"></i> {timeRemaining}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={`offer-card ${status}`}>
      {isExclusive && (
        <div className="offer-badge exclusive">
          <i className="fas fa-star"></i> Exclusive
        </div>
      )}
      
      <div className={`offer-header ${offer.discount_type.toLowerCase()}`}>
        <div className="offer-title">{offer.title}</div>
        <div className="offer-discount">{discountText}</div>
        <div className="offer-discount-type">
          {offer.discount_type === 'PERCENT' ? 'Percentage Discount' : 'Flat Discount'}
        </div>
      </div>
      
      <div className="offer-body">
        {offer.description && (
          <p className="offer-description">{offer.description}</p>
        )}
        
        <div className="offer-details">
          <div className="detail-item">
            <i className="fas fa-calendar"></i>
            <span>Valid:</span>
            <span className="value">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
          </div>
          
          {timeRemaining && (
            <div className="detail-item">
              <i className="fas fa-clock"></i>
              <span>Time Left:</span>
              <span className="value time-remaining">{timeRemaining}</span>
            </div>
          )}
          
          {offer.variants && offer.variants.length > 0 && (
            <div className="detail-item">
              <i className="fas fa-box"></i>
              <span>Applicable to:</span>
              <span className="value">{offer.variants.length} product{offer.variants.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="offer-footer">
        <div className={`offer-status status-${status}`}>
          <i className={`fas fa-circle status-icon ${status}`}></i>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
        
        {showActions && status === 'active' && (
          <button 
            className="btn-apply-offer"
            onClick={handleApply}
            title="View eligible products"
          >
            <i className="fas fa-shopping-cart"></i> Shop Now
          </button>
        )}
      </div>
    </div>
  );
};

OfferCard.propTypes = {
  offer: PropTypes.object.isRequired,
  onApply: PropTypes.func,
  showActions: PropTypes.bool,
  compact: PropTypes.bool
};

export default OfferCard;