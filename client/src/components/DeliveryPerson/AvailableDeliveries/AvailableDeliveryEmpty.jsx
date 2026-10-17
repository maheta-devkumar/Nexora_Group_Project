import React from 'react';
import './AvailableDeliveryEmpty.css';

const AvailableDeliveryEmpty = ({ hasSearch, onClearSearch }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <i data-lucide="package-x"></i>
      </div>
      
      <div className="empty-content">
        <h3>No Deliveries Available</h3>
        
        {hasSearch ? (
          <>
            <p>No deliveries found matching your search criteria.</p>
            <button 
              className="btn-primary"
              onClick={onClearSearch}
            >
              <i data-lucide="x"></i>
              Clear Search
            </button>
          </>
        ) : (
          <>
            <p>There are currently no deliveries available for pickup.</p>
            <p className="empty-subtext">
              New deliveries will appear here when they become available.
            </p>
          </>
        )}
      </div>
      
      <div className="empty-tips">
        <div className="tip">
          <i data-lucide="refresh-cw"></i>
          <div>
            <strong>Refresh Regularly</strong>
            <span>New deliveries are added throughout the day</span>
          </div>
        </div>
        <div className="tip">
          <i data-lucide="clock"></i>
          <div>
            <strong>Peak Hours</strong>
            <span>More deliveries are available during 10AM-2PM & 4PM-8PM</span>
          </div>
        </div>
        <div className="tip">
          <i data-lucide="map-pin"></i>
          <div>
            <strong>Location Matters</strong>
            <span>Deliveries in your current zone will appear first</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailableDeliveryEmpty;