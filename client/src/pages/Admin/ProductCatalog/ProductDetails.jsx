import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProductContext } from '../../../context/ProductContext';
import { VariantProvider } from '../../../context/VariantContext';
import VariantList from '../../../components/Admin/ProductCatalog/Products/VariantList';
import DetailsTabs from '../../../components/Admin/ProductCatalog/Products/DetailsTabs';
import ActionModal from '../../../components/Admin/ProductCatalog/Products/ActionModal';
import ProductForm from '../../../components/Admin/ProductCatalog/Products/ProductForm';
import './ProductDetails.css';

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const {
        currentProduct,
        fetchProductById,
        deleteProduct,
        refreshCurrentProduct
    } = useProductContext();

    const [activeTab, setActiveTab] = useState('summary');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchProductById(productId);
            setLoading(false);
        };

        if (productId) {
            loadData();
        }
    }, [productId, fetchProductById]);

    const handleEdit = () => {
        setEditingProduct(currentProduct);
        setShowEditForm(true);
    };

    const handleDelete = async () => {
        const result = await deleteProduct(productId);
        if (result) {
            navigate('/admin/products');
        }
        setShowDeleteModal(false);
    };

    const handleVariantClick = (variantId) => {
        navigate(`/admin/products/${productId}/variants/${variantId}`);
    };

    const handleFormSuccess = async () => {
        setShowEditForm(false);
        setEditingProduct(null);
        // Refresh the current product data
        if (productId) {
            await fetchProductById(productId);
        }
    };

    const handleFormCancel = () => {
        setShowEditForm(false);
        setEditingProduct(null);
    };

    const tabs = [
        { id: 'summary', label: 'Summary' },
        { id: 'variants', label: 'Variants' }
    ];

    if (loading) {
        return <div className="admin-pd-loading">Loading product details...</div>;
    }

    if (!currentProduct) {
        return <div className="admin-pd-not-found">Product not found</div>;
    }

    return (
        <VariantProvider>
            <div className="admin-product-details-page">
                <div className="admin-pd-header">
                    <div className="admin-breadcrumb">
                        <Link to="/admin/products" className="admin-breadcrumb-link">
                            <i className="fas fa-arrow-left"></i>
                            Back to Products
                        </Link>
                        <span className="admin-breadcrumb-separator">/</span>
                        <span className="admin-breadcrumb-current">{currentProduct.product_name}</span>
                    </div>

                    <div className="admin-pd-actions">
                        <button
                            className="admin-btn-action admin-btn-edit"
                            onClick={handleEdit}
                            disabled={showEditForm || loading}
                        >
                            <i className="fas fa-edit"></i>
                            Edit Product
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

                <div className="admin-pd-content">
                    {showEditForm && (
                        <div className="admin-edit-form-section">
                            <ProductForm
                                mode="edit"
                                product={editingProduct}
                                onSuccess={handleFormSuccess}
                                onCancel={handleFormCancel}
                            />
                        </div>
                    )}

                    {!showEditForm && (
                        <>
                            <div className="admin-pd-basic-info">
                                <h1 className="admin-pd-title">{currentProduct.product_name}</h1>
                                <div className="admin-pd-meta">
                                    <span className="admin-pd-meta-item">
                                        <strong>ID:</strong> #{currentProduct.product_id}
                                    </span>
                                    <span className="admin-pd-meta-item">
                                        <strong>Brand:</strong> {currentProduct.brand?.brand_name || 'N/A'}
                                    </span>
                                    <span className="admin-pd-meta-item">
                                        <strong>Category:</strong> {currentProduct.sub_category?.category_name || 'N/A'}
                                    </span>
                                    <span className={`admin-pd-status admin-status-${currentProduct.status || 'active'}`}>
                                        {currentProduct.status || 'active'}
                                    </span>
                                </div>
                            </div>

                            <DetailsTabs
                                tabs={tabs}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                            />

                            <div className="admin-tab-content">
                                {activeTab === 'summary' && (
                                    <div className="admin-summary-content">
                                        <div className="admin-info-grid">
                                            <div className="admin-info-card">
                                                <h3>
                                                    <i className="fas fa-info-circle"></i>
                                                    Product Information
                                                </h3>
                                                <div className="admin-info-details">
                                                    <div className="admin-info-row">
                                                        <span className="admin-info-label">SKU Prefix:</span>
                                                        <span className="admin-info-value">{currentProduct.sku_prefix || 'N/A'}</span>
                                                    </div>
                                                    <div className="admin-info-row">
                                                        <span className="admin-info-label">Created:</span>
                                                        <span className="admin-info-value">
                                                            {new Date(currentProduct.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="admin-info-row">
                                                        <span className="admin-info-label">Last Updated:</span>
                                                        <span className="admin-info-value">
                                                            {currentProduct.updated_at ?
                                                                new Date(currentProduct.updated_at).toLocaleDateString() :
                                                                'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="admin-info-card">
                                                <h3>
                                                    <i className="fas fa-align-left"></i>
                                                    Description
                                                </h3>
                                                <p className="admin-pd-description">
                                                    {currentProduct.description || 'No description provided.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="admin-pd-stats">
                                            <h3>
                                                <i className="fas fa-chart-bar"></i>
                                                Product Statistics
                                            </h3>
                                            <div className="admin-stats-grid">
                                                <div className="admin-stat-card">
                                                    <div className="admin-stat-icon">
                                                        <i className="fas fa-layer-group"></i>
                                                    </div>
                                                    <div className="admin-stat-content">
                                                        <span className="admin-stat-label">Total Variants</span>
                                                        <span className="admin-stat-value">
                                                            {currentProduct.variants?.length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="admin-stat-card">
                                                    <div className="admin-stat-icon">
                                                        <i className="fas fa-box"></i>
                                                    </div>
                                                    <div className="admin-stat-content">
                                                        <span className="admin-stat-label">Total Stock</span>
                                                        <span className="admin-stat-value">
                                                            {currentProduct.total_stock || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="admin-stat-card">
                                                    <div className="admin-stat-icon">
                                                        <i className="fas fa-calendar"></i>
                                                    </div>
                                                    <div className="admin-stat-content">
                                                        <span className="admin-stat-label">Created</span>
                                                        <span className="admin-stat-value">
                                                            {new Date(currentProduct.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'variants' && (
                                    <div className="admin-variants-content">
                                        <div className="admin-variants-header">
                                            <h3>
                                                <i className="fas fa-boxes"></i>
                                                Product Variants
                                            </h3>
                                        </div>
                                        <VariantList
                                            productId={productId}
                                            onVariantClick={handleVariantClick}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <ActionModal
                        title="Delete Product"
                        message={`Are you sure you want to delete "${currentProduct.product_name}"? This action cannot be undone.`}
                        onConfirm={handleDelete}
                        onCancel={() => setShowDeleteModal(false)}
                        confirmText="Delete"
                        cancelText="Cancel"
                        type="danger"
                    />
                )}
            </div>
        </VariantProvider>
    );
};

export default ProductDetails;