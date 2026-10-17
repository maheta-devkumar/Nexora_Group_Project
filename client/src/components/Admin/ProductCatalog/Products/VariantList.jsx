import React, { useEffect, useState } from 'react';
import { useVariant } from '../../../../context/VariantContext';
import VariantCard from './VariantCard';
import VariantForm from './VariantForm';
import './VariantList.css';

const VariantList = ({ productId, onVariantClick }) => {
    const {
        variants,
        loading,
        error,
        fetchVariants,
        clearError,
        pagination
    } = useVariant();

    const [currentPage, setCurrentPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'

    useEffect(() => {
        if (productId) {
            fetchVariants(currentPage, 20, productId);
        }
    }, [currentPage, productId, fetchVariants]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleAddVariant = () => {
        setEditingVariant(null);
        setFormMode('add');
        setShowForm(true);
    };

    const handleEditVariant = (variant) => {
        setEditingVariant(variant);
        setFormMode('edit');
        setShowForm(true);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingVariant(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingVariant(null);
        if (productId) {
            fetchVariants(currentPage, 20, productId);
        }
    };

    const renderError = () => {
        if (!error) return null;

        let errorMessage = '';
        if (typeof error === 'string') {
            errorMessage = error;
        } else if (typeof error === 'object') {
            if (error.message) errorMessage = error.message;
            else if (error.msg) errorMessage = error.msg;
            else if (error.detail) errorMessage = error.detail;
            else errorMessage = JSON.stringify(error);
        }

        return (
            <div className="admin-vl-error-container">
                <strong>Error:</strong> {errorMessage}
                <button onClick={clearError} className="admin-vl-dismiss-error-btn">
                    Dismiss
                </button>
            </div>
        );
    };

    return (
        <div className="admin-variant-list-container">
            <div className="admin-variant-list-header">
                <h3 className="admin-variant-list-title">Product Variants ({variants.length} items)</h3>
                <button
                    className="admin-btn-add-variant"
                    onClick={handleAddVariant}
                    disabled={showForm || loading}
                >
                    {showForm ? 'Adding Variant...' : '+ Add Variant'}
                </button>
            </div>

            {renderError()}

            {showForm && (
                <VariantForm
                    mode={formMode}
                    productId={productId}
                    variant={editingVariant}
                    onCancel={handleCancelForm}
                    onSuccess={handleFormSuccess}
                />
            )}

            {loading ? (
                <div className="admin-vl-loading-container">
                    <p>Loading variants...</p>
                </div>
            ) : variants.length === 0 ? (
                <div className="admin-vl-empty-state">
                    {showForm ? '' : 'No variants found. Add your first variant.'}
                </div>
            ) : (
                <>
                    <div className="admin-vl-grid">
                        {variants.map(variant => (
                            <VariantCard
                                key={variant.variant_id}
                                variant={variant}
                                productId={productId}
                                onViewDetails={() => onVariantClick(variant.variant_id)}
                                onEdit={() => handleEditVariant(variant)}
                            />
                        ))}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="admin-vl-pagination-container">
                            <button
                                className="admin-vl-pagination-btn"
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                Previous
                            </button>

                            <span className="admin-vl-pagination-info">
                                Page {currentPage} of {pagination.totalPages}
                            </span>

                            <button
                                className="admin-vl-pagination-btn"
                                disabled={currentPage === pagination.totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default VariantList;