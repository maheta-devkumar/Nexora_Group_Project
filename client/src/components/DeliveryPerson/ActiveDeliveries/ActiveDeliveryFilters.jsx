import React from 'react';
import './ActiveDeliveryFilters.css';

const ActiveDeliveryFilters = ({ filters, onFilterChange }) => {
  const handleStatusChange = (e) => {
    onFilterChange('status', e.target.value);
  };

  const handleSortChange = (e) => {
    onFilterChange('sort', e.target.value);
  };

  return (
    <div className="active-delivery-filters">
      <div className="filter-group">
        <select 
          className="filter-select"
          value={filters?.status || 'all'}
          onChange={handleStatusChange}
        >
          <option value="all">All Status</option>
          <option value="assigned">Assigned</option>
          <option value="pending_pickup">Pending Pickup</option>
          <option value="picked_up">Picked Up</option>
          <option value="in_transit">In Transit</option>
          <option value="out_for_delivery">Out for Delivery</option>
        </select>
      </div>

      <div className="filter-group">
        <select 
          className="filter-select"
          value={filters?.sort || 'nearest'}
          onChange={handleSortChange}
        >
          <option value="nearest">Sort: Nearest First</option>
          <option value="urgent">Sort: Urgent First</option>
          <option value="time">Sort: Time Slot</option>
          <option value="value">Sort: Highest Value</option>
        </select>
      </div>

      <button className="filter-btn">
        <i data-lucide="filter"></i>
        <span>More Filters</span>
      </button>
    </div>
  );
};

export default ActiveDeliveryFilters;