import React, { useState } from 'react';
import './SubcategoryCard.css';

const SubcategoryCard = ({ subcategory, onEdit, onDelete }) => {
    const [showActions, setShowActions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${subcategory.sub_category_name}"?`)) {
            if (onDelete) {
                onDelete(subcategory.sub_category_id, subcategory.sub_category_name);
            }
        }
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        if (onEdit) {
            onEdit(subcategory.sub_category_id);
        }
    };

    return (
        <div 
            className="subcategory-card"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="subcategory-content">
                <div className="subcategory-header">
                    <div className="subcategory-icon">
                        <i className="fas fa-folder-open"></i>
                    </div>
                    <div className="subcategory-info">
                        <h4 className="subcategory-name">
                            {subcategory.sub_category_name}
                            <span className="subcategory-id">ID: {subcategory.sub_category_id}</span>
                        </h4>
                        {subcategory.description && (
                            <p className="subcategory-description">
                                {subcategory.description.length > 100 
                                    ? `${subcategory.description.substring(0, 100)}...`
                                    : subcategory.description}
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="subcategory-meta">
                    <span className="meta-item">
                        <i className="fas fa-folder"></i>
                        Parent ID: {subcategory.category_id}
                    </span>
                </div>
            </div>
            
            <div className={`subcategory-actions ${showActions ? 'visible' : ''}`}>
                <button 
                    className="action-btn edit-btn"
                    onClick={handleEditClick}
                    title="Edit Subcategory"
                >
                    <i className="fas fa-edit"></i>
                </button>
                <button 
                    className="action-btn delete-btn"
                    onClick={handleDeleteClick}
                    title="Delete Subcategory"
                >
                    <i className="fas fa-trash"></i>
                </button>
            </div>
        </div>
    );
};

export default SubcategoryCard;