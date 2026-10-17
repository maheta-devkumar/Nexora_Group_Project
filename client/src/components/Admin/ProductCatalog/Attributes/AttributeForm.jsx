// components/Admin/ProductCatalog/Attributes/AttributeForm.jsx
import React, { useState, useEffect } from 'react';
import { useAttributes } from '../../../../context/AttributeContext';
import './AttributeForm.css';

const AttributeForm = ({ attributeId, onSuccess, onCancel }) => {
    const { createAttribute, updateAttribute, getAttributeById, clearError } = useAttributes();
    
    const [formData, setFormData] = useState({
        attribute_name: '',
    });
    
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        clearError();
        setInitialized(false);
        
        try {
            if (attributeId) {
                setIsEditing(true);
                const attribute = getAttributeById ? getAttributeById(attributeId) : null;
                if (attribute) {
                    setFormData({
                        attribute_name: attribute.attribute_name || '',
                    });
                } else {
                    // If attribute not found in local state, use default
                    setFormData({
                        attribute_name: '',
                    });
                }
            } else {
                setIsEditing(false);
                setFormData({
                    attribute_name: '',
                });
            }
        } catch (error) {
            console.error('Error initializing form:', error);
            setErrors({
                submit: 'Failed to load attribute data'
            });
        } finally {
            setInitialized(true);
        }
        
        return () => {
            clearError();
        };
    }, [attributeId, getAttributeById, clearError]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.attribute_name.trim()) {
            newErrors.attribute_name = 'Attribute name is required';
        } else if (formData.attribute_name.length < 2) {
            newErrors.attribute_name = 'Attribute name must be at least 2 characters';
        } else if (formData.attribute_name.length > 50) {
            newErrors.attribute_name = 'Attribute name must be less than 50 characters';
        }
        
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        
        // Clear success message
        if (successMessage) {
            setSuccessMessage('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        
        setLoading(true);
        setErrors({});
        setSuccessMessage('');
        clearError();
        
        try {
            let result;
            
            if (isEditing) {
                result = await updateAttribute(attributeId, formData);
            } else {
                result = await createAttribute(formData);
            }
            
            if (result.success) {
                setSuccessMessage(result.message || 'Attribute saved successfully!');
                // Wait a moment before closing to show success message
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setErrors({
                    submit: result.message || 'Failed to save attribute'
                });
            }
        } catch (error) {
            setErrors({
                submit: error.message || 'An error occurred. Please try again.'
            });
            console.error('Form submission error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!initialized) {
        return (
            <div className="attribute-form-container">
                <div className="form-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading form...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="attribute-form-container">
            <div className="form-header">
                <h2 className="form-title">
                    <i className="fas fa-list-alt"></i>
                    {isEditing ? 'Edit Attribute' : 'Add New Attribute'}
                </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="attribute-form">
                <div className="form-group">
                    <label htmlFor="attribute_name" className="form-label">
                        Attribute Name *
                    </label>
                    <input
                        type="text"
                        id="attribute_name"
                        name="attribute_name"
                        className={`form-input ${errors.attribute_name ? 'input-error' : ''}`}
                        value={formData.attribute_name}
                        onChange={handleChange}
                        placeholder="Enter attribute name"
                        disabled={loading}
                        maxLength={50}
                        autoFocus
                    />
                    <div className="char-counter">
                        {formData.attribute_name.length}/50 characters
                    </div>
                    {errors.attribute_name && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            {errors.attribute_name}
                        </div>
                    )}
                </div>
                
                {successMessage && (
                    <div className="form-success-message">
                        <i className="fas fa-check-circle"></i>
                        {successMessage}
                    </div>
                )}
                
                {errors.submit && (
                    <div className="form-error-message">
                        <i className="fas fa-exclamation-triangle"></i>
                        {errors.submit}
                    </div>
                )}
                
                <div className="form-actions">
                    <button
                        type="button"
                        className="form-btn cancel-btn"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="form-btn submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner-btn"></span>
                                {isEditing ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check"></i>
                                {isEditing ? 'Update Attribute' : 'Create Attribute'}
                            </>
                        )}
                    </button>
                </div>
                
                <div className="form-footer">
                    <div className="footer-note">
                        <i className="fas fa-lightbulb"></i>
                        <span>
                            * Required field. Examples: Color, Size, Weight, Material, Storage, RAM, etc.
                        </span>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AttributeForm;