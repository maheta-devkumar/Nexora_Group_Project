import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useOfferContext } from '../../context/OfferContext';
import OfferCard from './OfferCard';
import './OfferList.css';

const OfferList = ({ offers = [], onOfferSelect, emptyMessage = 'No offers available', showFilters = true }) => {
  const { loading } = useOfferContext();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOffers = offers.filter(offer => {
    // Filter by status
    const now = new Date();
    const startDate = new Date(offer.start_date);
    const endDate = new Date(offer.end_date);
    
    let status = 'active';
    if (!offer.is_active) status = 'inactive';
    else if (now < startDate) status = 'upcoming';
    else if (now > endDate) status = 'expired';
    
    if (filter !== 'all' && status !== filter) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        offer.title.toLowerCase().includes(searchLower) ||
        (offer.description && offer.description.toLowerCase().includes(searchLower)) ||
        offer.discount_type.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  const handleOfferSelect = (offer) => {
    if (onOfferSelect) {
      onOfferSelect(offer);
    }
  };
  
  if (loading && offers.length === 0) {
    return (
      <div className="offer-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading offers...</p>
      </div>
    );
  }
  
  if (filteredOffers.length === 0) {
    return (
      <div className="offer-list-empty">
        <div className="empty-icon">
          <i className="fas fa-gift"></i>
        </div>
        <h3 className="empty-title">{emptyMessage}</h3>
        {searchTerm && (
          <p className="empty-subtitle">No offers match "{searchTerm}"</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="offer-list-container">
      {showFilters && (offers.length > 3 || searchTerm) && (
        <div className="offer-list-controls">
          <div className="search-control">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search offers..."
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
          
          <div className="filter-control">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Offers</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="offer-list-stats">
        <span className="stats-count">
          Showing {filteredOffers.length} of {offers.length} offers
        </span>
        {searchTerm && (
          <span className="stats-search">
            Search: "{searchTerm}"
          </span>
        )}
      </div>
      
      <div className="offer-list-grid">
        {filteredOffers.map(offer => (
          <OfferCard
            key={offer.offer_id}
            offer={offer}
            onApply={handleOfferSelect}
            showActions={true}
          />
        ))}
      </div>
    </div>
  );
};

OfferList.propTypes = {
  offers: PropTypes.array,
  onOfferSelect: PropTypes.func,
  emptyMessage: PropTypes.string,
  showFilters: PropTypes.bool
};

export default OfferList;