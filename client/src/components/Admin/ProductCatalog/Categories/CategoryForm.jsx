import React, { useState, useEffect } from 'react';
import { useCategoryContext } from '../../../../context/CategoryContext';
import './CategoryForm.css';

const CategoryForm = ({ categoryId, onSuccess, onCancel }) => {
    const { 
        createCategory, 
        updateCategory, 
        fetchCategoryById, 
        currentCategory,
        loading: contextLoading 
    } = useCategoryContext();
    
    const [formData, setFormData] = useState({
        category_name: '',
        description: ''
    });
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load category data if editing
    useEffect(() => {
        if (categoryId) {
            fetchCategoryById(categoryId);
        }
    }, [categoryId]);

    // Update form when currentCategory changes
    useEffect(() => {
        if (categoryId && currentCategory?.category_id === categoryId) {
            setFormData({
                category_name: currentCategory.category_name || '',
                description: currentCategory.description || ''
            });
        }
    }, [currentCategory, categoryId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateFormData = () => {
        const newErrors = {};
        
        if (!formData.category_name.trim()) {
            newErrors.category_name = 'Category name is required';
        } else if (formData.category_name.length > 100) {
            newErrors.category_name = 'Category name cannot exceed 100 characters';
        }
        
        if (formData.description && formData.description.length > 1000) {
            newErrors.description = 'Description cannot exceed 1000 characters';
        }
        
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateFormData();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const categoryData = {
                category_name: formData.category_name.trim(),
                description: formData.description.trim() || null
            };
            
            let result;
            if (categoryId) {
                result = await updateCategory(categoryId, categoryData);
            } else {
                result = await createCategory(categoryData);
            }
            
            if (result) {
                onSuccess(result);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            setErrors({ submit: 'Failed to save category' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="category-form">
            <div className="form-header">
                <h2 className="form-title">
                    <i className="fas fa-folder"></i>
                    {categoryId ? 'Edit Category' : 'Create New Category'}
                </h2>
                <button className="close-form-btn" onClick={onCancel} disabled={isSubmitting}>
                    <i className="fas fa-times"></i>
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-content">
                <div className="form-section">
                    <h3 className="section-title">
                        <i className="fas fa-info-circle"></i>
                        Category Information
                    </h3>
                    
                    <div className="form-group">
                        <label className="form-label required">
                            <i className="fas fa-tag"></i>
                            Category Name
                        </label>
                        <input
                            type="text"
                            name="category_name"
                            value={formData.category_name}
                            onChange={handleChange}
                            className={`form-input ${errors.category_name ? 'error' : ''}`}
                            placeholder="Enter category name"
                            disabled={isSubmitting}
                            maxLength={100}
                        />
                        <div className="input-footer">
                            {errors.category_name && (
                                <span className="error-message">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {errors.category_name}
                                </span>
                            )}
                            <span className="char-count">
                                {formData.category_name.length}/100 characters
                            </span>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-align-left"></i>
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={`form-textarea ${errors.description ? 'error' : ''}`}
                            placeholder="Enter category description (optional)"
                            rows={4}
                            disabled={isSubmitting}
                            maxLength={1000}
                        />
                        <div className="input-footer">
                            {errors.description && (
                                <span className="error-message">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {errors.description}
                                </span>
                            )}
                            <span className="char-count">
                                {formData.description.length}/1000 characters
                            </span>
                        </div>
                    </div>
                </div>
                
                {errors.submit && (
                    <div className="form-error">
                        <i className="fas fa-exclamation-circle"></i>
                        <span>{errors.submit}</span>
                    </div>
                )}
                
                <div className="form-actions">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        <i className="fas fa-times"></i>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="spinner"></div>
                                {categoryId ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i>
                                {categoryId ? 'Update Category' : 'Create Category'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CategoryForm;