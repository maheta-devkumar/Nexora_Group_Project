// Safe data access utilities for delivery data

export const getSafeAddress = (delivery) => {
  if (!delivery) return 'Address not specified';
  
  // Try different address field names
  const address = delivery.delivery_address || delivery.address || delivery.shipping_address;
  
  if (!address) return 'Address not specified';
  
  // Handle string addresses
  if (typeof address === 'string') {
    return address;
  }
  
  // Handle object addresses
  if (typeof address === 'object') {
    const street = address.street || address.address_line1 || '';
    const city = address.city || '';
    const state = address.state || '';
    const zip = address.zip_code || address.pincode || '';
    return [street, city, state, zip].filter(Boolean).join(', ');
  }
  
  return 'Address not specified';
};

export const getTruncatedAddress = (delivery, maxLength = 50) => {
  const address = getSafeAddress(delivery);
  return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address;
};

export const getOrderNumber = (delivery) => {
  return delivery?.order_number || delivery?.order_id || delivery?.id || 'N/A';
};

export const getCustomerName = (delivery) => {
  if (!delivery?.customer) return 'Customer';
  return delivery.customer.name || delivery.customer.customer_name || 'Customer';
};

export const getCustomerPhone = (delivery) => {
  if (!delivery?.customer) return null;
  return delivery.customer.phone || delivery.customer.contact_number || delivery.customer.mobile;
};

export const getCustomerAvatar = (customer) => {
  if (customer?.profile_picture) {
    return customer.profile_picture;
  }
  
  const name = getCustomerName({ customer });
  const bgColor = ['3b82f6', '10b981', 'f59e0b', 'ef4444'][Math.floor(Math.random() * 4)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bgColor}&color=fff&size=80`;
};

export const getItemsCount = (delivery) => {
  return delivery?.items_count || delivery?.total_items || delivery?.items?.length || 1;
};

export const getPaymentInfo = (delivery) => {
  const type = delivery?.payment_type || delivery?.payment_method || 'N/A';
  const amount = delivery?.amount || delivery?.total_amount || delivery?.order_amount;
  
  if (type.toLowerCase() === 'cod' && amount) {
    return `COD ₹${amount}`;
  } else if (type.toLowerCase() === 'prepaid') {
    return 'Prepaid';
  }
  return type;
};

export const getStatusInfo = (status) => {
  if (!status) return { color: 'pending', text: 'Pending' };
  
  const statusLower = status.toLowerCase();
  
  switch(statusLower) {
    case 'pending_pickup':
    case 'pending':
    case 'assigned':
      return { color: 'pending', text: 'Pending Pickup' };
    case 'picked_up':
    case 'picked':
      return { color: 'picked', text: 'Picked Up' };
    case 'in_transit':
    case 'transit':
      return { color: 'in-transit', text: 'In Transit' };
    case 'out_for_delivery':
      return { color: 'in-transit', text: 'Out for Delivery' };
    case 'delivered':
    case 'completed':
      return { color: 'delivered', text: 'Delivered' };
    default:
      return { color: 'pending', text: status };
  }
};