import React, { useState, useEffect } from 'react';
import { useDeliveryPersonContext } from '../../../../context/DeliveryPersonContext';
import {
    User, Mail, Phone, MapPin, Calendar,
    Car, Bike, Shield, Check, X, Package, DollarSign,
    Upload, FileText, CreditCard, UserCheck
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import './DeliveryPersonForm.css';
import AdminLayout from '../../../../components/Admin/Layout/AdminLayout';

const DeliveryPersonForm = ({ mode = 'create' }) => {
    const { deliveryPersonId } = useParams();
    const {
        currentDeliveryPerson,
        loading,
        error,
        successMessage,
        fetchDeliveryPersonById,
        registerDeliveryPerson,
        updateDeliveryPersonStatus,
        clearError,
        clearSuccessMessage
    } = useDeliveryPersonContext();

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        user_id: '',
        license_number: '',
        vehicle_type: 'BIKE',
        vehicle_number: '',
        status: 'PENDING'
    });

    const [documents, setDocuments] = useState([]);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (mode === 'edit' && deliveryPersonId) {
            fetchDeliveryPersonById(deliveryPersonId);
        }
    }, [mode, deliveryPersonId, fetchDeliveryPersonById]);

    useEffect(() => {
        if (mode === 'edit' && currentDeliveryPerson) {
            setFormData({
                user_id: currentDeliveryPerson.user_id || '',
                license_number: currentDeliveryPerson.license_number || '',
                vehicle_type: currentDeliveryPerson.vehicle_type || 'BIKE',
                vehicle_number: currentDeliveryPerson.vehicle_number || '',
                status: currentDeliveryPerson.status || 'PENDING'
            });
        }
    }, [currentDeliveryPerson, mode]);

    const validateForm = () => {
        const errors = {};

        if (!formData.user_id) errors.user_id = 'User ID is required';
        if (!formData.license_number) errors.license_number = 'License number is required';
        if (!formData.vehicle_number) errors.vehicle_number = 'Vehicle number is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (mode === 'create') {
            const result = await registerDeliveryPerson(formData);
            if (result.success) {
                setTimeout(() => {
                    navigate('/admin/users/delivery-persons');
                }, 1500);
            }
        } else if (mode === 'edit' && deliveryPersonId) {
            if (formData.status !== currentDeliveryPerson?.status) {
                const result = await updateDeliveryPersonStatus(deliveryPersonId, formData.status);
                if (result.success) {
                    setTimeout(() => {
                        navigate('/admin/users/delivery-persons');
                    }, 1500);
                }
            } else {
                // No status change, just navigate back
                navigate('/admin/users/delivery-persons');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleDocumentUpload = (e) => {
        const files = Array.from(e.target.files);
        const newDocuments = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type,
            size: file.size,
            file: file,
            uploaded_at: new Date().toISOString()
        }));
        setDocuments(prev => [...prev, ...newDocuments]);
    };

    const removeDocument = (id) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
    };

    const vehicleTypes = [
        { value: 'BIKE', label: 'Bike', icon: <Bike size={16} /> },
        { value: 'MOTORCYCLE', label: 'Motorcycle', icon: <Bike size={16} /> },
        { value: 'CAR', label: 'Car', icon: <Car size={16} /> },
        { value: 'SCOOTER', label: 'Scooter', icon: <Bike size={16} /> },
        { value: 'WALKING', label: 'Walking', icon: <User size={16} /> }
    ];

    const statusOptions = [
        { value: 'PENDING', label: 'Pending', color: '#f59e0b' },
        { value: 'ACTIVE', label: 'Active', color: '#10b981' },
        { value: 'INACTIVE', label: 'Inactive', color: '#ef4444' },
        { value: 'SUSPENDED', label: 'Suspended', color: '#f97316' }
    ];

    // Helper function to safely parse rating
    const getRatingValue = (rating) => {
        if (!rating && rating !== 0) return 'N/A';
        const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
        return isNaN(numRating) ? 'N/A' : numRating.toFixed(1);
    };

    // Helper function to safely format earnings
    const getEarningsValue = (earnings) => {
        if (!earnings && earnings !== 0) return '0.00';
        const numEarnings = typeof earnings === 'string' ? parseFloat(earnings) : earnings;
        return isNaN(numEarnings) ? '0.00' : numEarnings.toFixed(2);
    };

    return (
        <AdminLayout>
            <div className="admin-dp-form-wrapper">
                <div className="admin-dp-form-header">
                    <div>
                        <h1 className="admin-dp-form-title">{mode === 'edit' ? 'Edit Delivery Person' : 'Register Delivery Person'}</h1>
                        <p className="admin-dp-form-subtitle">{mode === 'edit' ? 'Update delivery person information' : 'Register a new delivery person'}</p>
                    </div>
                </div>

                {error && (
                    <div className="admin-dp-form-alert error">
                        <X size={18} />
                        <span>{error}</span>
                        <button onClick={clearError} className="admin-dp-form-alert-close">×</button>
                    </div>
                )}

                {successMessage && (
                    <div className="admin-dp-form-alert success">
                        <Check size={18} />
                        <span>{successMessage}</span>
                        <button onClick={clearSuccessMessage} className="admin-dp-form-alert-close">×</button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="admin-dp-form-card">
                        <div className="admin-dp-form-section">
                            <h3 className="admin-dp-form-section-title">
                                <User size={18} /> Basic Information
                            </h3>
                            <div className="admin-dp-form-grid">
                                <div className="admin-dp-form-group">
                                    <label className="admin-dp-form-label">User ID *</label>
                                    <div className="admin-dp-form-input-wrapper">
                                        <User size={18} className="admin-dp-form-input-icon" />
                                        <input
                                            type="number"
                                            name="user_id"
                                            value={formData.user_id}
                                            onChange={handleChange}
                                            placeholder="Enter user ID"
                                            className={`admin-dp-form-input ${formErrors.user_id ? 'error' : ''}`}
                                            disabled={mode === 'edit'}
                                        />
                                    </div>
                                    {formErrors.user_id && (
                                        <span className="admin-dp-form-error-msg">{formErrors.user_id}</span>
                                    )}
                                </div>

                                <div className="admin-dp-form-group">
                                    <label className="admin-dp-form-label">License Number *</label>
                                    <div className="admin-dp-form-input-wrapper">
                                        <UserCheck size={18} className="admin-dp-form-input-icon" />
                                        <input
                                            type="text"
                                            name="license_number"
                                            value={formData.license_number}
                                            onChange={handleChange}
                                            placeholder="DL-123456789"
                                            className={`admin-dp-form-input ${formErrors.license_number ? 'error' : ''}`}
                                        />
                                    </div>
                                    {formErrors.license_number && (
                                        <span className="admin-dp-form-error-msg">{formErrors.license_number}</span>
                                    )}
                                </div>

                                <div className="admin-dp-form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="admin-dp-form-label">Vehicle Type</label>
                                    <div className="admin-dp-form-vehicle-options">
                                        {vehicleTypes.map(vehicle => (
                                            <label key={vehicle.value} className="admin-dp-form-vehicle-opt">
                                                <input
                                                    type="radio"
                                                    name="vehicle_type"
                                                    value={vehicle.value}
                                                    checked={formData.vehicle_type === vehicle.value}
                                                    onChange={handleChange}
                                                    className="hidden"
                                                />
                                                <div className="admin-dp-form-vehicle-box">
                                                    {vehicle.icon}
                                                    <span className="admin-dp-form-vehicle-lbl">{vehicle.label}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="admin-dp-form-group">
                                    <label className="admin-dp-form-label">Vehicle Number *</label>
                                    <div className="admin-dp-form-input-wrapper">
                                        <Car size={18} className="admin-dp-form-input-icon" />
                                        <input
                                            type="text"
                                            name="vehicle_number"
                                            value={formData.vehicle_number}
                                            onChange={handleChange}
                                            placeholder="KA-01-AB-1234"
                                            className={`admin-dp-form-input ${formErrors.vehicle_number ? 'error' : ''}`}
                                        />
                                    </div>
                                    {formErrors.vehicle_number && (
                                        <span className="admin-dp-form-error-msg">{formErrors.vehicle_number}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {mode === 'create' && (
                        <div className="admin-dp-form-card">
                            <h3 className="admin-dp-form-section-title">
                                <Shield size={18} /> Documents & Verification
                            </h3>
                            <div className="admin-dp-form-upload-area">
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Upload size={32} className="admin-dp-form-upload-icon" />
                                    <p className="admin-dp-form-upload-title">Upload required documents</p>
                                    <span className="admin-dp-form-upload-hint">License, ID proof, vehicle registration, etc.</span>

                                    <input
                                        type="file"
                                        id="documents"
                                        multiple
                                        onChange={handleDocumentUpload}
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        className="hidden"
                                    />
                                    <label htmlFor="documents" className="admin-dp-form-upload-btn-fake">
                                        Choose Files
                                    </label>
                                </div>

                                {documents.length > 0 && (
                                    <div className="admin-dp-form-docs-list">
                                        <h4 style={{ textAlign: 'left', fontSize: '14px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Uploaded Documents</h4>
                                        {documents.map(doc => (
                                            <div key={doc.id} className="admin-dp-form-doc-item">
                                                <div className="admin-dp-form-doc-info">
                                                    <FileText size={16} className="admin-dp-form-doc-icon" />
                                                    <div>
                                                        <span className="admin-dp-form-doc-name">{doc.name}</span>
                                                        <span className="admin-dp-form-doc-size" style={{ display: 'block' }}>
                                                            {(doc.size / 1024).toFixed(2)} KB
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="admin-dp-form-doc-remove"
                                                    onClick={() => removeDocument(doc.id)}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="admin-dp-form-card">
                        <h3 className="admin-dp-form-section-title">
                            <Calendar size={18} /> Account Status
                        </h3>
                        <div className="admin-dp-form-status-group">
                            {statusOptions.map(status => (
                                <label key={status.value} className="admin-dp-form-status-opt">
                                    <input
                                        type="radio"
                                        name="status"
                                        value={status.value}
                                        checked={formData.status === status.value}
                                        onChange={handleChange}
                                        className="hidden"
                                        style={{ color: status.color }} /* trick to pass color to sibling via css? no, using inline style for dot */
                                    />
                                    <div className="admin-dp-form-status-box" style={{ borderColor: formData.status === status.value ? status.color : '' }}>
                                        <span
                                            className="admin-dp-form-status-dot"
                                            style={{ backgroundColor: status.color }}
                                        ></span>
                                        <span className="admin-dp-form-status-lbl">{status.label}</span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {mode === 'edit' && currentDeliveryPerson && (
                            <div className="admin-dp-form-stats-grid">
                                <div className="admin-dp-form-vehicle-box" style={{ background: '#eff6ff', borderColor: '#dbeafe' }}>
                                    <div style={{ padding: '8px', background: '#bfdbfe', borderRadius: '50%', color: '#1d4ed8' }}>
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                                            {currentDeliveryPerson.total_deliveries || 0}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Deliveries</span>
                                    </div>
                                </div>
                                <div className="admin-dp-form-vehicle-box" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
                                    <div style={{ padding: '8px', background: '#bbf7d0', borderRadius: '50%', color: '#15803d' }}>
                                        <DollarSign size={16} />
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                                            ${getEarningsValue(currentDeliveryPerson.total_earnings)}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Earnings</span>
                                    </div>
                                </div>
                                <div className="admin-dp-form-vehicle-box" style={{ background: '#fefce8', borderColor: '#fef9c3' }}>
                                    <div style={{ padding: '8px', background: '#fde047', borderRadius: '50%', color: '#854d0e' }}>
                                        <Shield size={16} />
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                                            {getRatingValue(currentDeliveryPerson.rating)}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Rating</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="admin-dp-form-actions">
                        <button
                            type="button"
                            className="admin-dp-form-btn-cancel"
                            onClick={() => navigate('/admin/users/delivery-persons')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="admin-dp-form-btn-submit"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : mode === 'edit' ? 'Update Delivery Person' : 'Register Delivery Person'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

export default DeliveryPersonForm;