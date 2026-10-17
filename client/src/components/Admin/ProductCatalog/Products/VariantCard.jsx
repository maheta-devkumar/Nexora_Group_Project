import React, { useState } from 'react';
import { useVariant } from '../../../../context/VariantContext';
import ActionModal from './ActionModal';
import './VariantCard.css';

const VariantCard = ({ variant, onViewDetails, productId, onEdit }) => {
    const { deleteVariant, setDefault } = useVariant();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleCardClick = () => {
        onViewDetails();
    };

    const handleDelete = async () => {
        const result = await deleteVariant(variant.variant_id);
        if (result) {
            setShowDeleteModal(false);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (!variant.is_default) {
            setShowDeleteModal(true);
        }
    };

    const handleDetailsClick = (e) => {
        e.stopPropagation();
        onViewDetails();
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        if (onEdit) {
            onEdit(variant);
        }
    };

    const handleSetDefaultClick = async (e) => {
        e.stopPropagation();
        if (productId && !variant.is_default) {
            await setDefault(productId, variant.variant_id);
        }
    };

    return (
        <>
            <div className="admin-variant-card" onClick={handleCardClick}>
                <div className="admin-vc-content">
                    <h3 className="admin-vc-title">
                        {variant.variant_name}
                        {variant.is_default && (
                            <span className="admin-vc-default-badge">Default</span>
                        )}
                    </h3>

                    <div className="admin-vc-info">
                        <p><strong>ID:</strong> {variant.variant_id}</p>
                        <p><strong>SKU:</strong> {variant.sku}</p>
                        <p><strong>Price:</strong> ${variant.price}</p>
                        <p><strong>Stock:</strong> {variant.stock_quantity}</p>
                        <p><strong>Status:</strong>
                            <span className={`admin-vc-status admin-vc-status-${variant.status}`}>
                                {variant.status}
                            </span>
                        </p>
                    </div>

                    <div className="admin-vc-actions">
                        <button
                            className="admin-vc-btn admin-vc-btn-details"
                            onClick={handleDetailsClick}
                        >
                            Details
                        </button>
                        <button
                            className="admin-vc-btn admin-vc-btn-edit"
                            onClick={handleEditClick}
                        >
                            Edit
                        </button>
                        <button
                            className="admin-vc-btn admin-vc-btn-default"
                            onClick={handleSetDefaultClick}
                            disabled={variant.is_default}
                        >
                            {variant.is_default ? 'Default' : 'Set Default'}
                        </button>
                        <button
                            className="admin-vc-btn admin-vc-btn-delete"
                            onClick={handleDeleteClick}
                            disabled={variant.is_default}
                            title={variant.is_default ? "Cannot delete default variant" : ""}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <ActionModal
                    title={variant.is_default ? "Cannot Delete Default Variant" : "Delete Variant"}
                    message={variant.is_default
                        ? `"${variant.sku}" is the default variant and cannot be deleted. Please set another variant as default first.`
                        : `Are you sure you want to delete variant "${variant.sku}"?`}
                    onConfirm={variant.is_default ? () => setShowDeleteModal(false) : handleDelete}
                    onCancel={() => setShowDeleteModal(false)}
                    confirmText={variant.is_default ? "OK" : "Delete"}
                    cancelText={variant.is_default ? null : "Cancel"}
                    type={variant.is_default ? "warning" : "danger"}
                />
            )}
        </>
    );
};

export default VariantCard;