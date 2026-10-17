import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ProductList from '../../../components/Admin/ProductCatalog/Products/ProductList';
import ProductForm from '../../../components/Admin/ProductCatalog/Products/ProductForm';
import ProductDetails from './ProductDetails';
import VariantDetails from './VariantDetails';
import { useProductContext } from '../../../context/ProductContext';
import './Products.css';

const Products = () => {
    const { fetchCategories, fetchBrands } = useProductContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formMode, setFormMode] = useState('add');

    console.log('📍 Products.jsx - Current location:', location.pathname);

    useEffect(() => {
        const fetchInitialData = async () => {
            await fetchCategories();
            await fetchBrands();
        };
        fetchInitialData();
    }, [fetchCategories, fetchBrands]);

    const handleViewDetails = (productId) => {
        console.log('📍 Products.jsx - Navigating to product:', productId);
        navigate(`/admin/products/${productId}`);
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setFormMode('add');
        setShowProductForm(true);
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setFormMode('edit');
        setShowProductForm(true);
    };

    const handleFormSuccess = () => {
        setShowProductForm(false);
        setEditingProduct(null);
        // If you want to stay on the same page and refresh the list
        // You can add a refresh callback or use context to refresh products
    };

    const handleFormCancel = () => {
        setShowProductForm(false);
        setEditingProduct(null);
    };

    return (
        <div className="admin-products-page">
            {/* Add Product Form Modal */}
            {showProductForm && (
                <div className="admin-modal-overlay" onClick={handleFormCancel}>
                    <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                        {/* Wrapper for consistent modal padding/spacing if needed */}
                        <ProductForm
                            mode={formMode}
                            product={editingProduct}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </div>
                </div>
            )}

            <Routes>
                <Route
                    path="/"
                    element={
                        <ProductList
                            onViewDetails={handleViewDetails}
                            onAddProduct={handleAddProduct}
                            onEditProduct={handleEditProduct}
                        />
                    }
                />
                <Route path="/:productId" element={<ProductDetails />} />
                <Route path="/:productId/variants/:variantId" element={<VariantDetails />} />
            </Routes>
        </div>
    );
};

export default Products;