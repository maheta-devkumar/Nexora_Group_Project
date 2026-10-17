import React, { useEffect, useState } from 'react';
import { useProductContext } from '../../../../context/ProductContext';
import './ProductFilters.css';

const ProductFilters = ({ filters, onFilterChange }) => {
    const { categories, brands } = useProductContext();
    const [localFilters, setLocalFilters] = useState(filters);
    const [flattenedCategories, setFlattenedCategories] = useState([]);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    useEffect(() => {
        // Flatten categories for dropdown when categories are loaded
        if (categories.length > 0) {
            const flattened = [];
            categories.forEach(category => {
                if (category.sub_categories && category.sub_categories.length > 0) {
                    category.sub_categories.forEach(subCategory => {
                        flattened.push({
                            ...subCategory,
                            category_name: category.category_name,
                            full_name: `${category.category_name} → ${subCategory.sub_category_name}`
                        });
                    });
                } else {
                    // If no subcategories, use category itself
                    flattened.push({
                        sub_category_id: category.category_id,
                        sub_category_name: category.category_name,
                        category_name: category.category_name,
                        full_name: category.category_name
                    });
                }
            });
            setFlattenedCategories(flattened);
        }
    }, [categories]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApply = () => {
        onFilterChange(localFilters);
    };

    const handleReset = () => {
        const resetFilters = {
            search: '',
            category_id: '',
            brand_id: '',
            status: '',
            sort_by: 'created_at',
            sort_order: 'desc'
        };
        setLocalFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    const getCategoryOptions = () => {
        const options = [{ value: '', label: 'All Categories' }];

        categories.forEach(category => {
            // Add main category option
            options.push({
                value: category.category_id,
                label: `📁 ${category.category_name}`
            });

            // Add subcategories as options
            if (category.sub_categories && category.sub_categories.length > 0) {
                category.sub_categories.forEach(subCategory => {
                    options.push({
                        value: subCategory.sub_category_id,
                        label: `   → ${subCategory.sub_category_name}`
                    });
                });
            }
        });

        return options;
    };

    return (
        <div className="admin-product-filters">
            <div className="admin-filters-header">
                <h3 className="admin-filters-title">Filters</h3>
            </div>

            <div className="admin-filters-grid">
                <div className="admin-filter-group">
                    <label htmlFor="search" className="admin-filter-label">
                        Search
                    </label>
                    <input
                        type="text"
                        id="search"
                        name="search"
                        value={localFilters.search}
                        onChange={handleChange}
                        className="admin-filter-input"
                        placeholder="Search products..."
                    />
                </div>

                <div className="admin-filter-group">
                    <label htmlFor="category_id" className="admin-filter-label">
                        Category
                    </label>
                    <select
                        id="category_id"
                        name="category_id"
                        value={localFilters.category_id}
                        onChange={handleChange}
                        className="admin-filter-select"
                    >
                        {getCategoryOptions().map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="admin-filter-group">
                    <label htmlFor="brand_id" className="admin-filter-label">
                        Brand
                    </label>
                    <select
                        id="brand_id"
                        name="brand_id"
                        value={localFilters.brand_id}
                        onChange={handleChange}
                        className="admin-filter-select"
                    >
                        <option value="">All Brands</option>
                        {brands.map((brand, index) => {
                            const brandId = brand.brand_id || `temp-brand-${index}`;
                            return (
                                <option
                                    key={`brand-${brandId}`}
                                    value={brand.brand_id || ''}
                                >
                                    {brand.brand_name || `Brand ${index + 1}`}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div className="admin-filter-group">
                    <label htmlFor="status" className="admin-filter-label">
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={localFilters.status}
                        onChange={handleChange}
                        className="admin-filter-select"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div className="admin-filter-group">
                    <label htmlFor="sort_by" className="admin-filter-label">
                        Sort By
                    </label>
                    <select
                        id="sort_by"
                        name="sort_by"
                        value={localFilters.sort_by}
                        onChange={handleChange}
                        className="admin-filter-select"
                    >
                        <option value="created_at">Created Date</option>
                        <option value="product_name">Name</option>
                        <option value="updated_at">Updated Date</option>
                    </select>
                </div>

                <div className="admin-filter-group">
                    <label htmlFor="sort_order" className="admin-filter-label">
                        Sort Order
                    </label>
                    <select
                        id="sort_order"
                        name="sort_order"
                        value={localFilters.sort_order}
                        onChange={handleChange}
                        className="admin-filter-select"
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </div>

            <div className="admin-filters-actions">
                <button className="admin-btn-apply" onClick={handleApply}>
                    Apply Filters
                </button>
                <button className="admin-btn-reset" onClick={handleReset}>
                    Reset
                </button>
            </div>
        </div>
    );
};

export default ProductFilters;