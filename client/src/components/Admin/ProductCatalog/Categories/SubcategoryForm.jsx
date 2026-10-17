import React, { useState, useEffect } from 'react';
import { useCategoryContext } from '../../../../context/CategoryContext';
import './SubcategoryForm.css';

const SubcategoryForm = ({ categoryId, subcategoryId, onSuccess, onCancel, onDelete }) => {
    const { 
        categories,
        allSubcategories,
        createSubcategory, 
        updateSubcategory,
        deleteSubcategory,
        loading: contextLoading 
    } = useCategoryContext();
    
    const [formData, setFormData] = useState({
        sub_category_name: '',
        description: '',
        category_id: categoryId || ''
    });
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);

    useEffect(() => {
        if (categoryId) {
            setFormData(prev => ({ ...prev, category_id: categoryId }));
        }
        
        if (subcategoryId) {
            const subcategory = allSubcategories.find(sub => sub.sub_category_id == subcategoryId);
            if (subcategory) {
                setSelectedSubcategory(subcategory);
                setFormData({
                    sub_category_name: subcategory.sub_category_name || '',
                    description: subcategory.description || '',
                    category_id: subcategory.category_id || categoryId || ''
                });
            }
        }
    }, [categoryId, subcategoryId, allSubcategories]);

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
        
        if (!formData.sub_category_name.trim()) {
            newErrors.sub_category_name = 'Subcategory name is required';
        } else if (formData.sub_category_name.length > 100) {
            newErrors.sub_category_name = 'Subcategory name cannot exceed 100 characters';
        }
        
        if (!formData.category_id) {
            newErrors.category_id = 'Please select a parent category';
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
            const subcategoryData = {
                sub_category_name: formData.sub_category_name.trim(),
                description: formData.description.trim() || null,
                category_id: parseInt(formData.category_id)
            };
            
            let result;
            if (subcategoryId) {
                result = await updateSubcategory(subcategoryId, subcategoryData);
            } else {
                result = await createSubcategory(subcategoryData);
            }
            
            if (result) {
                onSuccess(result);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            setErrors({ submit: 'Failed to save subcategory' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!subcategoryId || !selectedSubcategory) return;
        
        const confirmed = window.confirm(
            `Are you sure you want to delete "${selectedSubcategory.sub_category_name}"?\n\n` +
            `This action cannot be undone.`
        );
        
        if (!confirmed) {
            setShowDeleteConfirm(false);
            return;
        }
        
        setIsDeleting(true);
        
        try {
            const success = await deleteSubcategory(subcategoryId);
            if (success) {
                if (onDelete) {
                    onDelete(subcategoryId);
                } else {
                    onSuccess({ deleted: true });
                }
            } else {
                alert('Failed to delete subcategory. Please try again.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert(`Error deleting subcategory: ${error.message || 'Unknown error'}`);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const selectedCategory = categories.find(c => c.category_id == formData.category_id);
    const isEditMode = !!subcategoryId;

    return (
        <div className="subcategory-form">
            <div className="form-header">
                <h2 className="form-title">
                    <i className="fas fa-folder-open"></i>
                    {isEditMode ? 'Edit Subcategory' : 'Create New Subcategory'}
                </h2>
                <button className="close-form-btn" onClick={onCancel} disabled={isSubmitting || isDeleting}>
                    <i className="fas fa-times"></i>
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-content">
                <div className="form-section">
                    <h3 className="section-title">
                        <i className="fas fa-sitemap"></i>
                        Subcategory Information
                    </h3>
                    
                    {selectedCategory && (
                        <div className="parent-category-info">
                            <div className="parent-category-header">
                                <i className="fas fa-folder"></i>
                                <span>Parent Category:</span>
                                <strong>{selectedCategory.category_name}</strong>
                            </div>
                            {selectedCategory.description && (
                                <p className="parent-category-desc">
                                    {selectedCategory.description}
                                </p>
                            )}
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label className="form-label required">
                            <i className="fas fa-tag"></i>
                            Subcategory Name
                        </label>
                        <input
                            type="text"
                            name="sub_category_name"
                            value={formData.sub_category_name}
                            onChange={handleChange}
                            className={`form-input ${errors.sub_category_name ? 'error' : ''}`}
                            placeholder="Enter subcategory name"
                            disabled={isSubmitting || isDeleting}
                            maxLength={100}
                        />
                        <div className="input-footer">
                            {errors.sub_category_name && (
                                <span className="error-message">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {errors.sub_category_name}
                                </span>
                            )}
                            <span className="char-count">
                                {formData.sub_category_name.length}/100 characters
                            </span>
                        </div>
                    </div>
                    
                    {!categoryId && (
                        <div className="form-group">
                            <label className="form-label required">
                                <i className="fas fa-folder"></i>
                                Parent Category
                            </label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className={`form-select ${errors.category_id ? 'error' : ''}`}
                                disabled={isSubmitting || isDeleting}
                            >
                                <option value="">Select Parent Category</option>
                                {categories.map(category => (
                                    <option key={category.category_id} value={category.category_id}>
                                        {category.category_name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && (
                                <span className="error-message">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {errors.category_id}
                                </span>
                            )}
                        </div>
                    )}
                    
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
                            placeholder="Enter subcategory description (optional)"
                            rows={4}
                            disabled={isSubmitting || isDeleting}
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
                    {isEditMode && (
                        <button
                            type="button"
                            className="delete-btn-form"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isSubmitting || isDeleting}
                        >
                            <i className="fas fa-trash"></i>
                            Delete
                        </button>
                    )}
                    
                    <div className="form-actions-right">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onCancel}
                            disabled={isSubmitting || isDeleting}
                        >
                            <i className="fas fa-times"></i>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isSubmitting || isDeleting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="spinner"></div>
                                    {isEditMode ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    {isEditMode ? 'Update Subcategory' : 'Create Subcategory'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
            
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="delete-confirmation-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <i className="fas fa-exclamation-triangle"></i>
                            <h3>Confirm Delete</h3>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>"{selectedSubcategory?.sub_category_name}"</strong>?</p>
                            <p className="warning-text">
                                <i className="fas fa-exclamation-circle"></i>
                                This action cannot be undone. All products under this subcategory will also be deleted.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="modal-cancel-btn"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-delete-btn"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="spinner"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-trash"></i>
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubcategoryForm;