import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAddressContext } from '../../context/AddressContext';
import { useCheckoutContext } from '../../context/CheckoutContext';
import { toastSuccess, toastWarning, toastError } from '../../utils/customToast';
import './AddressVerification.css';

const AddressVerification = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [useManual, setUseManual] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    state_id: '',
    city_id: '',
    area_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualAreas, setManualAreas] = useState([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    states, 
    cities, 
    areas, 
    addresses, 
    fetchUserAddresses, 
    createAddress, 
    fetchStates,
    fetchCitiesByState,
    fetchAreasByCity,
    loading 
  } = useAddressContext();
  
  const { setVerifiedAddress, setCurrentStep } = useCheckoutContext();

  useEffect(() => {
    console.log('AddressVerification location state:', location.state);
    fetchUserAddresses();
    
    // Fetch states if not already loaded
    if (states.length === 0) {
      fetchStates();
    }
    
    // If coming from checkout with a preselected address
    if (location.state?.address) {
      setSelectedAddress(location.state.address);
      console.log('Preselected address from checkout:', location.state.address);
    }
  }, [fetchUserAddresses, fetchStates, location.state, states.length]);

  // Set first address as selected when addresses load (if no preselected)
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress && !location.state?.address) {
      setSelectedAddress(addresses[0]);
    }
  }, [addresses, selectedAddress, location.state]);

  // Handle state selection for manual address
  const handleManualStateChange = async (stateId) => {
    setManualAddress(prev => ({
      ...prev,
      state_id: stateId,
      city_id: '',
      area_id: '',
      zipCode: '',
      state: states.find(s => s.state_id === parseInt(stateId))?.state_name || ''
    }));

    if (!stateId) {
      setManualAreas([]);
      return;
    }

    try {
      await fetchCitiesByState(stateId);
    } catch {
      toastError('Failed to load cities');
    }
  };

  // Handle city selection for manual address
  const handleManualCityChange = async (cityId) => {
    setManualAddress(prev => ({
      ...prev,
      city_id: cityId,
      area_id: '',
      zipCode: '',
      city: cities.find(c => c.city_id === parseInt(cityId))?.city_name || ''
    }));

    if (!cityId) {
      setManualAreas([]);
      return;
    }

    try {
      await fetchAreasByCity(cityId);
      setManualAreas(areas); // Use the areas from context
    } catch {
      toastError('Failed to load areas');
    }
  };

  // Handle area selection for manual address
  const handleManualAreaChange = (areaId) => {
    const selectedArea = areas.find(a => a.area_id === parseInt(areaId));
    
    setManualAddress(prev => ({
      ...prev,
      area_id: areaId,
      zipCode: selectedArea?.pincode || ''
    }));
  };

  const handleUseSelected = async () => {
    if (!selectedAddress) {
      toastWarning('Please select an address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('Verifying address:', selectedAddress);
      
      // Set the verified address in checkout context
      setVerifiedAddress(selectedAddress);
      // Update checkout step to payment (step 2)
      setCurrentStep(2);
      
      toastSuccess('Address verified successfully');
      
      // Navigate back to checkout with state
      navigate('/checkout', { 
        state: { 
          from: 'address-verification',
          address: selectedAddress 
        } 
      });
      
    } catch (error) {
      console.error('Address verification error:', error);
      toastError('Failed to verify address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseManual = async () => {
    if (!manualAddress.street || !manualAddress.state_id || !manualAddress.city_id || !manualAddress.area_id) {
      toastWarning('Please complete all address fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Get the selected area to ensure we have pincode
      const selectedArea = areas.find(a => a.area_id === parseInt(manualAddress.area_id));
      
      if (!selectedArea) {
        toastError('Please select a valid area');
        setIsSubmitting(false);
        return;
      }
      
      const addressData = {
        address_type: 'Home',
        line1: manualAddress.street.trim(),
        line2: '',
        area_id: parseInt(manualAddress.area_id),
        is_default: false
      };

      console.log('Creating manual address:', addressData);
      const result = await createAddress(addressData);
      
      if (result.success) {
        // Set the new address as verified in checkout context
        setVerifiedAddress(result.data);
        // Update checkout step to payment (step 2)
        setCurrentStep(2);
        
        toastSuccess('Manual address saved and verified');
        
        // Navigate back to checkout with state
        navigate('/checkout', { 
          state: { 
            from: 'address-verification',
            address: result.data 
          } 
        });
      } else {
        toastError(result.message || 'Failed to save manual address');
      }
    } catch (error) {
      console.error('Manual address error:', error);
      toastError('Failed to save manual address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOriginal = () => {
    setUseManual(true);
    if (selectedAddress) {
      const address = selectedAddress;
      setManualAddress({
        street: address.line1 || '',
        city: address.city_name || '',
        state: address.state_name || '',
        zipCode: address.pincode || '',
        state_id: address.state_id?.toString() || '',
        city_id: address.city_id?.toString() || '',
        area_id: address.area_id?.toString() || ''
      });
      
      // Load relevant cities and areas if needed
      if (address.state_id && states.length > 0) {
        const stateExists = states.find(s => s.state_id === address.state_id);
        if (!stateExists) {
          fetchStates().then(() => {
            if (address.state_id) {
              fetchCitiesByState(address.state_id).then(() => {
                if (address.city_id) {
                  fetchAreasByCity(address.city_id);
                }
              });
            }
          });
        } else {
          if (address.state_id) {
            fetchCitiesByState(address.state_id).then(() => {
              if (address.city_id) {
                fetchAreasByCity(address.city_id);
              }
            });
          }
        }
      }
    }
  };

  const handleBackToSelection = () => {
    setUseManual(false);
    setManualAddress({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      state_id: '',
      city_id: '',
      area_id: ''
    });
    setManualAreas([]);
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    console.log('Address selected in verification:', address);
  };

  // Show loading state when addresses are being fetched
  if (loading) {
    return (
      <div className="address-verification-page">
        <div className="verification-container">
          <div className="loading-container">
            <i className="fas fa-spinner fa-spin fa-2x"></i>
            <p>Loading your addresses...</p>
          </div>
        </div>
      </div>
    );
  }

  // Debug info
  console.log('AddressVerification debug:', {
    selectedAddress,
    addressesCount: addresses.length,
    useManual,
    locationState: location.state,
    statesCount: states.length,
    citiesCount: cities.length,
    areasCount: areas.length
  });

  return (
    <div className="address-verification-page">
      <div className="verification-container">
        <div className="verification-header">
          <h1>Verify Your Address</h1>
          <p>Confirm your delivery address to proceed to payment</p>
        </div>

        <div className="verification-content">
          <div className="address-options">
            {!useManual ? (
              <>
                <div className="option-section">
                  <h3>Select Delivery Address</h3>
                  <p className="section-description">
                    Choose an address for delivery. After verification, you'll proceed to payment.
                  </p>

                  {addresses.length === 0 ? (
                    <div className="no-addresses">
                      <i className="fas fa-map-marker-alt"></i>
                      <h4>No addresses found</h4>
                      <p>Please add an address to continue with checkout</p>
                    </div>
                  ) : (
                    <div className="address-list">
                      {addresses.map((address) => (
                        <div 
                          key={address.address_id}
                          className={`address-option ${
                            selectedAddress?.address_id === address.address_id ? 'selected' : ''
                          }`}
                          onClick={() => handleAddressSelect(address)}
                        >
                          <div className="address-radio">
                            <div className="radio-circle">
                              {selectedAddress?.address_id === address.address_id && (
                                <div className="radio-dot"></div>
                              )}
                            </div>
                          </div>
                          <div className="address-details">
                            <div className="address-line primary">{address.line1}</div>
                            {address.line2 && (
                              <div className="address-line secondary">{address.line2}</div>
                            )}
                            <div className="address-line">
                              {address.area_name}, {address.city_name}, {address.state_name} {address.pincode}
                            </div>
                            <div className="address-meta">
                              <span className={`confidence-badge ${address.is_default ? 'high' : 'medium'}`}>
                                {address.is_default ? 'Default' : 'Verified'}
                              </span>
                              <span className="address-type">
                                <i className={`fas fa-${getAddressTypeIcon(address.address_type)}`}></i>
                                {address.address_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {addresses.length > 0 && (
                  <div className="manual-option">
                    <button 
                      className="btn-edit-manual" 
                      onClick={handleEditOriginal}
                      disabled={!selectedAddress}
                    >
                      <i className="fas fa-edit"></i>
                      Edit Selected Address Manually
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="manual-address-form">
                <div className="form-header">
                  <h3>Edit Address Manually</h3>
                  <button 
                    className="btn-back-to-selection"
                    onClick={handleBackToSelection}
                    disabled={isSubmitting}
                  >
                    <i className="fas fa-arrow-left"></i>
                    Back to Address Selection
                  </button>
                </div>
                
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      value={manualAddress.street}
                      onChange={(e) => setManualAddress(prev => ({
                        ...prev,
                        street: e.target.value
                      }))}
                      placeholder="Enter street address"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>State *</label>
                    <select
                      value={manualAddress.state_id}
                      onChange={(e) => handleManualStateChange(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">Select State</option>
                      {states.map(state => (
                        <option key={state.state_id} value={state.state_id}>
                          {state.state_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>City *</label>
                    <select
                      value={manualAddress.city_id}
                      onChange={(e) => handleManualCityChange(e.target.value)}
                      disabled={!manualAddress.state_id || isSubmitting}
                    >
                      <option value="">Select City</option>
                      {cities.map(city => (
                        <option key={city.city_id} value={city.city_id}>
                          {city.city_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Area *</label>
                    <select
                      value={manualAddress.area_id}
                      onChange={(e) => handleManualAreaChange(e.target.value)}
                      disabled={!manualAddress.city_id || isSubmitting}
                    >
                      <option value="">Select Area</option>
                      {areas.map(area => (
                        <option key={area.area_id} value={area.area_id}>
                          {area.area_name} ({area.pincode})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={manualAddress.zipCode}
                      readOnly
                      className="readonly-input"
                      placeholder="Auto-filled from selected area"
                    />
                  </div>
                </div>
                
                <div className="form-note">
                  <i className="fas fa-info-circle"></i>
                  <p>All fields marked with * are required for address verification</p>
                </div>
              </div>
            )}
          </div>

          <div className="verification-sidebar">
            <div className="verification-info">
              <h4>Next Step: Payment</h4>
              <div className="info-list">
                <div className="info-item">
                  <i className="fas fa-credit-card"></i>
                  <div>
                    <h5>Secure Payment</h5>
                    <p>Multiple payment options available</p>
                  </div>
                </div>
                <div className="info-item">
                  <i className="fas fa-lock"></i>
                  <div>
                    <h5>SSL Encrypted</h5>
                    <p>Your payment details are secure</p>
                  </div>
                </div>
                <div className="info-item">
                  <i className="fas fa-shipping-fast"></i>
                  <div>
                    <h5>Fast Processing</h5>
                    <p>Quick order processing after payment</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="current-selection">
              <h4>Selected Address</h4>
              {selectedAddress && !useManual ? (
                <div className="selected-address-preview">
                  <div className="preview-line">{selectedAddress.line1}</div>
                  {selectedAddress.line2 && (
                    <div className="preview-line">{selectedAddress.line2}</div>
                  )}
                  <div className="preview-line">
                    {selectedAddress.area_name}, {selectedAddress.city_name}
                  </div>
                  <div className="preview-line">
                    {selectedAddress.state_name} {selectedAddress.pincode}
                  </div>
                </div>
              ) : useManual ? (
                <div className="selected-address-preview">
                  <div className="preview-line">{manualAddress.street || 'Not specified'}</div>
                  <div className="preview-line">{manualAddress.city || 'Not specified'}</div>
                  <div className="preview-line">{manualAddress.state || 'Not specified'}</div>
                  <div className="preview-line">{manualAddress.zipCode || 'Not specified'}</div>
                  <div className="preview-note">Manual entry</div>
                </div>
              ) : (
                <div className="no-selection">
                  <i className="fas fa-map-marker-alt"></i>
                  <p>No address selected</p>
                </div>
              )}
            </div>

            <div className="next-step-preview">
              <h4>What's Next?</h4>
              <div className="step-indicator">
                <div className="step completed">
                  <div className="step-number">1</div>
                  <div className="step-info">
                    <div className="step-title">Address</div>
                    <div className="step-status">Verified</div>
                  </div>
                </div>
                <div className="step-connector"></div>
                <div className="step current">
                  <div className="step-number">2</div>
                  <div className="step-info">
                    <div className="step-title">Payment</div>
                    <div className="step-status">Next Step</div>
                  </div>
                </div>
                <div className="step-connector"></div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-info">
                    <div className="step-title">Review</div>
                    <div className="step-status">Final Step</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="verification-actions">
          <button 
            className="btn-back" 
            onClick={() => navigate('/checkout', { state: { from: 'address-verification-cancel' } })}
            disabled={isSubmitting}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Checkout
          </button>
          
          {useManual ? (
            <button 
              className="btn-confirm" 
              onClick={handleUseManual}
              disabled={isSubmitting || !manualAddress.street || !manualAddress.state_id || !manualAddress.city_id || !manualAddress.area_id}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Proceed to Payment
                  <i className="fas fa-credit-card"></i>
                </>
              )}
            </button>
          ) : (
            <button 
              className="btn-confirm" 
              onClick={handleUseSelected}
              disabled={isSubmitting || !selectedAddress || addresses.length === 0}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Proceed to Payment
                  <i className="fas fa-credit-card"></i>
                </>
              )}
            </button>
          )}
        </div>

        <div className="verification-footer">
          <div className="security-note">
            <i className="fas fa-shield-alt"></i>
            <div>
              <p><strong>Your information is secure</strong></p>
              <p>Your address information is encrypted and will only be used for delivery purposes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get address type icon
const getAddressTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'home':
      return 'home';
    case 'work':
      return 'building';
    case 'other':
      return 'map-marker-alt';
    default:
      return 'map-marker-alt';
  }
};

export default AddressVerification;