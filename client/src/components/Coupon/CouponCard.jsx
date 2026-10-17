import React from 'react';
import PropTypes from 'prop-types';
import { useCouponContext } from '../../context/CouponContext';
import './CouponCard.css';

const CouponCard = ({ coupon, isAdmin = false, onAction, showActions = true }) => {
  const { formatDiscountText } = useCouponContext();
  
  const now = new Date();
  const startDate = new Date(coupon.start_date);
  const endDate = new Date(coupon.end_date);
  
  const getStatus = () => {
    if (!coupon.is_active) return 'inactive';
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'expired';
    return 'active';
  };
  
  const status = getStatus();
  const discountText = formatDiscountText(coupon);
  const isExclusive = coupon.variants && coupon.variants.length > 0;
  const isLimited = coupon.usage_limit > 1;
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    if (onAction) onAction('copied', coupon.code);
  };
  
  const handleApply = () => {
    if (onAction) onAction('apply', coupon);
  };
  
  const handleEdit = () => {
    if (onAction) onAction('edit', coupon);
  };
  
  const handleDelete = () => {
    if (onAction) onAction('delete', coupon);
  };
  
  const handleToggleStatus = () => {
    if (onAction) onAction('toggleStatus', coupon);
  };
  
  return (
    <div className={`coupon-card ${status}`}>
      {isExclusive && (
        <div className="coupon-badge exclusive">
          <i className="fas fa-star"></i> Exclusive
        </div>
      )}
      
      {isLimited && (
        <div className="coupon-badge limited">
          <i className="fas fa-bolt"></i> Limited
        </div>
      )}
      
      <div className={`coupon-header ${coupon.discount_type.toLowerCase()}`}>
        <div className="coupon-code" onClick={handleCopyCode} title="Click to copy code">
          {coupon.code}
          <i className="fas fa-copy copy-icon"></i>
        </div>
        <div className="coupon-discount">{discountText}</div>
        <div className="coupon-discount-type">
          {coupon.discount_type === 'PERCENT' ? 'Percentage Discount' : 'Flat Discount'}
        </div>
      </div>
      
      <div className="coupon-body">
        <h3 className="coupon-title">{coupon.description || 'Special Discount'}</h3>
        
        <div className="coupon-details">
          <div className="detail-item">
            <i className="fas fa-calendar"></i>
            <span>Valid:</span>
            <span className="value">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
          </div>
          
          {coupon.min_order_amount && (
            <div className="detail-item">
              <i className="fas fa-shopping-cart"></i>
              <span>Min Order:</span>
              <span className="value">${coupon.min_order_amount}</span>
            </div>
          )}
          
          {coupon.max_discount_amount && coupon.discount_type === 'PERCENT' && (
            <div className="detail-item">
              <i className="fas fa-tag"></i>
              <span>Max Discount:</span>
              <span className="value">${coupon.max_discount_amount}</span>
            </div>
          )}
          
          <div className="detail-item">
            <i className="fas fa-users"></i>
            <span>Usage Limit:</span>
            <span className="value">{coupon.usage_limit} per user</span>
          </div>
          
          {coupon.variants && coupon.variants.length > 0 && (
            <div className="detail-item">
              <i className="fas fa-box"></i>
              <span>Applicable Products:</span>
              <span className="value">{coupon.variants.length} items</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="coupon-footer">
        <div className={`coupon-status status-${status}`}>
          <i className={`fas fa-circle status-icon ${status}`}></i>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
        
        {showActions && (
          <div className="coupon-actions">
            {!isAdmin ? (
              status === 'active' && (
                <button 
                  className="btn-apply"
                  onClick={handleApply}
                  title="Apply this coupon"
                >
                  <i className="fas fa-ticket-alt"></i> Apply
                </button>
              )
            ) : (
              <>
                <button 
                  className="btn-edit"
                  onClick={handleEdit}
                  title="Edit coupon"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className={`btn-toggle ${coupon.is_active ? 'active' : 'inactive'}`}
                  onClick={handleToggleStatus}
                  title={coupon.is_active ? 'Deactivate' : 'Activate'}
                >
                  <i className={`fas fa-power-off`}></i>
                </button>
                <button 
                  className="btn-delete"
                  onClick={handleDelete}
                  title="Delete coupon"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

CouponCard.propTypes = {
  coupon: PropTypes.object.isRequired,
  isAdmin: PropTypes.bool,
  onAction: PropTypes.func,
  showActions: PropTypes.bool
};

export default CouponCard;