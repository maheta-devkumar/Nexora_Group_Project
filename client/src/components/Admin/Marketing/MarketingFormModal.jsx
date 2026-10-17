import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useMarketingContext } from '../../../context/MarketingContext';
import './MarketingFormModal.css';

const MarketingFormModal = ({ visible, type, editingItem, onClose }) => {
    const { createCoupon, updateCoupon, createOffer, updateOffer, coupons, offers, loading, error } = useMarketingContext();
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        discount_type: 'PERCENT',
        discount_value: 10,
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: 1,
        start_date: '',
        end_date: '',
        is_active: true
    });
    const [variantIds, setVariantIds] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (editingItem) {
            setFormData({
                code: editingItem.code || '',
                title: editingItem.title || '',
                description: editingItem.description || '',
                discount_type: editingItem.discount_type || 'PERCENT',
                discount_value: editingItem.discount_value || 10,
                min_order_amount: editingItem.min_order_amount || '',
                max_discount_amount: editingItem.max_discount_amount || '',
                usage_limit: editingItem.usage_limit || 1,
                start_date: editingItem.start_date ? formatDateForInput(editingItem.start_date) : '',
                end_date: editingItem.end_date ? formatDateForInput(editingItem.end_date) : '',
                is_active: editingItem.is_active !== undefined ? editingItem.is_active : true
            });
            setVariantIds(editingItem.variants || []);
        } else {
            // Reset form
            setFormData({
                code: '',
                title: '',
                description: '',
                discount_type: 'PERCENT',
                discount_value: 10,
                min_order_amount: '',
                max_discount_amount: '',
                usage_limit: 1,
                start_date: '',
                end_date: '',
                is_active: true
            });
            setVariantIds([]);
        }
        setErrors({});
    }, [editingItem]);

    const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
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

    const handleVariantChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setVariantIds(selected);
    };

    const validateForm = () => {
        const newErrors = {};

        if (type === 'coupon' && !formData.code.trim()) {
            newErrors.code = 'Coupon code is required';
        } else if (type === 'coupon') {
            // Check for duplicate coupon code (case-insensitive)
            const codeLower = formData.code.trim().toLowerCase();
            const isDuplicate = coupons.some(c =>
                c.code.toLowerCase() === codeLower &&
                (!editingItem || c.coupon_id !== editingItem.coupon_id)
            );

            if (isDuplicate) {
                newErrors.code = 'A coupon with this code already exists';
            }
        }

        if (type === 'offer' && !formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (type === 'offer') {
            // Check for duplicate offer title (case-insensitive)
            const titleLower = formData.title.trim().toLowerCase();
            const isDuplicate = offers.some(o =>
                o.title.toLowerCase() === titleLower &&
                (!editingItem || o.offer_id !== editingItem.offer_id)
            );

            if (isDuplicate) {
                newErrors.title = 'An offer with this title already exists';
            }
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

        if (type === 'coupon' && (!formData.usage_limit || formData.usage_limit < 1)) {
            newErrors.usage_limit = 'Usage limit must be at least 1';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const payload = {
            ...formData,
            variant_ids: variantIds,
            discount_value: parseFloat(formData.discount_value),
            min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
            max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
            usage_limit: type === 'coupon' ? parseInt(formData.usage_limit) : null,
        };

        try {
            if (type === 'coupon') {
                if (editingItem) {
                    await updateCoupon(editingItem.coupon_id, payload);
                } else {
                    await createCoupon(payload);
                }
            } else {
                if (editingItem) {
                    await updateOffer(editingItem.offer_id, payload);
                } else {
                    await createOffer(payload);
                }
            }
            alert(`${type === 'coupon' ? 'Coupon' : 'Offer'} ${editingItem ? 'updated' : 'created'} successfully`);
            onClose();
        } catch (err) {
            console.error('Form submission error:', err);
        }
    };

    if (!visible) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{editingItem ? 'Edit' : 'Create'} {type === 'coupon' ? 'Coupon' : 'Offer'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <div className="alert-icon">❌</div>
                        <div className="alert-content">
                            <strong>Error:</strong> {error}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="marketing-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor={type === 'coupon' ? 'code' : 'title'}>
                                {type === 'coupon' ? 'Coupon Code *' : 'Title *'}
                            </label>
                            <input
                                type="text"
                                id={type === 'coupon' ? 'code' : 'title'}
                                name={type === 'coupon' ? 'code' : 'title'}
                                value={type === 'coupon' ? formData.code : formData.title}
                                onChange={handleChange}
                                placeholder={type === 'coupon' ? 'e.g., SUMMER20' : 'e.g., Summer Sale'}
                                maxLength={type === 'coupon' ? 50 : 100}
                                className={errors[type === 'coupon' ? 'code' : 'title'] ? 'error' : ''}
                            />
                            {errors[type === 'coupon' ? 'code' : 'title'] && (
                                <span className="error-text">{errors[type === 'coupon' ? 'code' : 'title']}</span>
                            )}
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
                            placeholder="Enter description (optional)"
                            maxLength="255"
                        />
                    </div>

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
                            {errors.discount_value && (
                                <span className="error-text">{errors.discount_value}</span>
                            )}
                        </div>

                        {type === 'coupon' && (
                            <>
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
                            </>
                        )}
                    </div>

                    {type === 'coupon' && (
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
                            {errors.usage_limit && (
                                <span className="error-text">{errors.usage_limit}</span>
                            )}
                        </div>
                    )}

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
                            {errors.start_date && (
                                <span className="error-text">{errors.start_date}</span>
                            )}
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
                            {errors.end_date && (
                                <span className="error-text">{errors.end_date}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="variant_ids">Product Variants (Optional)</label>
                        <select
                            id="variant_ids"
                            multiple
                            value={variantIds}
                            onChange={handleVariantChange}
                            className="multi-select"
                        >
                            <option value="1">Variant 1</option>
                            <option value="2">Variant 2</option>
                            <option value="3">Variant 3</option>
                            <option value="4">Variant 4</option>
                            <option value="5">Variant 5</option>
                        </select>
                        <small className="help-text">Hold Ctrl/Cmd to select multiple variants. Leave empty to apply to all products.</small>
                    </div>

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

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MarketingFormModal;