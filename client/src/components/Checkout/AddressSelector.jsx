import React, { useState } from 'react';
import { useAddressContext } from '../../context/AddressContext';
import { toastSuccess, toastError } from '../../utils/customToast';
import './AddressSelector.css';

const AddressSelector = ({ addresses, selectedAddress, onSelectAddress, onAddNewAddress }) => {
  const { deleteAddress, setDefaultAddress, loading } = useAddressContext();
  const [processingAddress, setProcessingAddress] = useState(null);

  const handleDeleteAddress = async (addressId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    setProcessingAddress(addressId);
    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        toastSuccess('Address deleted successfully');
        // If the deleted address was selected, clear selection
        if (selectedAddress?.address_id === addressId) {
          onSelectAddress(null);
        }
      } else {
        toastError(result.message || 'Failed to delete address');
      }
    } catch (error) {
      toastError('Failed to delete address');
    } finally {
      setProcessingAddress(null);
    }
  };

  const handleSetDefault = async (addressId, e) => {
    e.stopPropagation();
    
    setProcessingAddress(addressId);
    try {
      const result = await setDefaultAddress(addressId);
      if (result.success) {
        toastSuccess('Default address updated successfully');
      } else {
        toastError(result.message || 'Failed to set default address');
      }
    } catch (error) {
      toastError('Failed to set default address');
    } finally {
      setProcessingAddress(null);
    }
  };

  const handleAddressSelect = (address) => {
    onSelectAddress(address);
  };

  // Show loading state when addresses are being fetched
  if (loading) {
    return (
      <div className="address-selector">
        <div className="address-list">
          {[1, 2].map((item) => (
            <div key={item} className="address-card loading">
              <div className="address-header">
                <div className="address-type-badge loading-skeleton"></div>
                <div className="default-badge loading-skeleton"></div>
              </div>
              <div className="address-details">
                <p className="address-street loading-skeleton"></p>
                <p className="address-street loading-skeleton short"></p>
                <p className="address-city loading-skeleton"></p>
              </div>
              <div className="address-actions">
                <button className="btn-set-default loading-skeleton" disabled>
                  <i className="fas fa-star"></i>
                </button>
                <button className="btn-delete-address loading-skeleton" disabled>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="address-selector">
      <div className="address-list">
        {addresses.length === 0 ? (
          <div className="no-addresses">
            <i className="fas fa-map-marker-alt"></i>
            <h3>No addresses found</h3>
            <p>Add your first address to continue with checkout</p>
          </div>
        ) : (
          addresses.map(address => (
            <div 
              key={address.address_id} 
              className={`address-card ${selectedAddress?.address_id === address.address_id ? 'selected' : ''} ${
                processingAddress === address.address_id ? 'processing' : ''
              }`}
              onClick={() => handleAddressSelect(address)}
            >
              <div className="address-header">
                <div className="address-type-badge">
                  <i className={`fas fa-${getAddressTypeIcon(address.address_type)}`}></i>
                  {address.address_type}
                </div>
                <div className="header-right">
                  {address.is_default && (
                    <span className="default-badge">
                      <i className="fas fa-check"></i>
                      Default
                    </span>
                  )}
                  {selectedAddress?.address_id === address.address_id && (
                    <span className="selected-badge">
                      <i className="fas fa-check-circle"></i>
                      Selected
                    </span>
                  )}
                </div>
              </div>
              
              <div className="address-details">
                <p className="address-street">{address.line1}</p>
                {address.line2 && <p className="address-street secondary">{address.line2}</p>}
                <p className="address-city">
                  {address.area_name}, {address.city_name}, {address.state_name} - {address.pincode}
                </p>
              </div>
              
              <div className="address-actions">
                {!address.is_default && (
                  <button 
                    className="btn-set-default"
                    onClick={(e) => handleSetDefault(address.address_id, e)}
                    disabled={processingAddress === address.address_id || loading}
                    title="Set as default address"
                  >
                    {processingAddress === address.address_id && loading ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-star"></i>
                    )}
                  </button>
                )}
                <button 
                  className="btn-delete-address"
                  onClick={(e) => handleDeleteAddress(address.address_id, e)}
                  disabled={processingAddress === address.address_id || address.is_default || loading}
                  title={address.is_default ? "Cannot delete default address" : "Delete address"}
                >
                  {processingAddress === address.address_id && loading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-trash"></i>
                  )}
                </button>
              </div>

              {/* Processing overlay */}
              {processingAddress === address.address_id && (
                <div className="processing-overlay">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <button 
        className="btn-add-address" 
        onClick={onAddNewAddress}
        disabled={loading}
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            Adding...
          </>
        ) : (
          <>
            <i className="fas fa-plus"></i>
            Add New Address
          </>
        )}
      </button>
    </div>
  );
};

// Helper function to get appropriate icon for address type
const getAddressTypeIcon = (type) => {
  switch (type.toLowerCase()) {
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

export default AddressSelector;