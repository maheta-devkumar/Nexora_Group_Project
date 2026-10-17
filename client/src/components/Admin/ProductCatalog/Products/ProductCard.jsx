import React, { useState } from 'react';
import { useProductContext } from '../../../../context/ProductContext';
import ActionModal from './ActionModal';
import './ProductCard.css';

const ProductCard = ({ product, onEdit, onViewDetails }) => {
    const { deleteProduct } = useProductContext();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleCardClick = () => {
        onViewDetails();
    };

    const handleDelete = async () => {
        const result = await deleteProduct(product.product_id);
        if (result) {
            setShowDeleteModal(false);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteModal(true);
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEdit(product);
    };

    const handleDetailsClick = (e) => {
        e.stopPropagation();
        console.log('🟢 ProductCard - View Details clicked for product:', product.product_id); // ✅ Debug
        onViewDetails();
    };

    return (
        <>
            <div className="admin-product-card" onClick={handleCardClick}>
                <div className="admin-card-content">
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">{product.product_name}</h3>
                        <span className="admin-card-id">#{product.product_id}</span>
                    </div>

                    <div className="admin-card-info">
                        <p><strong>SKU:</strong> {product.sku_prefix || 'N/A'}</p>
                        <p><strong>Category:</strong> {product.category_name || 'N/A'}</p>
                        <p><strong>Brand:</strong> {product.brand_name || 'N/A'}</p>
                        <p><strong>Variants:</strong> {product.total_variants || 0}</p>
                    </div>

                    <div className="admin-card-meta">
                        <span className="admin-card-date">
                            Created: {new Date(product.created_at).toLocaleDateString()}
                        </span>
                        <span className={`admin-card-status admin-status-${product.status || 'active'}`}>
                            {product.status || 'active'}
                        </span>
                    </div>

                    <div className="admin-card-actions">
                        <button
                            className="admin-btn-action admin-btn-edit"
                            onClick={handleEditClick}
                        >
                            Edit
                        </button>
                        <button
                            className="admin-btn-action admin-btn-details"
                            onClick={handleDetailsClick}
                        >
                            Details
                        </button>
                        <button
                            className="admin-btn-action admin-btn-delete"
                            onClick={handleDeleteClick}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <ActionModal
                    title="Delete Product"
                    message={`Are you sure you want to delete "${product.product_name}"?`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteModal(false)}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />
            )}
        </>
    );
};

export default ProductCard;