import React, { useState } from 'react';
import './ReturnOrderModal.css';

const ReturnOrderModal = ({ order, onClose, onConfirm }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnType, setReturnType] = useState('refund');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const returnReasons = [
    'Product damaged',
    'Wrong item received',
    'Item not as described',
    'Changed my mind',
    'Product defective',
    'Size doesn\'t fit',
    'Other reason'
  ];

  const returnTypes = [
    { value: 'refund', label: 'Refund', description: 'Get your money back' },
    { value: 'exchange', label: 'Exchange', description: 'Get a replacement item' },
    { value: 'store-credit', label: 'Store Credit', description: 'Get credit for future purchases' }
  ];

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0 || !returnReason) return;
    
    const returnData = {
      items: selectedItems.map(itemId => {
        const item = order.items.find(i => i.variant_id === itemId || i.id === itemId);
        return {
          variant_id: itemId,
          quantity: item?.quantity || 1
        };
      }),
      reason: returnReason,
      type: returnType,
      additionalDetails,
      timestamp: new Date().toISOString()
    };
    
    onConfirm(returnData);
  };

  const selectedItemsCount = selectedItems.length;
  const isFormValid = selectedItemsCount > 0 && returnReason;

  return (
    <div className="modal-overlay">
      <div className="return-order-modal">
        <div className="modal-header">
          <h2>Return Items</h2>
          <button className="btn-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          <div className="order-info">
            <h4>Order #{order.order_id || order.id}</h4>
            <p>Select items you want to return</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Items to Return ({selectedItemsCount} selected)</h4>
              <div className="items-list">
                {order.items.map(item => (
                  <div 
                    key={item.variant_id || item.id} 
                    className={`item-option ${selectedItems.includes(item.variant_id || item.id) ? 'selected' : ''}`}
                    onClick={() => toggleItemSelection(item.variant_id || item.id)}
                  >
                    <div className="item-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.variant_id || item.id)}
                        onChange={() => toggleItemSelection(item.variant_id || item.id)}
                      />
                      <span className="checkbox-custom"></span>
                    </div>
                    <div className="item-info">
                      <h5>{item.product_name || item.name}</h5>
                      <p>Quantity: {item.quantity}</p>
                      <p className="item-price">${item.price?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="item-image">
                      <div className="image-placeholder">
                        <i className="fas fa-box"></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h4>Return Type</h4>
              <div className="return-type-options">
                {returnTypes.map(type => (
                  <label key={type.value} className="return-type-option">
                    <input
                      type="radio"
                      name="returnType"
                      value={type.value}
                      checked={returnType === type.value}
                      onChange={(e) => setReturnType(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    <div className="type-info">
                      <strong>{type.label}</strong>
                      <span>{type.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h4>Reason for Return *</h4>
              <div className="reason-options">
                {returnReasons.map((reason) => (
                  <label key={reason} className="reason-option">
                    <input
                      type="radio"
                      name="returnReason"
                      value={reason}
                      checked={returnReason === reason}
                      onChange={(e) => setReturnReason(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    {reason}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h4>Additional Details</h4>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Please provide any additional information about your return (e.g., specific issues with the product, preferred exchange options, etc.)"
                rows="4"
              />
            </div>

            <div className="return-instructions">
              <h5>Return Instructions</h5>
              <ul>
                <li>Items must be in original condition with tags attached</li>
                <li>Return shipping label will be emailed to you</li>
                <li>Refunds processed within 5-7 business days after we receive your return</li>
                <li>Exchanges may take 10-14 business days to process</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={onClose}
              >
                Cancel Return
              </button>
              <button 
                type="submit" 
                className="btn-confirm-return"
                disabled={!isFormValid}
              >
                Submit Return Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnOrderModal;