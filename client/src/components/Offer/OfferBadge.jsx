import React from 'react';
import PropTypes from 'prop-types';
import { useOfferContext } from '../../context/OfferContext';
import './OfferBadge.css';

const OfferBadge = ({ variantId, showIcon = true, showText = true, size = 'medium' }) => {
  const { getBestOfferForVariant, formatDiscountText } = useOfferContext();
  
  const bestOffer = getBestOfferForVariant(variantId);
  
  if (!bestOffer) return null;
  
  const discountText = formatDiscountText(bestOffer);
  
  return (
    <div className={`offer-badge ${size}`} title={bestOffer.title}>
      {showIcon && <i className="fas fa-bolt"></i>}
      {showText && <span className="badge-text">{discountText}</span>}
    </div>
  );
};

OfferBadge.propTypes = {
  variantId: PropTypes.number.isRequired,
  showIcon: PropTypes.bool,
  showText: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default OfferBadge;