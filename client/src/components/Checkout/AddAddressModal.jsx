import React, { useState, useEffect } from 'react';
import { useAddressContext } from '../../context/AddressContext';
import { toastSuccess, toastError } from '../../utils/customToast';
import './AddAddressModal.css';

const AddAddressModal = ({ isOpen, onClose, onAddressAdded }) => {
  const {
    states,
    cities,
    areas,
    fetchStates,
    fetchCitiesByState,
    fetchAreasByCity,
    createAddress,
    loading
  } = useAddressContext();

  const initialFormState = {
    address_type: 'Home',
    line1: '',
    line2: '',
    state_id: '',
    city_id: '',
    area_id: '',
    pincode: '',
    is_default: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [dropdownLoading, setDropdownLoading] = useState({
    cities: false,
    areas: false
  });

  /* -------------------- MODAL OPEN INIT -------------------- */
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);

      if (states.length === 0) {
        fetchStates();
      }
    }
  }, [isOpen]); // ✅ ONLY depends on isOpen

  if (!isOpen) return null;

  /* -------------------- HANDLERS -------------------- */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStateChange = async (stateId) => {
    setFormData(prev => ({
      ...prev,
      state_id: stateId,
      city_id: '',
      area_id: '',
      pincode: ''
    }));

    if (!stateId) return;

    setDropdownLoading(prev => ({ ...prev, cities: true }));
    try {
      await fetchCitiesByState(stateId);
    } catch {
      toastError('Failed to load cities');
    } finally {
      setDropdownLoading(prev => ({ ...prev, cities: false }));
    }
  };

  const handleCityChange = async (cityId) => {
    setFormData(prev => ({
      ...prev,
      city_id: cityId,
      area_id: '',
      pincode: ''
    }));

    if (!cityId) return;

    setDropdownLoading(prev => ({ ...prev, areas: true }));
    try {
      await fetchAreasByCity(cityId);
    } catch {
      toastError('Failed to load areas');
    } finally {
      setDropdownLoading(prev => ({ ...prev, areas: false }));
    }
  };

  const handleAreaChange = (areaId) => {
    const selectedArea = areas.find(a => a.area_id === parseInt(areaId));

    setFormData(prev => ({
      ...prev,
      area_id: areaId,
      pincode: selectedArea?.pincode || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.line1.trim()) return toastError('Enter address line 1');
    if (!formData.state_id) return toastError('Select state');
    if (!formData.city_id) return toastError('Select city');
    if (!formData.area_id) return toastError('Select area');

    try {
      const payload = {
        address_type: formData.address_type,
        line1: formData.line1.trim(),
        line2: formData.line2.trim(),
        area_id: Number(formData.area_id),
        is_default: formData.is_default
      };

      const result = await createAddress(payload);

      if (result?.success) {
        toastSuccess('Address added successfully');
        onAddressAdded(result.data);
        onClose();
      } else {
        toastError(result?.message || 'Failed to add address');
      }
    } catch {
      toastError('Failed to add address');
    }
  };

  const isFormValid =
    formData.line1.trim() &&
    formData.state_id &&
    formData.city_id &&
    formData.area_id;

  /* -------------------- UI -------------------- */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-address-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Address</h2>
          <button className="btn-close" onClick={onClose} disabled={loading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Address Type *</label>
              <select
                value={formData.address_type}
                onChange={(e) => handleInputChange('address_type', e.target.value)}
                disabled={loading}
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Address Line 1 *</label>
              <input
                type="text"
                value={formData.line1}
                onChange={(e) => handleInputChange('line1', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Address Line 2</label>
              <input
                type="text"
                value={formData.line2}
                onChange={(e) => handleInputChange('line2', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>State *</label>
                <select
                  value={formData.state_id}
                  onChange={(e) => handleStateChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select State</option>
                  {states.map(s => (
                    <option key={s.state_id} value={s.state_id}>
                      {s.state_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>City *</label>
                <select
                  value={formData.city_id}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!formData.state_id || dropdownLoading.cities}
                >
                  <option value="">Select City</option>
                  {cities.map(c => (
                    <option key={c.city_id} value={c.city_id}>
                      {c.city_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Area *</label>
                <select
                  value={formData.area_id}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  disabled={!formData.city_id || dropdownLoading.areas}
                >
                  <option value="">Select Area</option>
                  {areas.map(a => (
                    <option key={a.area_id} value={a.area_id}>
                      {a.area_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) =>
                    handleInputChange('is_default', e.target.checked)
                  }
                />
                <span className="checkbox-custom"></span>
                Set as default address
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={!isFormValid || loading}
              >
                {loading ? 'Adding...' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAddressModal;
