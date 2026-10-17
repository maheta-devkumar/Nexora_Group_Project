import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { VariantProvider, useVariant } from '../../../context/VariantContext';
import MediaManager from '../../../components/Admin/ProductCatalog/Products/MediaManager';
import ReviewManager from '../../../components/Admin/ProductCatalog/Products/ReviewManager';
import DetailsTabs from '../../../components/Admin/ProductCatalog/Products/DetailsTabs';
import ActionModal from '../../../components/Admin/ProductCatalog/Products/ActionModal';
import VariantForm from '../../../components/Admin/ProductCatalog/Products/VariantForm';
import './VariantDetails.css';

// Create a wrapper component that provides the context
const VariantDetailsContent = () => {
    const { productId, variantId } = useParams();
    const navigate = useNavigate();
    const { selectedVariant, fetchVariantById, deleteVariant, updateStatus } = useVariant();
    const [activeTab, setActiveTab] = useState('details');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadVariant = async () => {
            setLoading(true);
            await fetchVariantById(variantId);
            setLoading(false);
        };

        if (variantId) {
            loadVariant();
        }
    }, [variantId, fetchVariantById]);

    const handleEdit = () => {
        setEditingVariant(selectedVariant);
        setShowEditForm(true);
    };

    const handleDelete = async () => {
        const result = await deleteVariant(variantId);
        if (result) {
            navigate(`/admin/products/${productId}`);
        }
        setShowDeleteModal(false);
    };

    const handleToggleStatus = async () => {
        const newStatus = selectedVariant.status === 'active' ? 'inactive' : 'active';
        await updateStatus(variantId, newStatus);
    };

    const handleFormSuccess = async () => {
        setShowEditForm(false);
        setEditingVariant(null);
        // Refresh the variant data
        if (variantId) {
            await fetchVariantById(variantId);
        }
    };

    const handleFormCancel = () => {
        setShowEditForm(false);
        setEditingVariant(null);
    };

    const tabs = [
        { id: 'details', label: 'Details' },
        { id: 'media', label: 'Media' },
        { id: 'reviews', label: 'Reviews' }
    ];

    if (loading) {
        return <div className="admin-vd-loading">Loading variant details...</div>;
    }

    if (!selectedVariant) {
        return <div className="admin-vd-not-found">Variant not found</div>;
    }

    return (
        <div className="admin-variant-details-page">
            <div className="admin-vd-header">
                <div className="admin-breadcrumb">
                    <Link to="/admin/products" className="admin-breadcrumb-link">
                        <i className="fas fa-arrow-left"></i>
                        Products
                    </Link>
                    <span className="admin-breadcrumb-separator">/</span>
                    <Link to={`/admin/products/${productId}`} className="admin-breadcrumb-link">
                        Product #{productId}
                    </Link>
                    <span className="admin-breadcrumb-separator">/</span>
                    <span className="admin-breadcrumb-current">Variant #{variantId}</span>
                </div>

                <div className="admin-vd-actions">
                    <button
                        className="admin-btn-action admin-btn-edit"
                        onClick={handleEdit}
                        disabled={showEditForm || loading}
                    >
                        <i className="fas fa-edit"></i>
                        Edit Variant
                    </button>
                    <button
                        className={`admin-btn-action admin-btn-status ${selectedVariant.status === 'active' ? 'admin-status-active' : 'admin-status-inactive'}`}
                        onClick={handleToggleStatus}
                        disabled={showEditForm || loading}
                    >
                        {selectedVariant.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                        className="admin-btn-action admin-btn-delete"
                        onClick={() => setShowDeleteModal(true)}
                        disabled={showEditForm || loading}
                    >
                        <i className="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>

            <div className="admin-vd-content">
                {showEditForm && (
                    <div className="admin-edit-form-section">
                        <VariantForm
                            mode="edit"
                            productId={productId}
                            variant={editingVariant}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </div>
                )}

                {!showEditForm && (
                    <>
                        <div className="admin-vd-basic-info">
                            <h1 className="admin-vd-title">
                                {selectedVariant.sku}
                                {selectedVariant.is_default && (
                                    <span className="admin-default-badge">Default</span>
                                )}
                            </h1>
                            <div className="admin-vd-meta">
                                <span className="admin-vd-meta-item">
                                    <strong>Status:</strong>
                                    <span className={`admin-status-badge admin-status-${selectedVariant.status}`}>
                                        {selectedVariant.status}
                                    </span>
                                </span>
                                <span className="admin-vd-meta-item">
                                    <strong>Price:</strong> ${selectedVariant.price}
                                </span>
                                <span className="admin-vd-meta-item">
                                    <strong>Stock:</strong> {selectedVariant.stock_quantity}
                                </span>
                            </div>
                        </div>

                        <DetailsTabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />

                        <div className="admin-tab-content">
                            {activeTab === 'details' && (
                                <div className="admin-details-content">
                                    <div className="admin-info-grid">
                                        <div className="admin-info-card">
                                            <h3>
                                                <i className="fas fa-info-circle"></i>
                                                Variant Information
                                            </h3>
                                            <div className="admin-info-details">
                                                <div className="admin-info-row">
                                                    <span className="admin-info-label">SKU:</span>
                                                    <span className="admin-info-value">{selectedVariant.sku}</span>
                                                </div>
                                                <div className="admin-info-row">
                                                    <span className="admin-info-label">Variant Name:</span>
                                                    <span className="admin-info-value">{selectedVariant.variant_name || 'N/A'}</span>
                                                </div>
                                                <div className="admin-info-row">
                                                    <span className="admin-info-label">Created:</span>
                                                    <span className="admin-info-value">
                                                        {new Date(selectedVariant.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="admin-info-row">
                                                    <span className="admin-info-label">Last Updated:</span>
                                                    <span className="admin-info-value">
                                                        {selectedVariant.updated_at ?
                                                            new Date(selectedVariant.updated_at).toLocaleDateString() :
                                                            'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="admin-info-card">
                                            <h3>
                                                <i className="fas fa-tags"></i>
                                                Pricing & Stock
                                            </h3>
                                            <div className="admin-info-details">
                                                <div className="admin-info-row">
                                                    <span className="admin-info-label">Price:</span>
                                                    <span className="admin-info-value">${selectedVariant.price}</span>
                                                </div>
                                                <div className="admin-info-row">
                                                    <span className="admin-info-label">Stock Quantity:</span>
                                                    <span className="admin-info-value">{selectedVariant.stock_quantity}</span>
                                                </div>
                                                <div className="admin-info-row">
                                                    <span className="admin-info-label">Discount Type:</span>
                                                    <span className="admin-info-value">
                                                        {selectedVariant.discount_type || 'None'}
                                                    </span>
                                                </div>
                                                <div className="admin-info-row">
                                                    <span className="admin-info-label">Discount Value:</span>
                                                    <span className="admin-info-value">
                                                        {selectedVariant.discount_value || '0'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-pd-stats">
                                        <h3>
                                            <i className="fas fa-layer-group"></i>
                                            Attributes
                                        </h3>
                                        <div className="admin-vd-attributes-grid">
                                            <div className="admin-vd-attribute-item">
                                                <label>Color</label>
                                                <span>{selectedVariant.color || 'N/A'}</span>
                                            </div>
                                            <div className="admin-vd-attribute-item">
                                                <label>Size</label>
                                                <span>{selectedVariant.size || 'N/A'}</span>
                                            </div>
                                            <div className="admin-vd-attribute-item">
                                                <label>Weight</label>
                                                <span>{selectedVariant.weight || 'N/A'}</span>
                                            </div>
                                            <div className="admin-vd-attribute-item">
                                                <label>Dimensions</label>
                                                <span>{selectedVariant.dimensions || 'N/A'}</span>
                                            </div>
                                            <div className="admin-vd-attribute-item">
                                                <label>Material</label>
                                                <span>{selectedVariant.material || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'media' && (
                                <div className="admin-media-content">
                                    <MediaManager variantId={variantId} />
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="admin-reviews-content">
                                    <ReviewManager variantId={variantId} />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {showDeleteModal && (
                <ActionModal
                    title="Delete Variant"
                    message={`Are you sure you want to delete this variant (${selectedVariant.sku})? This action cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteModal(false)}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />
            )}
        </div>
    );
};

// Main component that wraps with VariantProvider
const VariantDetails = () => {
    return (
        <VariantProvider>
            <VariantDetailsContent />
        </VariantProvider>
    );
};

export default VariantDetails;