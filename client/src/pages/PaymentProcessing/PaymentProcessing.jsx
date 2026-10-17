import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckoutContext } from '../../context/CheckoutContext';
import { verifyPayment } from '../../api/payment';
import { toastSuccess, toastError, toastInfo } from '../../utils/customToast';
import { loadRazorpay } from '../../utils/loadRazorpay';
import './PaymentProcessing.css';

const PaymentProcessing = () => {
  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [message, setMessage] = useState('Initiating payment...');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const {
    selectedPayment,
    checkoutSummary,
    verifiedAddress,
    confirmCheckout,
    resetCheckout
  } = useCheckoutContext();

  const isProcessedRef = useRef(false);

  useEffect(() => {
    const processPaymentFlow = async () => {
      // Prevent double execution
      if (isProcessedRef.current) return;
      isProcessedRef.current = true;

      // 1. Validation
      if (!selectedPayment || !checkoutSummary || !verifiedAddress) {
        setError("Missing checkout information.");
        setStatus('failed');
        setTimeout(() => navigate('/checkout'), 3000);
        return;
      }

      try {
        setMessage("Creating order...");

        // 2. Prepare Payload
        const payload = {
          address_id: verifiedAddress.address_id || verifiedAddress.id,
          coupon_code: checkoutSummary.coupon_code,
          shipping_method: "Standard",
          payment_method: selectedPayment.method === 'RAZORPAY' ? 'ONLINE' : selectedPayment.method
        };

        console.log("🚀 Payload Start -------------------");
        console.log("Selected Payment Object:", selectedPayment);
        console.log("Constructed Payload:", payload);
        console.log("🚀 Payload End ---------------------");

        // 3. Create Order
        const result = await confirmCheckout(payload);

        console.log("📩 Confirm Checkout Response:", result);

        if (!result.success) {
          throw new Error(result.message || "Failed to create order.");
        }

        const { order_id, payment } = result.data;
        console.log("Order Created:", order_id, "Payment Info from Backend:", payment);

        // 4. Handle Payment Method Specifics
        if (payload.payment_method === 'ONLINE') {
          // --- RAZORPAY FLOW ---
          if (!payment || !payment.razorpay_order_id) {
            console.error("Missing Razorpay details:", payment);
            throw new Error("Payment initialization failed: Missing Razorpay configuration.");
          }

          setMessage("Loading secure payment gateway...");

          const isLoaded = await loadRazorpay();
          if (!isLoaded) {
            throw new Error("Failed to load payment gateway. Please check your internet connection.");
          }

          setMessage("Waiting for payment...");

          const options = {
            key: payment.key,
            amount: payment.amount * 100, // Amount in paise
            currency: payment.currency || "INR",
            name: "Nexora",
            description: `Order #${order_id}`,
            order_id: payment.razorpay_order_id,
            prefill: payment.prefill,
            theme: {
              color: "#7c3aed"
            },
            handler: async function (response) {
              try {
                setMessage("Verifying payment...");
                const verifyData = {
                  payment_id: payment.payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                };

                const verifyResult = await verifyPayment(verifyData);

                // Assuming verifyPayment returns standard API response format { success: true, data: ... }
                // or just the data. Let's handle both safety.
                if (verifyResult.success || verifyResult.status === 'SUCCESS') {
                  handleSuccess(order_id, verifyResult.data || verifyResult);
                } else {
                  throw new Error("Payment verification failed.");
                }

              } catch (err) {
                console.error("Verification Error:", err);
                handleFailure(err.message || "Payment verification failed");
              }
            },
            modal: {
              ondismiss: function () {
                console.log("Payment dismissed by user");
                handleFailure("Payment cancelled by user. You can retry from checkout.");
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();

        } else {
          // --- COD FLOW ---
          // Delay purely for UX
          await new Promise(r => setTimeout(r, 1500));
          handleSuccess(order_id, result.data);
        }

      } catch (err) {
        console.error("Payment Execution Error:", err);
        handleFailure(err.message || "An unexpected error occurred.");
      }
    };

    processPaymentFlow();
  }, []); // Run once on mount

  const handleSuccess = (orderId, orderData) => {
    setStatus('success');
    setMessage("Order placed successfully!");
    toastSuccess("Order placed successfully!");

    const confirmationOrder = {
      order_id: orderId,
      order_status: selectedPayment.method === 'COD' ? 'PLACED' : 'PAID',
      total_amount: checkoutSummary.total_amount,
      items: checkoutSummary.items,
      address: verifiedAddress,
      estimated_delivery: "3-5 Business Days"
    };

    localStorage.removeItem('checkoutSummary');

    setTimeout(() => {
      resetCheckout();
      navigate('/order-confirmation', {
        state: { order: confirmationOrder }
      });
    }, 1000);
  };

  const handleFailure = (msg) => {
    console.error("Payment Failure:", msg);
    setError(msg);
    setStatus('failed');
    toastError(msg);
  };

  if (status === 'failed') {
    return (
      <div className="payment-processing-page">
        <div className="processing-container error">
          <div className="processing-header">
            <div className="error-icon"><i className="fas fa-times-circle"></i></div>
            <h1>Payment Failed</h1>
            <p>{error}</p>
          </div>
          <div className="error-actions">
            <button className="btn-retry" onClick={() => navigate('/checkout')}>Return to Checkout</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-processing-page">
      <div className="processing-container">
        <div className="processing-header">
          <h1>Processing Order</h1>
          <p>{message}</p>
        </div>
        <div className="processing-content">
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
          {selectedPayment && (
            <div className="payment-info">
              <p>Method: {selectedPayment.name}</p>
              <p>Amount: ₹{checkoutSummary?.total_amount?.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;