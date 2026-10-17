import React, { useState, useEffect } from 'react';
import { useCustomerContext } from '../../../../context/CustomerContext';
import { User, Mail, Phone, Check, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../Layout/AdminLayout';
import './CustomerForm.css';

const CustomerForm = ({ mode = 'create' }) => {
    const { customerId } = useParams();
    const {
        currentCustomer,
        loading,
        error,
        successMessage,
        fetchCustomerById,
        updateCustomer,
        clearError,
        clearSuccessMessage
    } = useCustomerContext();

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        is_active: true
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (mode === 'edit' && customerId) {
            fetchCustomerById(customerId);
        }
    }, [mode, customerId, fetchCustomerById]);

    useEffect(() => {
        if (mode === 'edit' && currentCustomer) {
            // Map backend response to form data
            setFormData({
                first_name: currentCustomer.first_name || '',
                last_name: currentCustomer.last_name || '',
                email: currentCustomer.email || '',
                phone: currentCustomer.phone || '',
                is_active: currentCustomer.is_active !== undefined ? currentCustomer.is_active : true
            });
        }
    }, [currentCustomer, mode]);

    const validateForm = () => {
        const errors = {};

        if (!formData.first_name.trim()) errors.first_name = 'First name is required';
        if (!formData.last_name.trim()) errors.last_name = 'Last name is required';

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (mode === 'edit' && customerId) {
            const result = await updateCustomer(customerId, formData);
            if (result.success) {
                setTimeout(() => {
                    navigate('/admin/users/customers');
                }, 1500);
            }
        } else if (mode === 'create') {
            // Create functionality - needs separate createCustomer API
            alert('Create functionality to be implemented with backend API');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <AdminLayout>
            <div className="admin-cf-container">
                <div className="admin-cf-header">
                    <div>
                        <h1 className="admin-cf-title">{mode === 'edit' ? 'Edit Customer' : 'Create New Customer'}</h1>
                        <p className="admin-cf-subtitle">{mode === 'edit' ? 'Update customer information' : 'Add a new customer to the system'}</p>
                    </div>
                    <button
                        type="button"
                        className="admin-cf-btn cancel"
                        onClick={() => navigate('/admin/users/customers')}
                    >
                        Cancel
                    </button>
                </div>

                {error && (
                    <div className="admin-cf-alert error">
                        <div className="admin-cf-alert-content">
                            <X size={18} />
                            <span>{error}</span>
                        </div>
                        <button onClick={clearError} className="admin-cf-alert-close">×</button>
                    </div>
                )}

                {successMessage && (
                    <div className="admin-cf-alert success">
                        <div className="admin-cf-alert-content">
                            <Check size={18} />
                            <span>{successMessage}</span>
                        </div>
                        <button onClick={clearSuccessMessage} className="admin-cf-alert-close">×</button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="admin-cf-card">
                        <h3 className="admin-cf-section-title">
                            <User size={18} /> Personal Information
                        </h3>
                        <div className="admin-cf-grid">
                            <div className="admin-cf-group">
                                <label htmlFor="first_name" className="admin-cf-label">First Name *</label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    className={`admin-cf-input ${formErrors.first_name ? 'error' : ''}`}
                                />
                                {formErrors.first_name && (
                                    <span className="admin-cf-error-text">{formErrors.first_name}</span>
                                )}
                            </div>

                            <div className="admin-cf-group">
                                <label htmlFor="last_name" className="admin-cf-label">Last Name *</label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                    className={`admin-cf-input ${formErrors.last_name ? 'error' : ''}`}
                                />
                                {formErrors.last_name && (
                                    <span className="admin-cf-error-text">{formErrors.last_name}</span>
                                )}
                            </div>

                            <div className="admin-cf-group">
                                <label htmlFor="email" className="admin-cf-label">Email Address *</label>
                                <div className="admin-cf-input-wrapper">
                                    <Mail size={18} className="admin-cf-icon" />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="customer@example.com"
                                        className={`admin-cf-input with-icon ${formErrors.email ? 'error' : ''}`}
                                    />
                                </div>
                                {formErrors.email && (
                                    <span className="admin-cf-error-text">{formErrors.email}</span>
                                )}
                            </div>

                            <div className="admin-cf-group">
                                <label htmlFor="phone" className="admin-cf-label">Phone Number</label>
                                <div className="admin-cf-input-wrapper">
                                    <Phone size={18} className="admin-cf-icon" />
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="(123) 456-7890"
                                        className="admin-cf-input with-icon"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-cf-card">
                        <h3 className="admin-cf-section-title">Account Status</h3>
                        <div>
                            <div className="admin-cf-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="admin-cf-checkbox"
                                />
                                <div>
                                    <label htmlFor="is_active" className="admin-cf-checkbox-label">
                                        Active Account
                                    </label>
                                    <span className="admin-cf-checkbox-desc">
                                        Uncheck to deactivate this customer account. Deactivated accounts cannot log in.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-cf-actions">
                        <button
                            type="button"
                            className="admin-cf-btn cancel"
                            onClick={() => navigate('/admin/users/customers')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="admin-cf-btn submit"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : mode === 'edit' ? 'Update Customer' : 'Create Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

export default CustomerForm;