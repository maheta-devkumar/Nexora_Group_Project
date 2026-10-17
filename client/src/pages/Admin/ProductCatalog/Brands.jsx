import React, { useState } from 'react';
import { BrandProvider } from '../../../context/BrandContext';
import BrandList from '../../../components/Admin/ProductCatalog/Brands/BrandList';
import BrandForm from '../../../components/Admin/ProductCatalog/Brands/BrandForm';
import BrandAnalytics from '../../../components/Admin/ProductCatalog/Brands/BrandAnalytics';
import './Brands.css';

const BrandsPage = () => {
    const [activeView, setActiveView] = useState('list');
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [showBrandForm, setShowBrandForm] = useState(false);

    const handleAddBrand = () => {
        setSelectedBrand(null);
        setShowBrandForm(true);
    };


    const handleEditBrand = (brand) => {
        setSelectedBrand(brand);
        setShowBrandForm(true);
    };

    const handleFormSuccess = () => {
        setShowBrandForm(false);
        setSelectedBrand(null);
    };

    const handleFormCancel = () => {
        setShowBrandForm(false);
        setSelectedBrand(null);
    };

    return (
        <BrandProvider>
            <div className="admin-brands-page">
                <div className="admin-brands-header">
                    <div className="admin-brands-header-content">
                        <h1 className="admin-brands-title">
                            <i className="fas fa-tag"></i>
                            Brands Management
                        </h1>
                        <p className="admin-brands-subtitle">
                            Manage product brands and their information
                        </p>
                    </div>
                    <div className="admin-brands-actions">
                        <button
                            className="admin-btn-primary"
                            onClick={handleAddBrand}
                        >
                            <i className="fas fa-plus"></i>
                            Add Brand
                        </button>
                    </div>
                </div>

                <div className="admin-brands-tabs">
                    <button
                        className={`admin-view-tab ${activeView === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveView('list')}
                    >
                        <i className="fas fa-list"></i>
                        Brands List
                    </button>
                    <button
                        className={`admin-view-tab ${activeView === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveView('analytics')}
                    >
                        <i className="fas fa-chart-pie"></i>
                        Brand Analytics
                    </button>
                </div>

                <div className="admin-brands-content">
                    {/* Always render both components, hide inactive ones with CSS */}
                    <div className={`admin-view-content ${activeView === 'list' ? 'active' : 'inactive'}`}>
                        <BrandList onEdit={handleEditBrand} />
                    </div>

                    <div className={`admin-view-content ${activeView === 'analytics' ? 'active' : 'inactive'}`}>
                        <BrandAnalytics key="analytics" /> {/* Add key to force remount */}
                    </div>
                </div>

                {showBrandForm && (
                    <div className="admin-modal-overlay" onClick={handleFormCancel}>
                        <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                            <BrandForm
                                brand={selectedBrand}
                                onSuccess={handleFormSuccess}
                                onCancel={handleFormCancel}
                            />
                        </div>
                    </div>
                )}
            </div>
        </BrandProvider>
    );
};

export default BrandsPage;