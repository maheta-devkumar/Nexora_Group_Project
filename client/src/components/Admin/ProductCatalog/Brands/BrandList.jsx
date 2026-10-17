import React, { useState, useEffect } from 'react';
import { useBrandContext } from '../../../../context/BrandContext';

const BrandList = ({ onEdit }) => {
    const { brands, loading, error, fetchBrands, deleteBrand } = useBrandContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const handleDeleteBrand = async (brandId, brandName) => {
        if (window.confirm(`Are you sure you want to delete "${brandName}"? This will affect all products under this brand.`)) {
            await deleteBrand(brandId);
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const filteredBrands = brands.filter(brand =>
        brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sortedBrands = [...filteredBrands].sort((a, b) => {
        const aValue = sortBy === 'name' ? a.brand_name : a.brand_id;
        const bValue = sortBy === 'name' ? b.brand_name : b.brand_id;

        if (typeof aValue === 'string') {
            return sortOrder === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        } else {
            return sortOrder === 'asc'
                ? aValue - bValue
                : bValue - aValue;
        }
    });

    return (
        <div className="admin-brand-list">
            <div className="admin-list-header">
                <div className="admin-search-controls">
                    <div className="admin-search-box">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="admin-search-input"
                        />
                        {searchTerm && (
                            <button
                                className="admin-clear-search"
                                onClick={() => setSearchTerm('')}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>

                    <div className="admin-sort-controls">
                        <span className="admin-sort-label">Sort by:</span>
                        <div className="admin-sort-buttons">
                            <button
                                className={`admin-sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                                onClick={() => handleSort('name')}
                            >
                                Name {sortBy === 'name' && (
                                    <i className={`fas fa-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="admin-stats-summary">
                    <div className="admin-stat-item">
                        <i className="fas fa-tag"></i>
                        <span className="admin-stat-value">{brands.length}</span>
                        <span className="admin-stat-label">Total Brands</span>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="admin-loading-state">
                    <div className="admin-loading-spinner"></div>
                    <p>Loading brands...</p>
                </div>
            )}

            {error && (
                <div className="admin-error-state">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{error}</span>
                    <button onClick={fetchBrands} className="admin-retry-btn">
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (
                <>
                    {sortedBrands.length > 0 ? (
                        <div className="admin-brands-table-container">
                            <table className="admin-brands-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Brand Name</th>
                                        <th>Description</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedBrands.map((brand) => (
                                        <tr key={brand.brand_id}>
                                            <td>{brand.brand_id}</td>
                                            <td>
                                                <div className="admin-brand-name-cell">
                                                    <div className="admin-brand-icon-wrapper">
                                                        <i className="fas fa-tag"></i>
                                                    </div>
                                                    <strong>{brand.brand_name}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="admin-brand-description">
                                                    {brand.description || 'No description'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="admin-action-buttons">
                                                    <button
                                                        className="admin-action-btn edit"
                                                        onClick={() => onEdit(brand)}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="admin-action-btn delete"
                                                        onClick={() => handleDeleteBrand(brand.brand_id, brand.brand_name)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="admin-empty-state">
                            <div className="admin-empty-icon">
                                <i className="fas fa-tags"></i>
                            </div>
                            <h3>No Brands Found</h3>
                            <p>{searchTerm ? 'No brands match your search.' : 'Start by creating your first brand.'}</p>
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="admin-clear-search-btn">
                                    Clear Search
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BrandList;