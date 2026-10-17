import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useCouponContext } from '../../context/CouponContext';
import CouponCard from './CouponCard';
import './CouponList.css';

const CouponList = ({ coupons = [], isAdmin = false, onCouponAction, emptyMessage = 'No coupons available' }) => {
  const { loading } = useCouponContext();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCoupons = coupons.filter(coupon => {
    // Filter by status
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);
    
    let status = 'active';
    if (!coupon.is_active) status = 'inactive';
    else if (now < startDate) status = 'upcoming';
    else if (now > endDate) status = 'expired';
    
    if (filter !== 'all' && status !== filter) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        coupon.code.toLowerCase().includes(searchLower) ||
        (coupon.description && coupon.description.toLowerCase().includes(searchLower)) ||
        coupon.discount_type.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  const handleCouponAction = (action, coupon) => {
    if (onCouponAction) {
      onCouponAction(action, coupon);
    }
  };
  
  if (loading && coupons.length === 0) {
    return (
      <div className="coupon-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading coupons...</p>
      </div>
    );
  }
  
  if (filteredCoupons.length === 0) {
    return (
      <div className="coupon-list-empty">
        <div className="empty-icon">
          <i className="fas fa-ticket-alt"></i>
        </div>
        <h3 className="empty-title">{emptyMessage}</h3>
        {searchTerm && (
          <p className="empty-subtitle">No coupons match "{searchTerm}"</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="coupon-list-container">
      {(isAdmin || coupons.length > 5) && (
        <div className="coupon-list-controls">
          <div className="search-control">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          
          {isAdmin && (
            <div className="filter-control">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Coupons</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          )}
        </div>
      )}
      
      <div className="coupon-list-stats">
        <span className="stats-count">
          Showing {filteredCoupons.length} of {coupons.length} coupons
        </span>
        {searchTerm && (
          <span className="stats-search">
            Search: "{searchTerm}"
          </span>
        )}
      </div>
      
      <div className="coupon-list-grid">
        {filteredCoupons.map(coupon => (
          <CouponCard
            key={coupon.coupon_id}
            coupon={coupon}
            isAdmin={isAdmin}
            onAction={handleCouponAction}
            showActions={true}
          />
        ))}
      </div>
    </div>
  );
};

CouponList.propTypes = {
  coupons: PropTypes.array,
  isAdmin: PropTypes.bool,
  onCouponAction: PropTypes.func,
  emptyMessage: PropTypes.string
};

export default CouponList;