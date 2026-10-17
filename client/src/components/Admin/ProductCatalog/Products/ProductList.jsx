import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductContext } from '../../../../context/ProductContext';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import ProductForm from './ProductForm';
import './ProductList.css';

const ProductList = ({ onViewDetails, onEditProduct }) => {
    const {
        products,
        loading,
        error,
        fetchProducts,
        clearError,
        pagination
    } = useProductContext();

    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        search: '',
        category_id: '',
        brand_id: '',
        status: '',
        sort_by: 'created_at',
        sort_order: 'desc'
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formMode, setFormMode] = useState('add');

    useEffect(() => {
        fetchProducts({ ...filters, page: currentPage });
    }, [filters, currentPage, fetchProducts]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setFormMode('add');
        setShowForm(true);
    };

    const handleEditProductWrapper = (product) => {
        setEditingProduct(product);
        setFormMode('edit');
        setShowForm(true);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingProduct(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingProduct(null);
        fetchProducts({ ...filters, page: currentPage });
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
            <div className="error-container">
                <strong>Error:</strong> {errorMessage}
                <button onClick={clearError} className="dismiss-error-btn">
                    Dismiss
                </button>
            </div>
        );
    };

    return (
        <div className="admin-product-list-container">
            <div className="admin-product-list-header">
                <h1 className="admin-product-list-title">Products ({products.length} items)</h1>
                <button
                    className={`admin-btn-add-product ${showForm || loading ? 'admin-btn-disabled' : ''}`}
                    onClick={handleAddProduct}
                    disabled={showForm || loading}
                >
                    {showForm ? 'Adding...' : '+ Add Product'}
                </button>
            </div>

            {renderError()}

            <ProductFilters
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            {showForm && (
                <div className="admin-form-section">
                    <ProductForm
                        mode={formMode}
                        product={editingProduct}
                        onCancel={handleCancelForm}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            )}

            {loading ? (
                <div className="admin-loading-container">
                    <p>Loading products...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="admin-empty-state">
                    {showForm ? '' : 'No products found. Add your first product.'}
                </div>
            ) : (
                <>
                    <div className="admin-product-grid">
                        {products.map(product => (
                            <ProductCard
                                key={product.product_id}
                                product={product}
                                onEdit={() => handleEditProductWrapper(product)}
                                onViewDetails={() => onViewDetails(product.product_id)}
                            />
                        ))}
                    </div>

                    {pagination.total_pages > 1 && (
                        <div className="admin-pagination-container">
                            <button
                                className={`admin-pagination-btn ${currentPage === 1 ? 'admin-btn-disabled' : ''}`}
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                Previous
                            </button>

                            <span className="admin-pagination-info">
                                Page {currentPage} of {pagination.total_pages}
                            </span>

                            <button
                                className={`admin-pagination-btn ${currentPage === pagination.total_pages ? 'admin-btn-disabled' : ''}`}
                                disabled={currentPage === pagination.total_pages}
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

export default ProductList;