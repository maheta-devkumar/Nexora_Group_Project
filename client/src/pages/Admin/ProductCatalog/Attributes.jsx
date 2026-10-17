// pages/Admin/ProductCatalog/Attributes.jsx
import React, { useState, useEffect } from 'react';
import { useAttributes } from '../../../context/AttributeContext';
import AttributeList from '../../../components/Admin/ProductCatalog/Attributes/AttributeList';
import AttributeForm from '../../../components/Admin/ProductCatalog/Attributes/AttributeForm';
import AttributeUsage from '../../../components/Admin/ProductCatalog/Attributes/AttributeUsage';
import './Attributes.css';

const AttributesPage = () => {
    const { fetchAttributes, error, clearError } = useAttributes();
    const [activeView, setActiveView] = useState('list');
    const [selectedAttribute, setSelectedAttribute] = useState(null);
    const [showAttributeForm, setShowAttributeForm] = useState(false);
    
    useEffect(() => {
        fetchAttributes();
    }, [fetchAttributes]);

    const handleAddAttribute = () => {
        setSelectedAttribute(null);
        setShowAttributeForm(true);
        clearError();
    };
    
    const handleEditAttribute = (attributeId) => {
        setSelectedAttribute(attributeId);
        setShowAttributeForm(true);
        clearError();
    };
    
    const handleFormSuccess = () => {
        setShowAttributeForm(false);
        setSelectedAttribute(null);
        fetchAttributes();
    };
    
    const handleFormCancel = () => {
        setShowAttributeForm(false);
        setSelectedAttribute(null);
        clearError();
    };

    const handleViewChange = (view) => {
        setActiveView(view);
        clearError();
    };

    return (
        <div className="admin-attributes-page">
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">
                        <i className="fas fa-list-alt"></i>
                        Attributes Management
                    </h1>
                    <p className="page-subtitle">
                        Define and manage product attributes
                    </p>
                    {error && (
                        <div className="page-error">
                            <i className="fas fa-exclamation-circle"></i>
                            {error}
                            <button onClick={clearError} className="error-dismiss">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}
                </div>
                <div className="header-actions">
                    <button className="header-btn add-btn" onClick={handleAddAttribute}>
                        <i className="fas fa-plus"></i>
                        Add Attribute
                    </button>
                </div>
            </div>
            
            <div className="view-tabs">
                <button 
                    className={`view-tab ${activeView === 'list' ? 'active' : ''}`}
                    onClick={() => handleViewChange('list')}
                >
                    <i className="fas fa-list"></i>
                    Attributes List
                </button>
                <button 
                    className={`view-tab ${activeView === 'usage' ? 'active' : ''}`}
                    onClick={() => handleViewChange('usage')}
                >
                    <i className="fas fa-chart-line"></i>
                    Usage Analytics
                </button>
            </div>
            
            <div className="page-content">
                {activeView === 'list' && (
                    <div className="view-content active">
                        <AttributeList onEdit={handleEditAttribute} />
                    </div>
                )}
                
                {activeView === 'usage' && (
                    <div className="view-content active">
                        <AttributeUsage />
                    </div>
                )}
            </div>
            
            {showAttributeForm && (
                <div className="modal-overlay" onClick={handleFormCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <AttributeForm 
                            attributeId={selectedAttribute}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttributesPage;