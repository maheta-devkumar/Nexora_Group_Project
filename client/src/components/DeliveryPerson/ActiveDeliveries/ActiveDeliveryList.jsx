import React from 'react';
import { useActiveDeliveriesContext } from '../../../context/delivery_panel/ActiveDeliveriesContext';
import './ActiveDeliveryList.css';

const ActiveDeliveryList = ({ deliveries, selectedDelivery, onDeliverySelect, onMarkDelivered, loading }) => {
  const { getCustomerContact, getNavigationData } = useActiveDeliveriesContext();

  const getStatusColor = (status) => {
    if (!status) return 'pending';

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending_pickup':
      case 'pending':
      case 'assigned':
        return 'pending';
      case 'picked_up':
      case 'picked':
        return 'picked';
      case 'out_for_delivery':
      case 'in_transit':
      case 'transit':
        return 'in-transit';
      case 'delivered':
      case 'completed':
        return 'delivered';
      default:
        return 'pending';
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Pending';

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending_pickup':
      case 'pending':
      case 'assigned':
        return 'Pending Pickup';
      case 'picked_up':
      case 'picked':
        return 'Picked Up';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'in_transit':
      case 'transit':
        return 'In Transit';
      case 'delivered':
      case 'completed':
        return 'Delivered';
      default:
        return status; // Return the original status if not matched
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const handleCallCustomer = async (deliveryId, e) => {
    e.stopPropagation();
    try {
      const result = await getCustomerContact(deliveryId);
      if (result.success && result.data.phone) {
        window.location.href = `tel:${result.data.phone}`;
      } else if (result.success && result.data.contact_number) {
        window.location.href = `tel:${result.data.contact_number}`;
      }
    } catch (error) {
      console.error('Error calling customer:', error);
    }
  };

  const handleNavigate = async (deliveryId, e) => {
    e.stopPropagation();
    try {
      const result = await getNavigationData(deliveryId);

      // Check for Google Maps URL from backend
      if (result.success && (result.data.google_maps_url || result.data.navigation_url)) {
        window.open(result.data.google_maps_url || result.data.navigation_url, '_blank');
      } else if (result.success) {
        // Fallback: Use address data
        let addressToUse = result.data.delivery_address;

        // If delivery_address is missing but formatted_address exists at root
        if (!addressToUse && result.data.formatted_address) {
          addressToUse = result.data.formatted_address;
        }

        // Handle address object
        if (typeof addressToUse === 'object' && addressToUse !== null) {
          // Check for formatted_address inside object
          if (addressToUse.formatted_address) {
            addressToUse = addressToUse.formatted_address;
          }
          // Check for line1/city schema
          else if (addressToUse.line1 || addressToUse.city_name || addressToUse.area_name) {
            const parts = [];
            if (addressToUse.line1) parts.push(addressToUse.line1);
            if (addressToUse.line2) parts.push(addressToUse.line2);
            if (addressToUse.area_name) parts.push(addressToUse.area_name);
            if (addressToUse.city_name) parts.push(addressToUse.city_name);
            if (addressToUse.pincode) parts.push(addressToUse.pincode);
            addressToUse = parts.filter(Boolean).join(', ');
          }
          // Check for street/city schema
          else if (addressToUse.street || addressToUse.city) {
            const parts = [
              addressToUse.street,
              addressToUse.city,
              addressToUse.state,
              addressToUse.zip_code
            ].filter(Boolean);
            addressToUse = parts.join(', ');
          } else {
            // Last resort fallback for object - filter out empty strings!
            addressToUse = Object.values(addressToUse)
              .filter(v => typeof v === 'string' && v.trim() !== '')
              .join(', ');
          }
        }

        if (addressToUse && typeof addressToUse === 'string' && addressToUse.trim()) {
          const addressEncoded = encodeURIComponent(addressToUse);
          window.open(`https://www.google.com/maps/search/?api=1&query=${addressEncoded}`, '_blank');
        } else {
          alert('Navigation address not available');
        }
      }
    } catch (error) {
      console.error('Error getting navigation:', error);
    }
  };

  // ========== SAFE DATA ACCESSORS ==========

  const getCustomerAvatar = (customer) => {
    if (customer?.profile_picture) {
      return customer.profile_picture;
    }

    const name = getCustomerName(customer);
    const bgColor = ['3b82f6', '10b981', 'f59e0b', 'ef4444'][Math.floor(Math.random() * 4)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=fff&size=80`;
  };

  const getCustomerName = (customer) => {
    if (!customer) return 'Customer';
    return customer.name || customer.customer_name || 'Customer';
  };

  const getCustomerPhone = (customer) => {
    if (!customer) return 'N/A';
    return customer.phone || customer.contact_number || customer.mobile || 'N/A';
  };

  const getDeliveryAddress = (delivery) => {
    if (!delivery) return 'Address not specified';

    // Handle different possible address fields
    const address = delivery.delivery_address || delivery.address || delivery.shipping_address;

    if (!address) return 'Address not specified';

    // Check if address is string
    if (typeof address === 'string') {
      return address.length > 40 ? `${address.substring(0, 40)}...` : address;
    }

    // If address is an object, try to get formatted address
    if (typeof address === 'object' && address !== null) {
      // Check for backend schema properties (line1, area_name, city_name)
      if (address.line1 || address.area_name || address.city_name) {
        const parts = [];
        if (address.line1) parts.push(address.line1);
        if (address.line2) parts.push(address.line2);
        if (address.area_name) parts.push(address.area_name);
        if (address.city_name) parts.push(address.city_name);
        if (address.pincode) parts.push(address.pincode);

        const fullAddress = parts.join(', ');
        return fullAddress.length > 50 ? `${fullAddress.substring(0, 50)}...` : fullAddress;
      }

      // Fallback to previous schema check
      const street = address.street || address.address_line1 || '';
      const city = address.city || '';
      const state = address.state || '';
      const zip = address.zip_code || address.pincode || '';
      const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');
      return fullAddress.length > 50 ? `${fullAddress.substring(0, 50)}...` : fullAddress;
    }

    return 'Address not specified';
  };

  const getPickupAddress = (delivery) => {
    if (!delivery) return 'Pickup location not specified';

    const address = delivery.pickup_address || delivery.store_address || delivery.pickup_location;

    if (!address) return 'Pickup location not specified';

    if (typeof address === 'string') {
      return address.length > 30 ? `${address.substring(0, 30)}...` : address;
    }

    // Handle object pickup addresses
    if (typeof address === 'object' && address !== null) {
      const name = address.name || address.store_name || '';
      const street = address.street || address.address || '';
      const formatted = [name, street].filter(Boolean).join(', ');
      return formatted.length > 30 ? `${formatted.substring(0, 30)}...` : formatted;
    }

    return 'Pickup location not specified';
  };

  const getOrderNumber = (delivery) => {
    return delivery.order_number || delivery.order_id || delivery.id || 'N/A';
  };

  const getItemsCount = (delivery) => {
    const count = delivery.items_count || delivery.total_items || delivery.items?.length || 1;
    return count;
  };

  const getPaymentInfo = (delivery) => {
    const type = delivery.payment_type || delivery.payment_method || 'N/A';
    const amount = delivery.amount || delivery.total_amount || delivery.order_amount;

    if (type.toLowerCase() === 'cod' && amount) {
      return `COD ₹${amount}`;
    } else if (type.toLowerCase() === 'prepaid') {
      return 'Prepaid';
    }
    return type;
  };

  const getDistance = (delivery) => {
    const distance = delivery.distance || delivery.distance_km;
    if (distance) {
      return typeof distance === 'number' ? `${distance} km` : String(distance);
    }
    return '';
  };

  const getExpectedTime = (delivery) => {
    const time = delivery.expected_delivery_time || delivery.expected_time || delivery.delivery_time;
    if (time) {
      return `${formatTime(time)} - ${formatDate(time)}`;
    }
    return 'N/A';
  };

  const getProgressPercentage = (delivery) => {
    const progress = delivery.progress_percentage || delivery.progress;
    return progress && typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : 0;
  };

  const getPriority = (delivery) => {
    return delivery.priority === 'URGENT' || delivery.is_urgent;
  };

  // ========== SAFE DELIVERY SELECTION ==========

  const handleDeliverySelection = (delivery) => {
    // Validate delivery before passing it
    if (!delivery || typeof delivery !== 'object') {
      console.error('Invalid delivery selected');
      return;
    }

    // Create a safe delivery object with only the properties we need
    const safeDelivery = {
      id: delivery.id || delivery.delivery_id,
      order_number: delivery.order_number || delivery.order_id,
      status: delivery.status,
      customer: delivery.customer,
      delivery_address: delivery.delivery_address,
      address: delivery.address,
      shipping_address: delivery.shipping_address,
      pickup_address: delivery.pickup_address,
      distance: delivery.distance,
      progress: delivery.progress_percentage || delivery.progress,
      priority: delivery.priority,
      is_urgent: delivery.is_urgent,
      items_count: delivery.items_count,
      payment_type: delivery.payment_type,
      amount: delivery.amount,
      expected_delivery_time: delivery.expected_delivery_time
    };

    onDeliverySelect(safeDelivery);
  };

  if (loading && deliveries.length === 0) {
    return (
      <div className="deliveries-loading">
        <div className="loading-spinner"></div>
        <p>Loading deliveries...</p>
      </div>
    );
  }

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="no-deliveries">
        <i data-lucide="package-x"></i>
        <h3>No Active Deliveries</h3>
        <p>You don't have any active deliveries at the moment.</p>
      </div>
    );
  }

  return (
    <div className="active-delivery-list detailed">
      {deliveries.map((delivery) => {
        if (!delivery || typeof delivery !== 'object') {
          return null; // Skip invalid deliveries
        }

        const priority = getPriority(delivery);
        const progress = getProgressPercentage(delivery);

        return (
          <div
            key={delivery.id || delivery.delivery_id || Math.random()}
            className={`order-card ${selectedDelivery?.id === delivery.id ? 'selected' : ''} ${priority ? 'urgent' : ''
              }`}
            onClick={() => handleDeliverySelection(delivery)}
          >
            <div className="order-header">
              <div className="order-id">
                <span className="order-number">#{getOrderNumber(delivery)}</span>
                {priority && (
                  <span className="order-priority">URGENT</span>
                )}
              </div>
              <span className={`order-status ${getStatusColor(delivery.status)}`}>
                {getStatusText(delivery.status)}
              </span>
            </div>

            <div className="order-body">
              <div className="customer-info">
                <img
                  src={getCustomerAvatar(delivery.customer)}
                  alt={getCustomerName(delivery.customer)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=Customer&background=3b82f6&color=fff&size=80`;
                  }}
                />
                <div>
                  <strong>{getCustomerName(delivery.customer)}</strong>
                  <span>{getCustomerPhone(delivery.customer)}</span>
                </div>
              </div>

              <div className="delivery-info">
                <div className="info-item">
                  <i data-lucide="map-pin"></i>
                  <span>From: {getPickupAddress(delivery)}</span>
                </div>

                <div className="info-item">
                  <i data-lucide="map-pin"></i>
                  <span>
                    To: {getDeliveryAddress(delivery)}
                    {getDistance(delivery) && ` - ${getDistance(delivery)}`}
                  </span>
                </div>

                <div className="info-item">
                  <i data-lucide="clock"></i>
                  <span>Expected: {getExpectedTime(delivery)}</span>
                </div>

                <div className="info-item">
                  <i data-lucide="package"></i>
                  <span>
                    {getItemsCount(delivery)} item{getItemsCount(delivery) !== 1 ? 's' : ''}
                    {getPaymentInfo(delivery) && ` • ${getPaymentInfo(delivery)}`}
                  </span>
                </div>
              </div>

              {progress > 0 && progress <= 100 && (
                <div className="delivery-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {progress}% Complete
                    {delivery.estimated_minutes_away && ` • ${delivery.estimated_minutes_away} mins away`}
                  </span>
                </div>
              )}
            </div>

            <div className="order-actions">
              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  const deliveryId = delivery.id || delivery.delivery_id;
                  if (deliveryId) {
                    handleCallCustomer(deliveryId, e);
                  }
                }}
              >
                <i data-lucide="phone"></i>
                Call
              </button>

              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  const deliveryId = delivery.id || delivery.delivery_id;
                  if (deliveryId) {
                    handleNavigate(deliveryId, e);
                  }
                }}
              >
                <i data-lucide="navigation"></i>
                Navigate
              </button>

              {delivery.status === 'pending_pickup' || delivery.status === 'assigned' ? (
                <button className="btn-primary" onClick={(e) => e.stopPropagation()}>
                  <i data-lucide="check"></i>
                  Mark Picked
                </button>
              ) : null}

              {delivery.status === 'picked_up' ? (
                <button className="btn-primary" onClick={(e) => e.stopPropagation()}>
                  <i data-lucide="arrow-right"></i>
                  Start Delivery
                </button>
              ) : null}

              {delivery.status === 'out_for_delivery' || delivery.status === 'in_transit' ? (
                <button
                  className="btn-success"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onMarkDelivered) onMarkDelivered(delivery);
                  }}
                >
                  <i data-lucide="check-circle"></i>
                  Mark Delivered
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveDeliveryList;