import React, { useEffect, useState } from 'react';
import { useActiveDeliveriesContext } from '../../../context/delivery_panel/ActiveDeliveriesContext';
import DeliveryLayout from '../../../components/DeliveryPerson/Layout/DeliveryLayout';
import './ActiveDeliveries.css';
import { toast } from 'react-toastify';
import {
  Package,
  User,
  MapPin,
  Phone,
  CheckCircle,
  Navigation
} from 'lucide-react';

const ActiveDeliveries = () => {
  const {
    activeDeliveries = [],
    loading,
    error,
    fetchAllActiveDeliveryData,
    requestOTP,
    confirmDelivery
  } = useActiveDeliveriesContext();

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpStep, setOtpStep] = useState('request'); // 'request' or 'confirm'

  useEffect(() => {
    fetchAllActiveDeliveryData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Filtering Logic
  const filteredDeliveries = activeDeliveries.filter(d => {
    // 1. Search Filter (Order ID, Name, Phone)
    const matchesSearch =
      d.order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.order.order_id?.toString().includes(searchTerm) ||
      d.customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customer.phone?.includes(searchTerm);

    // 2. Date Filter (Picked Up At)
    let matchesDate = true;
    if (filterDate && d.picked_up_at) {
      // Simple YYYY-MM-DD comparison
      const pickupDate = new Date(d.picked_up_at).toISOString().split('T')[0];
      matchesDate = pickupDate === filterDate;
    }

    return matchesSearch && matchesDate;
  });

  const handleRequestOTP = async (deliveryId) => {
    setOtpLoading(true);
    setOtpError(null);
    setSelectedDeliveryId(deliveryId);

    // Call backend to request OTP
    const result = await requestOTP(deliveryId);

    setOtpLoading(false);
    if (result.success) {
      setOtpStep('confirm');
      setOtpModalOpen(true);
      toast.success(result.message || "OTP sent successfully!");
    } else {
      toast.error(result.message || "Failed to send OTP");
    }
  };

  const handleConfirmOTP = async () => {
    if (!otp || otp.length < 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    const result = await confirmDelivery(selectedDeliveryId, otp);

    setOtpLoading(false);
    if (result.success) {
      setOtpModalOpen(false);
      setOtp('');
      setOtpStep('request');
      setSelectedDeliveryId(null);
      // Success is handled in context (refresh)
      toast.success("Delivery verification successful!");
    } else {
      setOtpError(result.message || "Confirmation failed");
      toast.error(result.message || "Confirmation failed");
    }
  };

  const handleNavigate = (address) => {
    const q = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  };

  return (
    <DeliveryLayout>
      <div className="dp-active-deliveries-page">
        <div className="dp-active-header">
          <h2>Active Deliveries (Live)</h2>
        </div>

        {/* --- SEARCH & FILTERS --- */}
        <div className="dp-filters-container">
          <div className="dp-filter-item-search">
            <label className="dp-filter-label">Search</label>
            <input
              type="text"
              placeholder="Order ID, Name, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dp-filter-input"
            />
          </div>
          <div className="dp-filter-item-date">
            <label className="dp-filter-label">Filter by Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="dp-filter-input"
            />
          </div>
        </div>

        {error && <div className="dp-error-alert">{error}</div>}

        {loading && activeDeliveries.length === 0 ? (
          <div className="dp-loading-state">Loading...</div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="dp-no-deliveries">
            <Package />
            <h3>No Active Deliveries Found</h3>
            <p>Try clearing your search or filters.</p>
          </div>
        ) : (
          <div className="dp-deliveries-list">
            {filteredDeliveries.map(d => (
              <div key={d.delivery_id} className="dp-delivery-card">
                <div className="dp-card-header">
                  <div>
                    <h3>Order #{d.order.order_number || d.order.order_id}</h3>
                    <span className="dp-status-badge">
                      PICKED UP
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="dp-amount">₹{d.order.total_amount}</div>
                    <div className="dp-payment-type">{d.order.payment_type}</div>
                  </div>
                </div>

                <div className="dp-card-body">
                  <div className="dp-customer-row">
                    <User />
                    <div>
                      <strong>{d.customer.name}</strong> • {d.customer.phone}
                    </div>
                  </div>

                  <div className="dp-location-row">
                    <MapPin />
                    <span>
                      {d.delivery_address.line1}, {d.delivery_address.area_name}, {d.delivery_address.city_name}
                    </span>
                  </div>

                  <div className="dp-delivery-meta">
                    <div>
                      <span className="dp-meta-label">Pickup Time</span>
                      <strong className="dp-meta-value">{d.picked_up_at ? new Date(d.picked_up_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="dp-meta-label">Estimated Arrival</span>
                      <strong className="dp-meta-value">{d.expected_delivery_time ? new Date(d.expected_delivery_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP'}</strong>
                    </div>
                  </div>
                </div>

                <div className="dp-card-actions">
                  <button
                    className="dp-action-btn"
                    onClick={() => {
                      const addr = `${d.delivery_address.line1}, ${d.delivery_address.city_name}`;
                      handleNavigate(addr);
                    }}
                  >
                    <Navigation size={18} /> Navigate
                  </button>
                  <button
                    className="dp-action-btn"
                    onClick={() => window.location.href = `tel:${d.customer.phone}`}
                  >
                    <Phone size={18} /> Call
                  </button>

                  <button
                    className="dp-otp-btn"
                    onClick={() => handleRequestOTP(d.delivery_id)}
                  >
                    <CheckCircle size={20} /> Complete Delivery (OTP)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* OTP MODAL */}
        {otpModalOpen && (
          <div className="dp-modal-overlay">
            <div className="dp-modal-content">
              <h3>Delivery Confirmation</h3>
              <p className="dp-modal-desc">
                Enter the OTP sent to the customer to verify this delivery.
                <small>(Use any 6-digit code for mock if stuck: Check Console)</small>
              </p>

              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="dp-otp-input"
              />

              {otpError && <div className="dp-otp-error">{otpError}</div>}

              <div className="dp-modal-actions">
                <button
                  className="dp-modal-cancel"
                  onClick={() => {
                    setOtpModalOpen(false);
                    setOtp('');
                  }}
                  disabled={otpLoading}
                >
                  Cancel
                </button>
                <button
                  className="dp-modal-confirm"
                  onClick={handleConfirmOTP}
                  disabled={otpLoading || otp.length !== 6}
                >
                  {otpLoading ? 'Verifying...' : 'Confirm Delivery'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default ActiveDeliveries;
