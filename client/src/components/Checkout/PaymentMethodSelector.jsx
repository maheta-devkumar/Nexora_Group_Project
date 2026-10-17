import React, { useState, useEffect } from 'react';
import './PaymentMethodSelector.css';

const PaymentMethodSelector = ({ paymentMethods, selectedPayment, onSelectPayment, loading }) => {

  // Helper to normalize payment method for display
  const getPaymentType = (method) => {
    const code = (method.method || '').toUpperCase();
    if (code === 'COD' || code === 'CASH_ON_DELIVERY') return 'COD';
    // Group all online methods under 'Razorpay' logic. 
    // Also include generic 'RAZORPAY' or 'ONLINE' if backend sends that.
    if (['CARD', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NETBANKING', 'RAZORPAY', 'ONLINE', 'PAY_ONLINE'].includes(code)) return 'ONLINE';
    return 'ONLINE'; /* Defaulting others to ONLINE as user explicitly requested Razorpay */
  };

  // Consolidate methods: We only want to show ONE "Pay Online" card if there are any online methods available,
  // and ONE "COD" card if available.
  const uniqueMethods = React.useMemo(() => {
    if (!paymentMethods || paymentMethods.length === 0) return [];

    // Debug what we are receiving
    console.log('Payment Methods Received:', paymentMethods);

    const hasCod = paymentMethods.some(m => getPaymentType(m) === 'COD');
    // If we have any method that is NOT COD, we assume it's an online method (Razorpay)
    const hasOnline = paymentMethods.some(m => getPaymentType(m) === 'ONLINE');

    const methods = [];

    if (hasOnline) {
      // Find the first online method to use as the ID/object, but we'll treat it generically
      // or if mixed, just create a virtual one.
      const onlineMethod = paymentMethods.find(m => getPaymentType(m) === 'ONLINE') || { method: 'CARD' };
      methods.push({
        ...onlineMethod,
        id: 'online_payment_group', // Virtual ID for the group
        method: 'ONLINE', // Virtual method code
        name: 'Pay with Razorpay',
        description: '' // Removed as per request
      });
    }

    if (hasCod) {
      const codMethod = paymentMethods.find(m => getPaymentType(m) === 'COD');
      methods.push({
        ...codMethod,
        name: 'Cash on Delivery',
        description: 'Pay cash when your order arrives'
      });
    }

    return methods;
  }, [paymentMethods]);

  const handlePaymentSelect = (method) => {
    // If it's the virtual 'ONLINE' group, we might need to select an actual underlying method
    // For now, passing the virtual object or the first real one.
    // If backend expects specific ID, we might need to handle that. 
    // Assuming selecting "Pay Online" just sets the mode.
    console.log('Payment selected:', method);
    onSelectPayment(method);
  };

  if (loading) {
    return (
      <div className="payment-method-selector loading">
        <div className="payment-methods-grid">
          {[1, 2].map(i => (
            <div key={i} className="payment-method-card loading-skeleton">
              {/* Skeleton content */}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="payment-method-selector">
      {uniqueMethods.length > 0 ? (
        <div className="payment-methods-grid">
          {uniqueMethods.map(method => {
            // Check if selected. Handle both virtual ID and real ID cases if needed.
            // Simplified: just match ID if possible, or method code.
            const isSelected = selectedPayment?.method === method.method ||
              (selectedPayment?.method !== 'COD' && method.method === 'ONLINE' && selectedPayment);

            const isOnline = method.method === 'ONLINE';

            return (
              <div
                key={method.id || method.method}
                className={`payment-method-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handlePaymentSelect(method)}
              >
                <div className="payment-method-header">
                  <div className="payment-type-badge">
                    {isOnline ? <i className="fas fa-credit-card"></i> : <i className="fas fa-wallet"></i>}
                  </div>

                  <div className="payment-info">
                    <h4>{method.name}</h4>
                    {method.description && <p>{method.description}</p>}
                  </div>

                  {/* Checkmark Circle (Matches Address Selector) */}
                  <div className={`selection-indicator ${isSelected ? 'selected' : ''}`}>
                    {isSelected && <i className="fas fa-check"></i>}
                  </div>
                </div>

                {isSelected && (
                  <div className="payment-method-footer">
                    {isOnline ? (
                      <div className="info-notice razorpay">
                        <i className="fas fa-shield-alt"></i>
                        <span>Securely processed by Razorpay</span>
                      </div>
                    ) : (
                      <div className="info-notice cod">
                        <i className="fas fa-hand-holding-usd"></i>
                        <span>Keep exact change ready</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-payment-methods">
          <i className="fas fa-exclamation-triangle"></i>
          <h4>No Payment Options</h4>
          <p>Please try refreshing the page.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;