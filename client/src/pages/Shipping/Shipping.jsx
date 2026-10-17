import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toastSuccess, toastError } from '../../utils/customToast';
import { useCartContext } from '../../context/CartContext';
import './Shipping.css';

const Shipping = () => {
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const navigate = useNavigate();
  
  const { cart } = useCartContext();

  const shippingMethods = [
    {
      id: 1,
      name: 'Standard Shipping',
      price: 4.99,
      delivery: '5-7 business days',
      estimatedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      icon: 'fas fa-truck',
      description: 'Economical and reliable'
    },
    {
      id: 2,
      name: 'Express Shipping',
      price: 9.99,
      delivery: '2-3 business days',
      estimatedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      icon: 'fas fa-shipping-fast',
      description: 'Faster delivery'
    },
    {
      id: 3,
      name: 'Next Day Delivery',
      price: 19.99,
      delivery: 'Next business day',
      estimatedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      icon: 'fas fa-rocket',
      description: 'Get it tomorrow'
    }
  ];

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = subtotal * 0.08;

  const handleContinue = () => {
    if (!selectedShipping) {
      toastError('Please select a shipping method');
      return;
    }
    
    toastSuccess('Shipping method selected');
    navigate('/checkout');
  };

  const handleBack = () => {
    navigate('/checkout');
  };

  return (
    <div className="shipping-page">
      <div className="shipping-container">
        <div className="shipping-header">
          <h1>Shipping Method</h1>
          <p>Choose how you want to receive your order</p>
        </div>

        <div className="shipping-content">
          <div className="shipping-main">
            <div className="shipping-methods">
              <h3>Select Shipping Option</h3>
              <div className="shipping-options">
                {shippingMethods.map(method => (
                  <div 
                    key={method.id}
                    className={`shipping-option ${selectedShipping?.id === method.id ? 'selected' : ''}`}
                    onClick={() => setSelectedShipping(method)}
                  >
                    <div className="option-radio">
                      <div className="radio-circle">
                        {selectedShipping?.id === method.id && <div className="radio-dot"></div>}
                      </div>
                    </div>
                    <div className="option-icon">
                      <i className={method.icon}></i>
                    </div>
                    <div className="option-details">
                      <h4>{method.name}</h4>
                      <p>{method.description}</p>
                      <span className="delivery-info">
                        <i className="fas fa-calendar"></i>
                        Est. {method.estimatedDate}
                      </span>
                    </div>
                    <div className="option-price">
                      {method.price > 0 ? `$${method.price.toFixed(2)}` : 'FREE'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="delivery-instructions">
                <h4>Delivery Instructions (Optional)</h4>
                <textarea
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Add special delivery instructions, leave with neighbor, etc."
                  rows="3"
                />
              </div>

              <div className="shipping-notice">
                <i className="fas fa-info-circle"></i>
                <p>All packages require signature confirmation for delivery</p>
              </div>
            </div>

            <div className="shipping-actions">
              <button className="btn-back" onClick={handleBack}>
                <i className="fas fa-arrow-left"></i>
                Back to Address
              </button>
              <button 
                className="btn-continue"
                onClick={handleContinue}
                disabled={!selectedShipping}
              >
                Continue to Payment
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <div className="shipping-sidebar">
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="order-items">
                {cartItems.map(item => (
                  <div key={item.variant_id} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.product_name}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                    </div>
                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Shipping</span>
                  <span>{selectedShipping ? `$${selectedShipping.price.toFixed(2)}` : '--'}</span>
                </div>
                <div className="total-row">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="total-row grand-total">
                  <span>Total</span>
                  <span>
                    ${(subtotal + tax + (selectedShipping?.price || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="shipping-protection">
              <div className="protection-item">
                <i className="fas fa-shield-alt"></i>
                <div>
                  <h5>Shipping Protection</h5>
                  <p>Coverage for lost, damaged, or stolen packages</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shipping;