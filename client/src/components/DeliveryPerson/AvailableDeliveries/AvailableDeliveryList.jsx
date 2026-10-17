import React from 'react';
import AvailableDeliveryCard from './AvailableDeliveryCard';
import './AvailableDeliveryList.css';

const AvailableDeliveryList = ({ 
  deliveries, 
  selectedDelivery, 
  onDeliverySelect,
  loading,
  calculateWaitingTime 
}) => {
  if (!deliveries || deliveries.length === 0) {
    return null;
  }

  return (
    <div className="available-delivery-list">
      <div className="list-header">
        <h3>Available Deliveries ({deliveries.length})</h3>
        <span className="list-subtitle">Sorted by: Nearest First</span>
      </div>
      
      <div className="deliveries-grid">
        {deliveries.map((delivery) => (
          <AvailableDeliveryCard
            key={delivery.delivery_id}
            delivery={delivery}
            isSelected={selectedDelivery?.delivery_id === delivery.delivery_id}
            onSelect={() => onDeliverySelect(delivery)}
            calculateWaitingTime={calculateWaitingTime}
          />
        ))}
      </div>
    </div>
  );
};

export default AvailableDeliveryList;