import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductContext } from '../../../../context/ProductContext';
import './ProductForm.css';

const ProductForm = ({ mode = 'add', product = null, onCancel, onSuccess }) => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const {
        fetchProductById,
        createProduct,
        updateProduct,
        categories,
        brands,
        loading,
        error,
        clearError,
        checkProductExists
    } = useProductContext();

    const [formData, setFormData] = useState({
        product_name: '',
        description: '',
        sub_category_id: '',
        brand_id: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [flattenedCategories, setFlattenedCategories] = useState([]);
    const [existsError, setExistsError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && productId && !product) {
            fetchProductById(productId);
        }
    }, [mode, productId, product, fetchProductById]);

    useEffect(() => {
        if (mode === 'edit' && product) {
            setFormData({
                product_name: product.product_name || '',
                description: product.description || '',
                sub_category_id: product.sub_category_id || '',
                brand_id: product.brand_id || ''
            });
        }
    }, [mode, product]);

    useEffect(() => {
        if (categories.length > 0) {
            const flattened = [];
            categories.forEach(category => {
                if (category.sub_categories && category.sub_categories.length > 0) {
                    category.sub_categories.forEach(subCategory => {
                        flattened.push({
                            ...subCategory,
                            category_name: category.category_name,
                            full_name: `${category.category_name} → ${subCategory.sub_category_name}`
                        });
                    });
                } else {
                    flattened.push({
                        sub_category_id: category.category_id,
                        sub_category_name: category.category_name,
                        category_name: category.category_name,
                        full_name: category.category_name
                    });
                }
            });
            setFlattenedCategories(flattened);
        }
    }, [categories]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }

        if (name === 'product_name' && existsError) {
            setExistsError('');
        }
    };

    const checkProductExistsAsync = async (productName, currentProductId = null) => {
        if (!productName.trim()) return false;

        try {
            const exists = await checkProductExists(productName, currentProductId);
            if (exists) {
                setExistsError('A product with this name already exists');
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error checking product existence:', err);
            return false;
        }
    };

    const validate = async () => {
        const newErrors = {};

        if (!formData.product_name.trim()) {
            newErrors.product_name = "Product name is required";
        } else if (mode === 'add') {
            const productExists = await checkProductExistsAsync(formData.product_name);
            if (productExists) {
                newErrors.product_name = "Product already exists";
            }
        } else if (mode === 'edit') {
            const originalName = product?.product_name || '';
            if (formData.product_name !== originalName) {
                const productExists = await checkProductExistsAsync(formData.product_name, productId || product?.product_id);
                if (productExists) {
                    newErrors.product_name = "Another product with this name already exists";
                }
            }
        }

        if (!formData.sub_category_id) {
            newErrors.sub_category_id = "Category is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setExistsError('');

        const isValid = await validate();
        if (!isValid) {
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = {
                product_name: formData.product_name,
                description: formData.description || null,
                brand_id: formData.brand_id || null,
                sub_category_id: formData.sub_category_id
            };

            console.log('Submitting product:', submitData);

            let result;
            if (mode === 'add') {
                result = await createProduct(submitData);
            } else {
                const idToUpdate = productId || product?.product_id;
                result = await updateProduct(idToUpdate, submitData);
            }

            if (result && result.success) {
                console.log('Product operation successful:', result);
                if (onSuccess) {
                    onSuccess();
                } else {
                    const id = mode === 'add' ? result.product_id : (productId || product?.product_id);
                    navigate(`/admin/products/${id}`);
                }
            } else {
                console.error('Product operation failed:', result?.message);
                if (result?.message && result.message.toLowerCase().includes('exists')) {
                    setExistsError(result.message);
                }
            }
        } catch (err) {
            console.error('Product operation error:', err);
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
        } else {
            if (mode === 'edit' && (productId || product?.product_id)) {
                navigate(`/admin/products/${productId || product?.product_id}`);
            } else {
                navigate('/admin/products');
            }
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
            <div className="admin-error-alert">
                <span><strong>Error:</strong> {errorMessage}</span>
                <button onClick={() => { clearError(); setExistsError(''); }} className="admin-dismiss-btn">
                    Dismiss
                </button>
            </div>
        );
    };

    return (
        <div className="admin-product-form-section">
            <h2 className="admin-form-section-title">
                {mode === 'add' ? 'Create New Product' : 'Edit Product'}
            </h2>

            {renderError()}

            <form onSubmit={handleSubmit} className="admin-product-form">
                <div className="admin-form-group">
                    <label className="admin-form-label">Product Name *</label>
                    <input
                        type="text"
                        name="product_name"
                        value={formData.product_name}
                        onChange={handleChange}
                        className={`admin-form-input ${errors.product_name || existsError ? 'admin-input-error' : ''}`}
                        disabled={isSubmitting || loading}
                        required
                    />
                    {errors.product_name && <p className="admin-error-text">{errors.product_name}</p>}
                    {existsError && !errors.product_name && <p className="admin-error-text">{existsError}</p>}
                </div>

                <div className="admin-form-group">
                    <label className="admin-form-label">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="admin-form-textarea"
                        rows={4}
                        disabled={isSubmitting || loading}
                    />
                </div>

                <div className="admin-form-group">
                    <label className="admin-form-label">Category *</label>
                    <select
                        name="sub_category_id"
                        value={formData.sub_category_id}
                        onChange={handleChange}
                        className={`admin-form-select ${errors.sub_category_id ? 'admin-input-error' : ''}`}
                        disabled={isSubmitting || loading}
                        required
                    >
                        <option value="">Select Category</option>
                        {flattenedCategories.map(category => (
                            <option key={category.sub_category_id} value={category.sub_category_id}>
                                {category.full_name}
                            </option>
                        ))}
                    </select>
                    {errors.sub_category_id && <p className="admin-error-text">{errors.sub_category_id}</p>}
                </div>

                <div className="admin-form-group">
                    <label className="admin-form-label">Brand</label>
                    <select
                        name="brand_id"
                        value={formData.brand_id}
                        onChange={handleChange}
                        className="admin-form-select"
                        disabled={isSubmitting || loading}
                    >
                        <option value="">Select Brand</option>
                        {brands.map((brand, index) => (
                            <option
                                key={brand.brand_id || `brand-${index}`}
                                value={brand.brand_id || ''}
                            >
                                {brand.brand_name || `Brand ${index + 1}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="admin-form-actions">
                    <button
                        type="button"
                        onClick={handleCancelClick}
                        className="admin-btn-cancel"
                        disabled={isSubmitting || loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="admin-btn-submit"
                        disabled={isSubmitting || loading}
                    >
                        {isSubmitting || loading ? 'Saving...' : mode === 'add' ? 'Create Product' : 'Update Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;