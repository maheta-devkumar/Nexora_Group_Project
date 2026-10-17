import React from 'react';
import PropTypes from 'prop-types';
import './ActiveCouponBadge.css';

const ActiveCouponBadge = ({ coupon, onClick, showIcon = true, pulse = true }) => {
  if (!coupon) return null;

  const getDiscountText = () => {
    if (coupon.discount_type === 'PERCENT') {
      return `${coupon.discount_value}% OFF`;
    } else {
      return `$${coupon.discount_value} OFF`;
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(coupon);
    }
  };

  return (
    <div 
      className={`active-coupon-badge ${pulse ? 'pulse' : ''}`}
      onClick={handleClick}
      title={`Applied coupon: ${coupon.code}`}
    >
      {showIcon && <i className="fas fa-ticket-alt"></i>}
      <span className="badge-code">{coupon.code}</span>
      <span className="badge-discount">{getDiscountText()}</span>
      {onClick && <i className="fas fa-times remove-icon"></i>}
    </div>
  );
};

ActiveCouponBadge.propTypes = {
  coupon: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  showIcon: PropTypes.bool,
  pulse: PropTypes.bool
};

export default ActiveCouponBadge;