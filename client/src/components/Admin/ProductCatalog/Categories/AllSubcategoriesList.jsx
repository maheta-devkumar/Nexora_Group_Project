import React, { useState, useEffect, useCallback } from 'react';
import { useCategoryContext } from '../../../../context/CategoryContext';
import './AllSubcategoriesList.css';

const AllSubcategoriesList = ({ onEdit, onDelete }) => {
    const { 
        fetchAllSubcategories, 
        allSubcategories, 
        loading, 
        error,
        deleteSubcategory,
        refreshAllData
    } = useCategoryContext();
    
    const [groupedSubcategories, setGroupedSubcategories] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAllSubcategories();
    }, [fetchAllSubcategories]);

    // Group subcategories by category when data loads
    useEffect(() => {
        if (Array.isArray(allSubcategories) && allSubcategories.length > 0) {
            const grouped = {};
            
            // First, group by category
            allSubcategories.forEach(sub => {
                if (!sub || !sub.category_id) return;
                
                const categoryId = sub.category_id;
                if (!grouped[categoryId]) {
                    grouped[categoryId] = {
                        category_id: categoryId,
                        category_name: sub.category_name || `Category ${categoryId}`,
                        subcategories: []
                    };
                }
                grouped[categoryId].subcategories.push(sub);
            });
            
            // Sort categories by name
            const sortedGrouped = {};
            Object.keys(grouped)
                .sort((a, b) => grouped[a].category_name.localeCompare(grouped[b].category_name))
                .forEach(key => {
                    sortedGrouped[key] = grouped[key];
                });
            
            setGroupedSubcategories(sortedGrouped);
            
            // Auto-expand all categories initially
            const expanded = {};
            Object.keys(sortedGrouped).forEach(categoryId => {
                expanded[categoryId] = true;
            });
            setExpandedCategories(expanded);
        } else {
            setGroupedSubcategories({});
            setExpandedCategories({});
        }
    }, [allSubcategories]);

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const expandAll = () => {
        const expanded = {};
        Object.keys(groupedSubcategories).forEach(categoryId => {
            expanded[categoryId] = true;
        });
        setExpandedCategories(expanded);
    };

    const collapseAll = () => {
        setExpandedCategories({});
    };

    const handleDelete = async (subcategoryId, subcategoryName) => {
        if (window.confirm(`Are you sure you want to delete "${subcategoryName}"?`)) {
            try {
                const result = await deleteSubcategory(subcategoryId);
                if (result) {
                    alert('Subcategory deleted successfully!');
                    refreshAllData();
                }
            } catch (err) {
                alert(`Failed to delete subcategory: ${err.message || 'Unknown error'}`);
            }
        }
    };

    const getFilteredData = useCallback(() => {
        if (!searchTerm || !Object.keys(groupedSubcategories).length) {
            return groupedSubcategories;
        }

        const filtered = {};
        const searchLower = searchTerm.toLowerCase();
        
        Object.keys(groupedSubcategories).forEach(categoryId => {
            const category = groupedSubcategories[categoryId];
            
            // Filter subcategories within this category
            const filteredSubs = category.subcategories.filter(sub => 
                sub &&
                (
                    (sub.sub_category_name && sub.sub_category_name.toLowerCase().includes(searchLower)) ||
                    (sub.description && sub.description.toLowerCase().includes(searchLower)) ||
                    (category.category_name && category.category_name.toLowerCase().includes(searchLower))
                )
            );

            if (filteredSubs.length > 0) {
                filtered[categoryId] = {
                    ...category,
                    subcategories: filteredSubs
                };
            }
        });

        return filtered;
    }, [groupedSubcategories, searchTerm]);

    const filteredData = getFilteredData();
    const totalSubcategories = Array.isArray(allSubcategories) ? allSubcategories.length : 0;
    const categoryCount = Object.keys(groupedSubcategories).length;

    if (loading) {
        return (
            <div className="all-subcategories-loading">
                <div className="loading-spinner"></div>
                <p>Loading subcategories...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="all-subcategories-error">
                <i className="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Subcategories</h3>
                <p>{typeof error === 'string' ? error : 'An error occurred'}</p>
                <button 
                    className="retry-btn"
                    onClick={fetchAllSubcategories}
                >
                    <i className="fas fa-redo"></i>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="all-subcategories-container">
            <div className="all-subcategories-header">
                <div className="header-content">
                    <h2>
                        <i className="fas fa-folder-open"></i>
                        All Subcategories
                    </h2>
                    <div className="header-stats">
                        <span className="stat-badge">
                            <i className="fas fa-sitemap"></i>
                            {categoryCount} Categories
                        </span>
                        <span className="stat-badge">
                            <i className="fas fa-folder"></i>
                            {totalSubcategories} Subcategories
                        </span>
                    </div>
                </div>
                
                <div className="header-controls">
                    <div className="search-container">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search subcategories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            {searchTerm && (
                                <button 
                                    className="clear-search-btn"
                                    onClick={() => setSearchTerm('')}
                                    title="Clear search"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="view-controls">
                        <button 
                            className="control-btn expand-all-btn"
                            onClick={expandAll}
                            disabled={categoryCount === 0}
                            title="Expand All Categories"
                        >
                            <i className="fas fa-expand-alt"></i>
                            Expand All
                        </button>
                        <button 
                            className="control-btn collapse-all-btn"
                            onClick={collapseAll}
                            disabled={categoryCount === 0}
                            title="Collapse All Categories"
                        >
                            <i className="fas fa-compress-alt"></i>
                            Collapse All
                        </button>
                    </div>
                </div>
            </div>

            {totalSubcategories === 0 ? (
                <div className="all-subcategories-empty">
                    <div className="empty-icon">
                        <i className="fas fa-folder-open"></i>
                    </div>
                    <h3>No Subcategories Found</h3>
                    <p>There are no subcategories in the system yet.</p>
                    <p className="empty-hint">Create subcategories through the Categories section.</p>
                </div>
            ) : Object.keys(filteredData).length === 0 ? (
                <div className="all-subcategories-empty">
                    <div className="empty-icon">
                        <i className="fas fa-search"></i>
                    </div>
                    <h3>No Matching Subcategories</h3>
                    <p>No subcategories found matching "{searchTerm}"</p>
                    <button 
                        className="clear-search-btn-large"
                        onClick={() => setSearchTerm('')}
                    >
                        Clear Search
                    </button>
                </div>
            ) : (
                <div className="categories-container">
                    {Object.keys(filteredData).map(categoryId => {
                        const category = filteredData[categoryId];
                        const isExpanded = expandedCategories[categoryId];
                        const subCount = category.subcategories.length;
                        
                        return (
                            <div key={categoryId} className="category-card">
                                <div 
                                    className="category-header"
                                    onClick={() => toggleCategory(categoryId)}
                                >
                                    <div className="category-title">
                                        <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} category-chevron`}></i>
                                        <div className="category-name-container">
                                            <span className="category-name">{category.category_name}</span>
                                            <span className="subcategory-count">
                                                {subCount} subcategor{subCount === 1 ? 'y' : 'ies'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="category-actions">
                                        <button 
                                            className="action-btn view-category-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle category view
                                            }}
                                            title="View Category Details"
                                        >
                                            <i className="fas fa-eye"></i>
                                            View
                                        </button>
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="subcategories-container">
                                        <div className="subcategories-grid">
                                            {category.subcategories.map(subcategory => (
                                                <div key={subcategory.sub_category_id} className="subcategory-card">
                                                    <div className="subcategory-header">
                                                        <div className="subcategory-icon">
                                                            <i className="fas fa-folder"></i>
                                                        </div>
                                                        <div className="subcategory-info">
                                                            <h4 className="subcategory-name">
                                                                {subcategory.sub_category_name || 'Unnamed Subcategory'}
                                                            </h4>
                                                            <div className="subcategory-id">
                                                                ID: {subcategory.sub_category_id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {subcategory.description && (
                                                        <div className="subcategory-description">
                                                            <i className="fas fa-align-left description-icon"></i>
                                                            <p>{subcategory.description}</p>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="subcategory-footer">
                                                        <div className="subcategory-parent">
                                                            <i className="fas fa-level-up-alt"></i>
                                                            <span>Parent: {category.category_name}</span>
                                                        </div>
                                                        <div className="subcategory-actions">
                                                            <button 
                                                                className="action-btn edit-btn"
                                                                onClick={() => onEdit && onEdit(subcategory.sub_category_id)}
                                                                title="Edit Subcategory"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                                Edit
                                                            </button>
                                                            <button 
                                                                className="action-btn delete-btn"
                                                                onClick={() => handleDelete(
                                                                    subcategory.sub_category_id,
                                                                    subcategory.sub_category_name
                                                                )}
                                                                title="Delete Subcategory"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AllSubcategoriesList;