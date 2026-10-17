import React from 'react';
import { usePendingPickupsContext } from '../../../context/delivery_panel/PendingPickupsContext';
import './PickupList.css';

const PickupList = ({ groupedPickups, selectedPickup, onPickupSelect, loading }) => {
  const { fetchVendorContact, fetchPickupNavigation } = usePendingPickupsContext();

  // Safe data accessors
  const getLocationName = (location) => {
    if (!location) return 'Unknown Location';
    return location.location_name || location.name || location.address || 'Pickup Location';
  };

  const getLocationAddress = (location) => {
    if (!location) return 'Address not specified';
    
    const address = location.address || location.full_address || location.location_address;
    
    if (!address) return 'Address not specified';
    
    if (typeof address === 'string') {
      return address.length > 60 ? `${address.substring(0, 60)}...` : address;
    }
    
    if (typeof address === 'object' && address !== null) {
      const street = address.street || address.address_line1 || '';
      const city = address.city || '';
      const state = address.state || '';
      const zip = address.zip_code || address.pincode || '';
      const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');
      return fullAddress.length > 60 ? `${fullAddress.substring(0, 60)}...` : fullAddress;
    }
    
    return 'Address not specified';
  };

  const getDistance = (location) => {
    const distance = location.distance || location.distance_km;
    if (distance) {
      return typeof distance === 'number' ? `${distance.toFixed(1)} km away` : String(distance);
    }
    return '';
  };

  const getPickupId = (pickup) => {
    return pickup.pickup_id || pickup.delivery_id || pickup.id || 'N/A';
  };

  const getOrderNumber = (pickup) => {
    return pickup.order_number || pickup.order_id || 'N/A';
  };

  const getCustomerName = (pickup) => {
    if (!pickup.customer) return 'Customer';
    return pickup.customer.name || pickup.customer.customer_name || 'Customer';
  };

  const getPackageInfo = (pickup) => {
    const count = pickup.package_count || pickup.items_count || pickup.total_items || 1;
    const type = pickup.package_type || pickup.package_size || '';
    
    let info = `${count} package${count !== 1 ? 's' : ''}`;
    if (type) {
      info += ` • ${type}`;
    }
    
    if (pickup.priority === 'URGENT') {
      info += ' • URGENT';
    }
    
    return info;
  };

  const getVendorPhone = (location) => {
    if (!location.contact) return null;
    return location.contact.phone || location.contact.contact_number || location.contact.mobile;
  };

  const handleCallVendor = async (location, e) => {
    e.stopPropagation();
    const phone = getVendorPhone(location);
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleNavigate = async (location, e) => {
    e.stopPropagation();
    const address = encodeURIComponent(getLocationAddress(location));
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const handleViewDetails = (pickup, e) => {
    e.stopPropagation();
    onPickupSelect(pickup);
  };

  const handleConfirmPickup = (pickup, e) => {
    e.stopPropagation();
    onPickupSelect(pickup);
  };

  if (loading && groupedPickups.length === 0) {
    return (
      <div className="pickups-loading">
        <div className="loading-spinner"></div>
        <p>Loading pickup locations...</p>
      </div>
    );
  }

  if (!groupedPickups || groupedPickups.length === 0) {
    return (
      <div className="no-pickups">
        <i data-lucide="store"></i>
        <h3>No Pending Pickups</h3>
        <p>You don't have any pending pickups at the moment.</p>
      </div>
    );
  }

  return (
    <div className="pickup-locations">
      {groupedPickups.map((location, index) => {
        const pickups = location.pickups || [];
        
        return (
          <div 
            key={location.location_id || index}
            className="location-card"
          >
            <div className="location-header">
              <div className="location-name">
                <i data-lucide="store"></i>
                <div>
                  <h4>{getLocationName(location)}</h4>
                  <span>{getLocationAddress(location)} • {getDistance(location)}</span>
                </div>
              </div>
              <span className="pickup-count">{pickups.length} packages</span>
            </div>
            
            <div className="location-actions">
              <button 
                className="btn-secondary"
                onClick={(e) => handleCallVendor(location, e)}
                disabled={!getVendorPhone(location)}
              >
                <i data-lucide="phone"></i>
                Call Vendor
              </button>
              <button 
                className="btn-secondary"
                onClick={(e) => handleNavigate(location, e)}
              >
                <i data-lucide="navigation"></i>
                Navigate
              </button>
            </div>
            
            <div className="pickup-list">
              {pickups.map((pickup, pickupIndex) => {
                const isSelected = selectedPickup?.delivery_id === pickup.delivery_id;
                
                return (
                  <div 
                    key={pickup.delivery_id || pickupIndex}
                    className={`pickup-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => onPickupSelect(pickup)}
                  >
                    <div className="pickup-info">
                      <span className="pickup-id">#{getPickupId(pickup)}</span>
                      <strong>Order #{getOrderNumber(pickup)}</strong>
                      <span>Customer: {getCustomerName(pickup)}</span>
                      <span>{getPackageInfo(pickup)}</span>
                      
                      {pickup.pickup_window && (
                        <span className="pickup-time">
                          <i data-lucide="clock"></i>
                          {pickup.pickup_window}
                        </span>
                      )}
                    </div>
                    <div className="pickup-actions">
                      <button 
                        className="btn-secondary"
                        onClick={(e) => handleViewDetails(pickup, e)}
                      >
                        View Details
                      </button>
                      <button 
                        className="btn-primary"
                        onClick={(e) => handleConfirmPickup(pickup, e)}
                      >
                        <i data-lucide="check"></i>
                        Confirm Pickup
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PickupList;