import React, { useState, useEffect } from 'react';
import { useBrandContext } from '../../../../context/BrandContext';

const BrandForm = ({ brand = null, onSuccess, onCancel }) => {
    const { createBrand, updateBrand, loading, error, clearError } = useBrandContext();
    const [formData, setFormData] = useState({
        brand_name: '',
        description: ''
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (brand) {
            setFormData({
                brand_name: brand.brand_name || '',
                description: brand.description || ''
            });
        }
    }, [brand]);

    const validateForm = () => {
        if (!formData.brand_name.trim()) {
            setFormError('Brand name is required');
            return false;
        }
        if (formData.brand_name.length < 2) {
            setFormError('Brand name must be at least 2 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        clearError();

        if (!validateForm()) {
            return;
        }

        const result = brand
            ? await updateBrand(brand.brand_id, formData)
            : await createBrand(formData);

        if (result.success) {
            onSuccess();
        } else {
            setFormError(result.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear errors when user starts typing
        if (formError) setFormError('');
    };

    return (
        <div className="admin-brand-form-wrapper">
            <div className="admin-brand-form-header">
                <h3>
                    <i className="fas fa-tag"></i>
                    {brand ? 'Edit Brand' : 'Add New Brand'}
                </h3>
                <button className="admin-close-btn" onClick={onCancel}>
                    <i className="fas fa-times"></i>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-brand-form">
                <div className="admin-form-group">
                    <label htmlFor="brand_name" className="admin-form-label">
                        <i className="fas fa-font"></i>
                        Brand Name *
                    </label>
                    <input
                        type="text"
                        id="brand_name"
                        name="brand_name"
                        value={formData.brand_name}
                        onChange={handleChange}
                        placeholder="Enter brand name"
                        className="admin-form-input"
                        disabled={loading}
                    />
                </div>

                <div className="admin-form-group">
                    <label htmlFor="description" className="admin-form-label">
                        <i className="fas fa-align-left"></i>
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter brand description (optional)"
                        className="admin-form-textarea"
                        rows="4"
                        disabled={loading}
                    />
                </div>

                {(formError || error) && (
                    <div className="admin-error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {formError || error}
                    </div>
                )}

                <div className="admin-form-actions">
                    <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="admin-btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                {brand ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i>
                                {brand ? 'Update Brand' : 'Create Brand'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BrandForm;