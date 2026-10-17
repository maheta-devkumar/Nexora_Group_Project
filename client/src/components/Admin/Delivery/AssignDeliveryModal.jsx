import React, { useState, useEffect } from 'react';
import { useDeliveryContext } from '../../../context/DeliveryContext';
import './AssignDeliveryModal.css';

const AssignDeliveryModal = ({ delivery, onClose, onSuccess }) => {
  const { 
    adminGetAvailableDeliveryPersons, 
    adminAssignDeliveryPerson,
    adminReassignDeliveryPerson,
    loading 
  } = useDeliveryContext();

  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('normal');

  useEffect(() => {
    fetchAvailablePersons();
  }, []);

  const fetchAvailablePersons = async () => {
    const result = await adminGetAvailableDeliveryPersons();
    if (result.success && result.data) {
      setDeliveryPersons(result.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPerson) {
      alert('Please select a delivery person');
      return;
    }

    const payload = {
      delivery_id: delivery.delivery_id,
      order_id: delivery.order_id,
      delivery_person_id: selectedPerson,
      notes: notes || undefined,
      priority: priority || 'normal'
    };

    const result = delivery.delivery_person_id 
      ? await adminReassignDeliveryPerson(payload)
      : await adminAssignDeliveryPerson(delivery.order_id, selectedPerson);

    if (result.success) {
      onSuccess();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>
            {delivery.delivery_person_id ? 'Reassign Delivery' : 'Assign Delivery'}
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="delivery-info">
            <div className="info-item">
              <label>Order ID:</label>
              <span className="order-id">{delivery.order_id}</span>
            </div>
            <div className="info-item">
              <label>Customer:</label>
              <span className="customer-name">{delivery.customer_name}</span>
            </div>
            <div className="info-item">
              <label>Current Status:</label>
              <span className="status-badge">{delivery.status}</span>
            </div>
            <div className="info-item">
              <label>Delivery Address:</label>
              <span className="address">{delivery.delivery_address}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="assign-form">
            <div className="form-group">
              <label htmlFor="deliveryPerson">
                Select Delivery Person *
              </label>
              <select
                id="deliveryPerson"
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="person-select"
                disabled={loading}
                required
              >
                <option value="">Choose a delivery person</option>
                {deliveryPersons.map((person) => (
                  <option key={person.user_id} value={person.user_id}>
                    {person.full_name} ({person.phone}) 
                    {person.rating && ` ⭐ ${person.rating}`}
                    {person.available_now && ' 🟢 Available'}
                  </option>
                ))}
              </select>
              <div className="select-hint">
                Showing {deliveryPersons.length} available delivery persons
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="priority-select"
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Special Instructions</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions for the delivery person..."
                className="notes-textarea"
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="assign-btn"
                disabled={loading}
              >
                {loading ? 'Processing...' : delivery.delivery_person_id ? 'Reassign' : 'Assign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignDeliveryModal;