import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaEdit, FaTrash, FaCalendar, FaPercentage, FaGift, FaSave, FaTimes } from 'react-icons/fa';
import { useMarketingContext } from '../../../context/MarketingContext';
import './CouponDetail.css';

const CouponDetail = ({ coupon, onBack, mode = 'detail' }) => {
    const { 
        updateCoupon, 
        deleteCoupon,
        loading,
        error,
        clearError 
    } = useMarketingContext();
    
    const [isEditing, setIsEditing] = useState(mode === 'edit');
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'PERCENT',
        discount_value: 10,
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: 1,
        start_date: '',
        end_date: '',
        is_active: true,
        variant_ids: []
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (coupon) {
            setFormData({
                code: coupon.code || '',
                description: coupon.description || '',
                discount_type: coupon.discount_type || 'PERCENT',
                discount_value: parseFloat(coupon.discount_value) || 10,
                min_order_amount: coupon.min_order_amount ? parseFloat(coupon.min_order_amount) : '',
                max_discount_amount: coupon.max_discount_amount ? parseFloat(coupon.max_discount_amount) : '',
                usage_limit: coupon.usage_limit || 1,
                start_date: coupon.start_date ? formatDateForInput(coupon.start_date) : '',
                end_date: coupon.end_date ? formatDateForInput(coupon.end_date) : '',
                is_active: coupon.is_active !== undefined ? coupon.is_active : true,
                variant_ids: coupon.variants || []
            });
        }
    }, [coupon]);

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
        
        if (!formData.code.trim()) {
            newErrors.code = 'Coupon code is required';
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
        
        if (!formData.usage_limit || formData.usage_limit < 1) {
            newErrors.usage_limit = 'Usage limit must be at least 1';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleDelete = async () => {
        if (!coupon?.coupon_id) return;
        
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        
        setDeleting(true);
        try {
            await deleteCoupon(coupon.coupon_id);
            alert('Coupon deleted successfully');
            onBack();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete coupon');
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        if (!coupon?.coupon_id) return;
        
        setSaving(true);
        try {
            const updateData = {
                ...formData,
                discount_value: parseFloat(formData.discount_value),
                min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
                max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
                usage_limit: parseInt(formData.usage_limit),
                variant_ids: formData.variant_ids
            };
            
            await updateCoupon(coupon.coupon_id, updateData);
            alert('Coupon updated successfully');
            setIsEditing(false);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to update coupon');
        } finally {
            setSaving(false);
        }
    };

    if (!coupon) {
        return (
            <div className="coupon-not-found">
                <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <div className="error-content">
                        <h3>Coupon Not Found</h3>
                        <p>The coupon you're looking for doesn't exist or has been deleted.</p>
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

    if (loading && !coupon) {
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
                            <FaEdit /> Edit Coupon
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
                    <form onSubmit={handleSave} className="coupon-form">
                        <div className="form-section">
                            <h3>Coupon Information</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="code">Coupon Code *</label>
                                    <input
                                        type="text"
                                        id="code"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        placeholder="e.g., SUMMER20"
                                        className={errors.code ? 'error' : ''}
                                    />
                                    {errors.code && <span className="error-text">{errors.code}</span>}
                                </div>
                                
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
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter coupon description (optional)"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Discount Details</h3>
                            <div className="form-grid">
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
                                
                                <div className="form-group">
                                    <label htmlFor="usage_limit">Usage Limit *</label>
                                    <input
                                        type="number"
                                        id="usage_limit"
                                        name="usage_limit"
                                        value={formData.usage_limit}
                                        onChange={(e) => handleNumberChange('usage_limit', e.target.value)}
                                        min="1"
                                        placeholder="Number of times coupon can be used"
                                        className={errors.usage_limit ? 'error' : ''}
                                    />
                                    {errors.usage_limit && <span className="error-text">{errors.usage_limit}</span>}
                                </div>
                            </div>
                            
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="min_order_amount">Minimum Order Amount</label>
                                    <div className="input-with-unit">
                                        <input
                                            type="number"
                                            id="min_order_amount"
                                            name="min_order_amount"
                                            value={formData.min_order_amount}
                                            onChange={(e) => handleNumberChange('min_order_amount', e.target.value)}
                                            step="0.01"
                                            min="0"
                                            placeholder="No minimum"
                                        />
                                        <span className="input-unit">₹</span>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="max_discount_amount">Maximum Discount</label>
                                    <div className="input-with-unit">
                                        <input
                                            type="number"
                                            id="max_discount_amount"
                                            name="max_discount_amount"
                                            value={formData.max_discount_amount}
                                            onChange={(e) => handleNumberChange('max_discount_amount', e.target.value)}
                                            step="0.01"
                                            min="0"
                                            placeholder="No limit"
                                        />
                                        <span className="input-unit">₹</span>
                                    </div>
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
                                <FaGift />
                            </div>
                            <div className="header-content">
                                <h2 className="coupon-title">{coupon.code}</h2>
                                <div className={`status-badge ${coupon.is_active ? 'active' : 'inactive'}`}>
                                    {coupon.is_active ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="card-content">
                            <div className="detail-sections">
                                <div className="section">
                                    <h3>Basic Information</h3>
                                    <div className="detail-item">
                                        <span className="label">Description:</span>
                                        <span className="value">{coupon.description || 'No description'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Discount Type:</span>
                                        <span className={`value badge ${coupon.discount_type === 'PERCENT' ? 'badge-blue' : 'badge-green'}`}>
                                            {coupon.discount_type === 'PERCENT' ? 'Percentage' : 'Flat'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Discount Value:</span>
                                        <span className="value highlight">
                                            {coupon.discount_type === 'PERCENT' ? 
                                                `${coupon.discount_value}%` : 
                                                `₹${coupon.discount_value}`
                                            }
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Usage Limit:</span>
                                        <span className="value">{coupon.usage_limit} time(s)</span>
                                    </div>
                                </div>
                                
                                <div className="section">
                                    <h3>Requirements</h3>
                                    <div className="detail-item">
                                        <span className="label">Minimum Order:</span>
                                        <span className="value">
                                            {coupon.min_order_amount ? 
                                                `₹${coupon.min_order_amount}` : 
                                                'No minimum'
                                            }
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Maximum Discount:</span>
                                        <span className="value">
                                            {coupon.max_discount_amount ? 
                                                `₹${coupon.max_discount_amount}` : 
                                                'No limit'
                                            }
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="section">
                                    <h3>Validity Period</h3>
                                    <div className="detail-item">
                                        <span className="label">Start Date:</span>
                                        <div className="value date-value">
                                            <FaCalendar /> {formatDisplayDate(coupon.start_date)}
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">End Date:</span>
                                        <div className="value date-value">
                                            <FaCalendar /> {formatDisplayDate(coupon.end_date)}
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Created At:</span>
                                        <span className="value">{formatDisplayDate(coupon.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="variants-section">
                                <h3>Applicable Variants</h3>
                                {coupon.variants && coupon.variants.length > 0 ? (
                                    <div className="variants-list">
                                        {coupon.variants.map(variantId => (
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

export default CouponDetail;