import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAddressContext } from '../../context/AddressContext';
import { useCheckoutContext } from '../../context/CheckoutContext';
import { useCartContext } from '../../context/CartContext';
import CheckoutStepper from '../../components/Checkout/CheckoutStepper';
import AddressSelector from '../../components/Checkout/AddressSelector';
import PaymentMethodSelector from '../../components/Checkout/PaymentMethodSelector';
import OrderSummary from '../../components/Checkout/OrderSummary';
import AddAddressModal from '../../components/Checkout/AddAddressModal';
import { toastSuccess, toastError } from '../../utils/customToast';
import './Checkout.css';

const Checkout = () => {
  const {
    currentStep,
    setCurrentStep,
    verifiedAddress,
    setVerifiedAddress,
    selectedPayment,
    setSelectedPayment,
    orderNotes,
    setOrderNotes,
    checkoutSummary,
    fetchPaymentMethods,
    paymentMethods,
    loading: checkoutLoading,
    setCartItems,
    setCheckoutSummary,
    resetCheckout  // Add this
  } = useCheckoutContext();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization

  const navigate = useNavigate();
  const location = useLocation();

  const { addresses, fetchUserAddresses, loading: addressLoading } = useAddressContext();
  const { cart, loading: isCartLoading, clearCart } = useCartContext();

  // Initialize checkout - RUN ONCE when component mounts
  useEffect(() => {
    console.log('🔵 Checkout component mounted');

    // Always reset to step 1 when arriving at checkout, UNLESS returning from verification
    if (!location.state?.preserveState && location.state?.from !== 'address-verification') {
      console.log('🔄 Resetting checkout to step 1');
      setCurrentStep(1);
      setVerifiedAddress(null);
      setSelectedPayment(null);
      setSelectedAddress(null);
    } else if (location.state?.from === 'address-verification') {
      // If returning from verification, ensure we don't reset and let the specific handler take over
      console.log('↩️ Returning from verification, preserving state');
    }

    // Fetch data
    fetchUserAddresses();
    fetchPaymentMethods();

    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      console.log('🔵 Checkout component unmounting');
    };
  }, [setCurrentStep, setVerifiedAddress, setSelectedPayment, location.state]);

  // Handle returning from address verification
  useEffect(() => {
    if (isInitialized && location.state?.from === 'address-verification') {
      console.log('↩️ Returning from address verification');
      console.log('Verified address:', verifiedAddress);

      const addressToUse = verifiedAddress || location.state?.address;

      if (addressToUse) {
        if (!verifiedAddress) setVerifiedAddress(addressToUse);
        setSelectedAddress(addressToUse);
        setCurrentStep(2); // Move to payment step

        // Clear the state to prevent infinite loops but preserve what we need if we refreshed
        navigate('/checkout', { replace: true, state: { preserveState: true } });
      }
    }
  }, [location.state, verifiedAddress, setCurrentStep, navigate, isInitialized]);

  // Set cart items
  useEffect(() => {
    if (cart?.items) {
      setCartItems(cart);
    }
  }, [cart, setCartItems]);

  // Set first address as selected when addresses load (only if step 1)
  useEffect(() => {
    if (isInitialized && currentStep === 1 && addresses.length > 0 && !selectedAddress && !verifiedAddress) {
      console.log('📍 Setting first address as selected');
      setSelectedAddress(addresses[0]);
    }
  }, [addresses, selectedAddress, verifiedAddress, currentStep, isInitialized]);

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const steps = [
    { number: 1, title: 'Address', description: 'Shipping Information' },
    { number: 2, title: 'Payment', description: 'Payment Method' },
    { number: 3, title: 'Review', description: 'Order Review' }
  ];

  const handleNextStep = () => {
    console.log('▶️ Next step clicked. Current step:', currentStep);

    if (currentStep === 1) {
      if (!selectedAddress) {
        toastError('Please select a shipping address');
        return;
      }

      console.log('📍 Selected address:', selectedAddress);
      console.log('➡️ Navigating to address verification');

      // Set the selected address as verified and navigate to verification
      setVerifiedAddress(selectedAddress);
      navigate('/address-verification', {
        state: {
          from: 'checkout',
          address: selectedAddress
        }
      });
      return;
    }

    if (currentStep === 2 && !selectedPayment) {
      toastError('Please select a payment method');
      return;
    }

    if (currentStep === 3) {
      const summary = {
        items: cartItems,
        subtotal,
        tax_amount: tax,
        delivery_fee: shipping,
        discount_amount: 0,
        total_amount: total,
        coupon_code: null
      };

      console.log('📋 Creating checkout summary:', summary);
      setCheckoutSummary(summary);
      navigate('/payment-processing');
      return;
    }

    // For other steps, just advance
    console.log('⏭️ Advancing to step', currentStep + 1);
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    console.log('◀️ Previous step clicked. Current step:', currentStep);

    if (currentStep > 1) {
      // If going back from payment to address, clear verified address
      if (currentStep === 2) {
        console.log('🔄 Clearing verified address');
        setVerifiedAddress(null);
      }
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/cart');
    }
  };

  const handleAddNewAddress = () => {
    setShowAddAddressModal(true);
  };

  const handleAddressAdded = (newAddress) => {
    // Refresh addresses list
    fetchUserAddresses();
    // Select the new address
    setSelectedAddress(newAddress);
    setShowAddAddressModal(false);
  };

  // Handle address selection
  const handleAddressSelect = (address) => {
    console.log('📍 Address selected:', address);
    setSelectedAddress(address);
  };

  const isLoadingAddresses = addressLoading;
  const isPageLoading = checkoutLoading || isCartLoading;

  // Debug logging
  console.log('🔍 Checkout debug:', {
    currentStep,
    selectedAddress,
    verifiedAddress,
    addressesCount: addresses.length,
    hasLocationState: !!location.state,
    locationState: location.state,
    isInitialized
  });

  if (isPageLoading || !isInitialized) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        Loading checkout...
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <p>Complete your purchase securely</p>
        </div>

        <CheckoutStepper
          steps={steps}
          currentStep={currentStep}
        />

        <div className="checkout-content">
          <div className="checkout-main">
            {currentStep === 1 && (
              <div className="checkout-step">
                <div className="step-header">
                  <h2>Shipping Address</h2>
                  {verifiedAddress && (
                    <div className="verified-badge">
                      <i className="fas fa-check-circle"></i>
                      Address Verified
                    </div>
                  )}
                </div>

                <div className="step-info">
                  <p className="step-description">
                    Please select or add a shipping address for delivery.
                  </p>
                </div>

                <AddressSelector
                  addresses={addresses}
                  selectedAddress={selectedAddress}
                  onSelectAddress={handleAddressSelect}
                  onAddNewAddress={handleAddNewAddress}
                />

                <div className="order-notes">
                  <label htmlFor="orderNotes">Order Notes (Optional)</label>
                  <textarea
                    id="orderNotes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Add any special instructions for delivery..."
                    rows="3"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="checkout-step">
                <div className="step-header">
                  <h2>Payment Method</h2>
                  {verifiedAddress && (
                    <div className="verified-address-info">
                      <i className="fas fa-check-circle"></i>
                      <span>Shipping to: {verifiedAddress.line1}</span>
                    </div>
                  )}
                </div>

                <div className="step-info">
                  <p className="step-description">
                    Select your preferred payment method.
                  </p>
                </div>

                <PaymentMethodSelector
                  paymentMethods={paymentMethods}
                  selectedPayment={selectedPayment}
                  onSelectPayment={setSelectedPayment}
                  loading={checkoutLoading}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="checkout-step">
                <h2>Order Review</h2>
                <div className="review-section">
                  <div className="review-address">
                    <h4>Shipping Address</h4>
                    {verifiedAddress && (
                      <div className="selected-address">
                        <div className="verified-indicator">
                          <i className="fas fa-check-circle"></i>
                          Verified
                        </div>
                        <p><strong>{verifiedAddress.line1}</strong></p>
                        <p>{verifiedAddress.line2}</p>
                        <p>{verifiedAddress.area_name}, {verifiedAddress.city_name}, {verifiedAddress.state_name} {verifiedAddress.pincode}</p>
                      </div>
                    )}
                  </div>

                  <div className="review-payment">
                    <h4>Payment Method</h4>
                    {selectedPayment && (
                      <div className="selected-payment">
                        <i className={`fab ${selectedPayment.icon || 'fa-credit-card'}`}></i>
                        <span>{selectedPayment.name}</span>
                      </div>
                    )}
                  </div>

                  {orderNotes && (
                    <div className="review-notes">
                      <h4>Order Notes</h4>
                      <p>{orderNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="checkout-navigation">
              <button
                className="btn-prev"
                onClick={handlePreviousStep}
                disabled={addressLoading}
              >
                <i className="fas fa-arrow-left"></i>
                {currentStep === 1 ? 'Back to Cart' : 'Previous'}
              </button>

              <button
                className="btn-next"
                onClick={handleNextStep}
                disabled={
                  (currentStep === 1 && !selectedAddress) ||
                  (currentStep === 2 && !selectedPayment) ||
                  addressLoading
                }
              >
                {currentStep === 1 ? 'Verify Address' :
                  currentStep === 2 ? 'Review Order' :
                    'Place Order'}
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <div className="checkout-sidebar">
            <OrderSummary
              items={cartItems}
              subtotal={subtotal}
              shipping={shipping}
              tax={tax}
              total={total}
            />

            <div className="checkout-security">
              <div className="security-item">
                <i className="fas fa-lock"></i>
                <span>Secure SSL Encryption</span>
              </div>
              <div className="security-item">
                <i className="fas fa-shield-alt"></i>
                <span>Privacy Protected</span>
              </div>
              <div className="security-item">
                <i className="fas fa-undo"></i>
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <AddAddressModal
        isOpen={showAddAddressModal}
        onClose={() => setShowAddAddressModal(false)}
        onAddressAdded={handleAddressAdded}
      />
    </div>
  );
};

export default Checkout;