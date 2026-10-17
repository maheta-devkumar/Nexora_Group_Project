import React, { useState, useEffect } from 'react';
import { CategoryProvider } from '../../../context/CategoryContext';
import CategoryList from '../../../components/Admin/ProductCatalog/Categories/CategoryList';
import CategoryForm from '../../../components/Admin/ProductCatalog/Categories/CategoryForm';
import CategoryTree from '../../../components/Admin/ProductCatalog/Categories/CategoryTree';
import SubcategoryForm from '../../../components/Admin/ProductCatalog/Categories/SubcategoryForm';
import AllSubcategoriesList from '../../../components/Admin/ProductCatalog/Categories/AllSubcategoriesList'; // ADDED IMPORT
import './Categories.css';

const CategoriesPage = () => {
    const [activeView, setActiveView] = useState('list');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);

    const handleAddCategory = () => {
        setSelectedCategory(null);
        setShowCategoryForm(true);
    };

    const handleEditCategory = (categoryId) => {
        setSelectedCategory(categoryId);
        setShowCategoryForm(true);
    };

    const handleAddSubcategory = (categoryId, subcategoryId = null) => {
        setSelectedCategory(categoryId);
        setSelectedSubcategory(subcategoryId);
        setShowSubcategoryForm(true);
    };

    const handleFormSuccess = (result) => {
        setShowCategoryForm(false);
        setShowSubcategoryForm(false);
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        alert(`Operation completed successfully!`);
    };

    const handleFormCancel = () => {
        setShowCategoryForm(false);
        setShowSubcategoryForm(false);
        setSelectedCategory(null);
        setSelectedSubcategory(null);
    };

    // Handle escape key to close modals
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (showCategoryForm || showSubcategoryForm) {
                    handleFormCancel();
                }
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showCategoryForm, showSubcategoryForm]);

    return (
        <CategoryProvider>
            <div className="admin-categories-page">
                <div className="admin-categories-header">
                    <div className="admin-categories-header-content">
                        <h1 className="admin-categories-title">
                            <i className="fas fa-folder"></i>
                            Categories Management
                        </h1>
                        <p className="admin-categories-subtitle">
                            Organize products into categories and subcategories
                        </p>
                    </div>
                    <div className="admin-categories-actions">
                        <button className="admin-btn-primary" onClick={handleAddCategory}>
                            <i className="fas fa-plus"></i>
                            Add Category
                        </button>
                    </div>
                </div>

                <div className="admin-categories-tabs">
                    <button
                        className={`admin-view-tab ${activeView === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveView('list')}
                    >
                        <i className="fas fa-list"></i>
                        List View
                    </button>
                    <button
                        className={`admin-view-tab ${activeView === 'tree' ? 'active' : ''}`}
                        onClick={() => setActiveView('tree')}
                    >
                        <i className="fas fa-sitemap"></i>
                        Tree View
                    </button>
                    <button
                        className={`admin-view-tab ${activeView === 'all-subs' ? 'active' : ''}`}
                        onClick={() => setActiveView('all-subs')}
                    >
                        <i className="fas fa-folder-open"></i>
                        All Subcategories
                    </button>
                </div>

                <div className="admin-categories-content">
                    {activeView === 'list' && (
                        <div className="admin-view-content active">
                            <CategoryList
                                onEdit={handleEditCategory}
                                onAddSubcategory={handleAddSubcategory}
                            />
                        </div>
                    )}

                    {activeView === 'tree' && (
                        <div className="admin-view-content">
                            <CategoryTree
                                onCategorySelect={handleEditCategory}
                                onAddSubcategory={handleAddSubcategory}
                            />
                        </div>
                    )}

                    {activeView === 'all-subs' && (
                        <div className="admin-view-content">
                            <AllSubcategoriesList
                                onEdit={(categoryId, subcategoryId = null) => {
                                    if (subcategoryId) {
                                        // If subcategoryId is provided, open subcategory form for editing
                                        handleAddSubcategory(categoryId, subcategoryId);
                                    } else {
                                        // If only categoryId, open category form for editing
                                        handleEditCategory(categoryId);
                                    }
                                }}
                                onDelete={(subcategoryId, categoryId) => {
                                    // You can add a delete confirmation here
                                    console.log(`Delete subcategory ${subcategoryId} from category ${categoryId}`);
                                }}
                            />
                        </div>
                    )}
                </div>

                {showCategoryForm && (
                    <div className="admin-modal-overlay" onClick={handleFormCancel}>
                        <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                            <CategoryForm
                                categoryId={selectedCategory}
                                onSuccess={handleFormSuccess}
                                onCancel={handleFormCancel}
                            />
                        </div>
                    </div>
                )}

                {showSubcategoryForm && (
                    <div className="admin-modal-overlay" onClick={handleFormCancel}>
                        <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                            <SubcategoryForm
                                categoryId={selectedCategory}
                                subcategoryId={selectedSubcategory}
                                onSuccess={handleFormSuccess}
                                onCancel={handleFormCancel}
                            />
                        </div>
                    </div>
                )}
            </div>
        </CategoryProvider>
    );
};

export default CategoriesPage;