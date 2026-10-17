import React, { useState, useEffect } from 'react';
import { useVariant } from '../../../../context/VariantContext';
import './VariantForm.css';

const VariantForm = ({
    mode = 'add',
    productId,
    variant = null,
    onCancel,
    onSuccess
}) => {
    const {
        createVariant,
        updateVariant,
        loading,
        error,
        clearError,
        checkVariantExists
    } = useVariant();

    const [formData, setFormData] = useState({
        product_id: productId || '',
        sku: '',
        variant_name: '',
        price: '',
        stock_quantity: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existsError, setExistsError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && variant) {
            setFormData({
                product_id: variant.product_id || productId || '',
                sku: variant.sku || '',
                variant_name: variant.variant_name || '',
                price: variant.price || '',
                stock_quantity: variant.stock_quantity || ''
            });
        } else if (mode === 'add') {
            setFormData({
                product_id: productId || '',
                sku: '',
                variant_name: '',
                price: '',
                stock_quantity: ''
            });
        }
    }, [mode, variant, productId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }

        if ((name === 'sku' || name === 'variant_name') && existsError) {
            setExistsError('');
        }
    };

    const checkVariantExistsAsync = async (sku, variantName, currentVariantId = null) => {
        if (!sku.trim() || !variantName.trim()) return false;

        try {
            const exists = await checkVariantExists(sku, variantName, currentVariantId);
            if (exists) {
                setExistsError('A variant with this SKU or name already exists');
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error checking variant existence:', err);
            return false;
        }
    };

    const validate = async () => {
        const newErrors = {};

        if (!formData.product_id) {
            newErrors.product_id = "Product ID is required";
        }

        if (!formData.sku.trim()) {
            newErrors.sku = "SKU is required";
        }

        if (!formData.variant_name.trim()) {
            newErrors.variant_name = "Variant name is required";
        }

        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.price = "Price must be greater than 0";
        }

        if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
            newErrors.stock_quantity = "Stock quantity cannot be negative";
        }

        if (formData.sku.trim() && formData.variant_name.trim()) {
            if (mode === 'add') {
                const variantExists = await checkVariantExistsAsync(formData.sku, formData.variant_name);
                if (variantExists) {
                    newErrors.sku = "Variant already exists";
                    newErrors.variant_name = "Variant already exists";
                }
            } else if (mode === 'edit') {
                const originalSku = variant?.sku || '';
                const originalName = variant?.variant_name || '';
                if (formData.sku !== originalSku || formData.variant_name !== originalName) {
                    const variantExists = await checkVariantExistsAsync(formData.sku, formData.variant_name, variant.variant_id);
                    if (variantExists) {
                        newErrors.sku = "Another variant with this SKU or name already exists";
                        newErrors.variant_name = "Another variant with this SKU or name already exists";
                    }
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setExistsError('');

        if (!await validate()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = {
                product_id: parseInt(formData.product_id),
                sku: formData.sku,
                variant_name: formData.variant_name,
                price: parseFloat(formData.price),
                stock_quantity: parseInt(formData.stock_quantity)
            };

            console.log('Submitting variant:', submitData);

            let result;
            if (mode === 'add') {
                result = await createVariant(submitData);
            } else {
                result = await updateVariant(variant.variant_id, submitData);
            }

            if (result && result.success) {
                console.log('Variant operation successful:', result);
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                console.error('Variant operation failed:', result?.message);
                if (result?.message && result.message.toLowerCase().includes('exists')) {
                    setExistsError(result.message);
                }
            }
        } catch (err) {
            console.error('Variant operation error:', err);
            if (err.response?.data?.detail && err.response.data.detail.toLowerCase().includes('exists')) {
                setExistsError(err.response.data.detail);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelClick = () => {
        if (onCancel) {
            onCancel();
        }
    };

    const renderError = () => {
        if (!error && !existsError) return null;

        let errorMessage = existsError || '';

        if (!errorMessage && error) {
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (typeof error === 'object') {
                if (error.message) errorMessage = error.message;
                else if (error.msg) errorMessage = error.msg;
                else if (error.detail) errorMessage = error.detail;
                else errorMessage = JSON.stringify(error);
            }
        }

        return (
            <div className="admin-vf-error-container">
                <strong>Error:</strong> {errorMessage}
                <button onClick={() => { clearError(); setExistsError(''); }} className="admin-vf-dismiss-error-btn">
                    Dismiss
                </button>
            </div>
        );
    };

    return (
        <div className="admin-variant-form-section">
            <h2 className="admin-vf-title">
                {mode === 'add' ? 'Create New Variant' : 'Edit Variant'}
            </h2>

            {renderError()}

            <form onSubmit={handleSubmit} className="admin-variant-form">
                <div className="admin-vf-group">
                    <label className="admin-vf-label">Product ID:</label>
                    <input
                        type="text"
                        name="product_id"
                        value={formData.product_id}
                        onChange={handleChange}
                        className={`admin-vf-input ${errors.product_id ? 'admin-vf-input-error' : ''}`}
                        disabled={mode === 'edit' || isSubmitting || loading}
                        required
                    />
                    {errors.product_id && <p className="admin-vf-error-text">{errors.product_id}</p>}
                </div>

                <div className="admin-vf-group">
                    <label className="admin-vf-label">SKU:</label>
                    <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        className={`admin-vf-input ${errors.sku || existsError ? 'admin-vf-input-error' : ''}`}
                        disabled={isSubmitting || loading}
                        required
                    />
                    {errors.sku && <p className="admin-vf-error-text">{errors.sku}</p>}
                </div>

                <div className="admin-vf-group">
                    <label className="admin-vf-label">Variant Name:</label>
                    <input
                        type="text"
                        name="variant_name"
                        value={formData.variant_name}
                        onChange={handleChange}
                        className={`admin-vf-input ${errors.variant_name || existsError ? 'admin-vf-input-error' : ''}`}
                        disabled={isSubmitting || loading}
                        required
                    />
                    {errors.variant_name && <p className="admin-vf-error-text">{errors.variant_name}</p>}
                </div>

                <div className="admin-vf-group">
                    <label className="admin-vf-label">Price:</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className={`admin-vf-input ${errors.price ? 'admin-vf-input-error' : ''}`}
                        step="0.01"
                        disabled={isSubmitting || loading}
                        required
                    />
                    {errors.price && <p className="admin-vf-error-text">{errors.price}</p>}
                </div>

                <div className="admin-vf-group">
                    <label className="admin-vf-label">Stock Quantity:</label>
                    <input
                        type="number"
                        name="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={handleChange}
                        className={`admin-vf-input ${errors.stock_quantity ? 'admin-vf-input-error' : ''}`}
                        disabled={isSubmitting || loading}
                        required
                    />
                    {errors.stock_quantity && <p className="admin-vf-error-text">{errors.stock_quantity}</p>}
                </div>

                {existsError && !errors.sku && !errors.variant_name && (
                    <div className="admin-vf-group">
                        <p className="admin-vf-error-text" style={{ marginTop: '-10px', marginBottom: '15px' }}>
                            {existsError}
                        </p>
                    </div>
                )}

                <div className="admin-vf-actions">
                    <button
                        type="button"
                        onClick={handleCancelClick}
                        className="admin-vf-btn admin-vf-btn-cancel"
                        disabled={isSubmitting || loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="admin-vf-btn admin-vf-btn-submit"
                        disabled={isSubmitting || loading}
                    >
                        {isSubmitting || loading ? 'Saving...' : mode === 'add' ? 'Create Variant' : 'Update Variant'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VariantForm;