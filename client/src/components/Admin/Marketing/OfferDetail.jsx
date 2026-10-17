import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaEdit, FaTrash, FaCalendar, FaPercentage, FaTag, FaSave, FaTimes } from 'react-icons/fa';
import { useMarketingContext } from '../../../context/MarketingContext';
import './OfferDetail.css';

const OfferDetail = ({ offer, onBack, mode = 'detail' }) => {
    const {
        updateOffer,
        deleteOffer,
        loading,
        error,
        clearError
    } = useMarketingContext();

    const [isEditing, setIsEditing] = useState(mode === 'edit');
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discount_type: 'PERCENT',
        discount_value: 10,
        start_date: '',
        end_date: '',
        is_active: true,
        variant_ids: []
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (offer) {
            setFormData({
                title: offer.title || '',
                description: offer.description || '',
                discount_type: offer.discount_type || 'PERCENT',
                discount_value: parseFloat(offer.discount_value) || 10,
                start_date: offer.start_date ? formatDateForInput(offer.start_date) : '',
                end_date: offer.end_date ? formatDateForInput(offer.end_date) : '',
                is_active: offer.is_active !== undefined ? offer.is_active : true,
                variant_ids: offer.variants || []
            });
        }
    }, [offer]);

    const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    };

    const formatDisplayDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleNumberChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Offer title is required';
        }

        if (!formData.discount_value || formData.discount_value <= 0) {
            newErrors.discount_value = 'Discount value must be greater than 0';
        }

        if (formData.discount_type === 'PERCENT' && formData.discount_value > 100) {
            newErrors.discount_value = 'Percentage discount cannot exceed 100%';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Start date is required';
        }

        if (!formData.end_date) {
            newErrors.end_date = 'End date is required';
        }

        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            if (start >= end) {
                newErrors.end_date = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleDelete = async () => {
        if (!offer?.offer_id) return;

        if (!window.confirm('Are you sure you want to delete this offer?')) return;

        setDeleting(true);
        try {
            await deleteOffer(offer.offer_id);
            alert('Offer deleted successfully');
            onBack();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete offer');
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (!offer?.offer_id) return;

        setSaving(true);
        try {
            const updateData = {
                ...formData,
                discount_value: parseFloat(formData.discount_value),
                variant_ids: formData.variant_ids
            };

            await updateOffer(offer.offer_id, updateData);
            alert('Offer updated successfully');
            setIsEditing(false);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to update offer');
        } finally {
            setSaving(false);
        }
    };

    if (!offer) {
        return (
            <div className="offer-not-found">
                <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <div className="error-content">
                        <h3>Offer Not Found</h3>
                        <p>The offer you're looking for doesn't exist or has been deleted.</p>
                    </div>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={onBack}
                >
                    Back to Marketing
                </button>
            </div>
        );
    }

    if (loading && !offer) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="detail-container">
            <div className="detail-header">
                <button
                    className="btn btn-back"
                    onClick={onBack}
                >
                    <FaArrowLeft /> Back to Marketing
                </button>

                <div className="header-actions">
                    {!isEditing ? (
                        <button
                            className="btn btn-edit"
                            onClick={() => setIsEditing(true)}
                        >
                            <FaEdit /> Edit Offer
                        </button>
                    ) : (
                        <>
                            <button
                                className="btn btn-cancel"
                                onClick={() => setIsEditing(false)}
                            >
                                <FaTimes /> Cancel
                            </button>
                            <button
                                className="btn btn-save"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    )}
                    <button
                        className="btn btn-delete"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        <FaTrash /> {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <div className="alert-icon">❌</div>
                    <div className="alert-content">
                        <strong>Error:</strong> {error}
                    </div>
                    <button className="alert-close" onClick={clearError}>×</button>
                </div>
            )}

            {isEditing ? (
                <div className="edit-form">
                    <form onSubmit={handleSave} className="offer-form">
                        <div className="form-section">
                            <h3>Offer Information</h3>
                            <div className="form-group">
                                <label htmlFor="title">Offer Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Summer Sale"
                                    className={errors.title ? 'error' : ''}
                                />
                                {errors.title && <span className="error-text">{errors.title}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter offer description (optional)"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Discount Details</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="discount_type">Discount Type *</label>
                                    <select
                                        id="discount_type"
                                        name="discount_type"
                                        value={formData.discount_type}
                                        onChange={handleChange}
                                    >
                                        <option value="PERCENT">Percentage (%)</option>
                                        <option value="FLAT">Flat Amount (₹)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="discount_value">Discount Value *</label>
                                    <div className="input-with-unit">
                                        <input
                                            type="number"
                                            id="discount_value"
                                            name="discount_value"
                                            value={formData.discount_value}
                                            onChange={(e) => handleNumberChange('discount_value', e.target.value)}
                                            step="0.01"
                                            min="0.01"
                                            placeholder={formData.discount_type === 'PERCENT' ? 'e.g., 20' : 'e.g., 100'}
                                            className={errors.discount_value ? 'error' : ''}
                                        />
                                        <span className="input-unit">
                                            {formData.discount_type === 'PERCENT' ? '%' : '₹'}
                                        </span>
                                    </div>
                                    {errors.discount_value && <span className="error-text">{errors.discount_value}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Validity Period</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="start_date">Start Date *</label>
                                    <input
                                        type="datetime-local"
                                        id="start_date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className={errors.start_date ? 'error' : ''}
                                    />
                                    {errors.start_date && <span className="error-text">{errors.start_date}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="end_date">End Date *</label>
                                    <input
                                        type="datetime-local"
                                        id="end_date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        className={errors.end_date ? 'error' : ''}
                                    />
                                    {errors.end_date && <span className="error-text">{errors.end_date}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Status</h3>
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                    />
                                    <span>Active</span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="detail-view">
                    <div className="detail-card">
                        <div className="card-header">
                            <div className="header-icon">
                                <FaTag />
                            </div>
                            <div className="header-content">
                                <h2 className="offer-title">{offer.title}</h2>
                                <div className={`status-badge ${offer.is_active ? 'active' : 'inactive'}`}>
                                    {offer.is_active ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </div>

                        <div className="card-content">
                            <div className="detail-sections">
                                <div className="section">
                                    <h3>Basic Information</h3>
                                    <div className="detail-item">
                                        <span className="label">Description:</span>
                                        <span className="value">{offer.description || 'No description'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Discount Type:</span>
                                        <span className={`value badge ${offer.discount_type === 'PERCENT' ? 'badge-blue' : 'badge-green'}`}>
                                            {offer.discount_type === 'PERCENT' ? 'Percentage' : 'Flat'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Discount Value:</span>
                                        <span className="value highlight">
                                            {offer.discount_type === 'PERCENT' ?
                                                `${offer.discount_value}%` :
                                                `₹${offer.discount_value}`
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="section">
                                    <h3>Validity Period</h3>
                                    <div className="detail-item">
                                        <span className="label">Start Date:</span>
                                        <div className="value date-value">
                                            <FaCalendar /> {formatDisplayDate(offer.start_date)}
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">End Date:</span>
                                        <div className="value date-value">
                                            <FaCalendar /> {formatDisplayDate(offer.end_date)}
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Created At:</span>
                                        <span className="value">{formatDisplayDate(offer.created_at)}</span>
                                    </div>
                                </div>

                                <div className="section">
                                    <h3>Status</h3>
                                    <div className="detail-item">
                                        <span className="label">Active Status:</span>
                                        <span className={`value status ${offer.is_active ? 'active' : 'inactive'}`}>
                                            {offer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="variants-section">
                                <h3>Applicable Variants</h3>
                                {offer.variants && offer.variants.length > 0 ? (
                                    <div className="variants-list">
                                        {offer.variants.map(variantId => (
                                            <span key={variantId} className="variant-tag">
                                                Variant #{variantId}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-variants">Applies to all products</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferDetail;