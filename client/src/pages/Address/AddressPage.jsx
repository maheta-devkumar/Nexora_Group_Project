import React, { useState, useEffect } from 'react';
import { useAddressContext } from '../../context/AddressContext';
import { toast } from 'react-toastify';
import './AddressPage.css';

const AddressPage = () => {
    const {
        addresses,
        fetchUserAddresses,
        deleteAddress,
        updateAddress,
        setDefaultAddress,
        createAddress,
        states,
        fetchStates,
        fetchCitiesByState,
        fetchAreasByCity,
        loading
    } = useAddressContext();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        address_type: 'Home',
        line1: '',
        line2: '',
        landmark: '',
        pincode: '',
        state_id: '',
        city_id: '',
        area_id: '',
        is_default: false
    });

    // Dependent Dropdown Data State
    const [cities, setCities] = useState([]);
    const [areas, setAreas] = useState([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingAreas, setIsLoadingAreas] = useState(false);

    // Initial Data Load
    useEffect(() => {
        fetchUserAddresses();
        fetchStates();
    }, []);

    // Load Cities when State changes
    useEffect(() => {
        if (formData.state_id) {
            const loadCities = async () => {
                setIsLoadingCities(true);
                const result = await fetchCitiesByState(formData.state_id);
                if (result.success) {
                    setCities(result.data);
                }
                setIsLoadingCities(false);
            };
            loadCities();
            // Reset dependent fields
            setFormData(prev => ({ ...prev, city_id: '', area_id: '' }));
            setCities([]);
            setAreas([]);
        }
    }, [formData.state_id]);

    // Load Areas when City changes
    useEffect(() => {
        if (formData.city_id) {
            const loadAreas = async () => {
                setIsLoadingAreas(true);
                const result = await fetchAreasByCity(formData.city_id);
                if (result.success) {
                    setAreas(result.data);
                }
                setIsLoadingAreas(false);
            };
            loadAreas();
            // Reset dependent field
            setFormData(prev => ({ ...prev, area_id: '' }));
            setAreas([]);
        }
    }, [formData.city_id]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Validation
        if (!formData.line1 || !formData.pincode || !formData.state_id || !formData.city_id || !formData.area_id) {
            toast.error("Please fill all required fields");
            setSubmitting(false);
            return;
        }

        // map to backend schema
        const payload = {
            address_type: formData.address_type,
            line1: formData.line1,
            line2: formData.line2,
            landmark: formData.landmark,
            pincode: formData.pincode,
            state_id: parseInt(formData.state_id),
            city_id: parseInt(formData.city_id),
            area_id: parseInt(formData.area_id),
            is_default: formData.is_default
        };

        let result;
        if (editingId) {
            result = await updateAddress(editingId, payload);
        } else {
            result = await createAddress(payload);
        }

        if (result.success) {
            toast.success(editingId ? "Address updated successfully!" : "Address added successfully!");
            setIsFormOpen(false);
            setEditingId(null);
            // Reset form
            setFormData({
                address_type: 'Home',
                line1: '',
                line2: '',
                landmark: '',
                pincode: '',
                state_id: '',
                city_id: '',
                area_id: '',
                is_default: false
            });
        }
        setSubmitting(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this address?")) {
            const result = await deleteAddress(id);
            if (result.success) {
                toast.success("Address deleted");
            }
        }
    };

    const handleSetDefault = async (id) => {
        const result = await setDefaultAddress(id);
        if (result.success) {
            toast.success("Default address updated");
        }
    };

    const handleEdit = (addr) => {
        setEditingId(addr.address_id);
        setFormData({
            address_type: addr.address_type || 'Home',
            line1: addr.line1 || '',
            line2: addr.line2 || '',
            landmark: addr.landmark || '',
            pincode: addr.pincode || '',
            state_id: addr.state_id || '',
            city_id: addr.city_id || '',
            area_id: addr.area_id || '',
            is_default: addr.is_default || false
        });
        setIsFormOpen(true);
    };

    // Helper to get names (since API might return IDs in address list, we may need to look them up if not joined)
    // NOTE: Assuming the backend returns joined strings like 'city_name' or we rely on the ID.
    // Ideally the address list endpoint returns readable names. If not, we'd need maps.
    // For now, rendering what is available in the address object.

    return (
        <div className="address-page">
            <div className="address-container">
                <div className="address-header">
                    <h1>My Addresses</h1>
                    <button
                        className="add-btn"
                        onClick={() => {
                            if (isFormOpen) {
                                setIsFormOpen(false);
                                setEditingId(null);
                                setFormData({
                                    address_type: 'Home',
                                    line1: '',
                                    line2: '',
                                    landmark: '',
                                    pincode: '',
                                    state_id: '',
                                    city_id: '',
                                    area_id: '',
                                    is_default: false
                                });
                            } else {
                                setIsFormOpen(true);
                                setEditingId(null);
                                setFormData({
                                    address_type: 'Home',
                                    line1: '',
                                    line2: '',
                                    landmark: '',
                                    pincode: '',
                                    state_id: '',
                                    city_id: '',
                                    area_id: '',
                                    is_default: false
                                });
                            }
                        }}
                    >
                        <i className={`fas ${isFormOpen ? 'fa-minus' : 'fa-plus'}`}></i>
                        {isFormOpen ? 'Close Form' : 'Add New Address'}
                    </button>
                </div>

                {isFormOpen && (
                    <div className="address-form-section">
                        <div className="form-header">
                            <h2>{editingId ? 'Edit Address' : 'Add New Address'}</h2>
                            <button className="close-btn" onClick={() => setIsFormOpen(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Address Type</label>
                                    <div className="radio-group" style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                                        {['Home', 'Work', 'Other'].map(type => (
                                            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                                                <input
                                                    type="radio"
                                                    name="address_type"
                                                    value={type}
                                                    checked={formData.address_type === type}
                                                    onChange={handleInputChange}
                                                />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Address Line 1 *</label>
                                    <input
                                        type="text"
                                        name="line1"
                                        className="form-input"
                                        value={formData.line1}
                                        onChange={handleInputChange}
                                        placeholder="House No., Building Name"
                                        required
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Address Line 2</label>
                                    <input
                                        type="text"
                                        name="line2"
                                        className="form-input"
                                        value={formData.line2}
                                        onChange={handleInputChange}
                                        placeholder="Street, Colony"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Landmark</label>
                                    <input
                                        type="text"
                                        name="landmark"
                                        className="form-input"
                                        value={formData.landmark}
                                        onChange={handleInputChange}
                                        placeholder="Near..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Pincode *</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        className="form-input"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        placeholder="123456"
                                        required
                                        maxLength="6"
                                    />
                                </div>

                                {/* State Dropdown */}
                                <div className="form-group">
                                    <label>State *</label>
                                    <select
                                        name="state_id"
                                        className="form-select"
                                        value={formData.state_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select State</option>
                                        {states.map(state => (
                                            <option key={state.state_id} value={state.state_id}>
                                                {state.state_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* City Dropdown */}
                                <div className="form-group">
                                    <label>City * {isLoadingCities && '(Loading...)'}</label>
                                    <select
                                        name="city_id"
                                        className="form-select"
                                        value={formData.city_id}
                                        onChange={handleInputChange}
                                        required
                                        disabled={!formData.state_id}
                                    >
                                        <option value="">Select City</option>
                                        {cities.map(city => (
                                            <option key={city.city_id} value={city.city_id}>
                                                {city.city_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Area Dropdown */}
                                <div className="form-group">
                                    <label>Area {isLoadingAreas && '(Loading...)'}</label>
                                    <select
                                        name="area_id"
                                        className="form-select"
                                        value={formData.area_id}
                                        onChange={handleInputChange}
                                        disabled={!formData.city_id}
                                    >
                                        <option value="">Select Area</option>
                                        {areas.map(area => (
                                            <option key={area.area_id} value={area.area_id}>
                                                {area.area_name} {area.pincode ? `(${area.pincode})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '30px' }}>
                                        <input
                                            type="checkbox"
                                            name="is_default"
                                            checked={formData.is_default}
                                            onChange={handleInputChange}
                                        />
                                        Set as default address
                                    </label>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsFormOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Address'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {loading && !addresses.length ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-map-marker-alt empty-icon"></i>
                        <h2>No Addresses Found</h2>
                        <p>You haven't added any shipping addresses yet.</p>
                        <button className="add-btn" onClick={() => setIsFormOpen(true)} style={{ margin: '0 auto' }}>
                            Add Your First Address
                        </button>
                    </div>
                ) : (
                    <div className="addresses-grid">
                        {addresses.map(addr => (
                            <div key={addr.address_id} className={`address-card ${addr.is_default ? 'default' : ''}`}>
                                {addr.is_default && <span className="default-badge">Default</span>}
                                <span className="address-type">
                                    <i className="fas fa-home"></i> {addr.address_type || 'Home'}
                                </span>
                                <div className="address-details">
                                    <p className="address-line">{addr.line1}</p>
                                    {addr.line2 && <p className="address-line">{addr.line2}</p>}
                                    {/* Landmark might not be returned if not in DB schema, hiding it */}

                                    <p className="address-location">
                                        {addr.city_name || 'City'}, {addr.state_name || 'State'} - {addr.pincode}
                                    </p>
                                </div>
                                <div className="address-actions">
                                    {!addr.is_default && (
                                        <button
                                            className="action-btn set-default-btn"
                                            onClick={() => handleSetDefault(addr.address_id)}
                                        >
                                            <i className="fas fa-check-circle"></i> Make Default
                                        </button>
                                    )}
                                    {/* Edit could be implemented by populating form and passing ID */}
                                    <button
                                        className="action-btn edit-btn"
                                        onClick={() => handleEdit(addr)}
                                    >
                                        <i className="fas fa-edit"></i> Edit
                                    </button>
                                    <button
                                        className="action-btn delete-address-btn"
                                        onClick={() => handleDelete(addr.address_id)}
                                    >
                                        <i className="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddressPage;
