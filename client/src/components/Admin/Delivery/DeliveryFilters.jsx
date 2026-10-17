import React, { useState, useEffect } from 'react';
import { FaFilter, FaSearch, FaTimes, FaCalendar, FaUser } from 'react-icons/fa';
import './DeliveryFilters.css';

const DeliveryFilters = ({ onFilter, onSearch, loading = false, initialFilters = {} }) => {
    const [filters, setFilters] = useState({
        order_id: initialFilters.order_id || '',
        delivery_person_id: initialFilters.delivery_person_id || '',
        status: initialFilters.status || '',
        date_from: initialFilters.date_from || '',
        date_to: initialFilters.date_to || ''
    });
    const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'ASSIGNED', label: 'Assigned' },
        { value: 'PICKED', label: 'Picked Up' },
        { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' }
    ];

    // Reset filters when component mounts with initialFilters
    useEffect(() => {
        if (Object.keys(initialFilters).length > 0) {
            setFilters({
                order_id: initialFilters.order_id || '',
                delivery_person_id: initialFilters.delivery_person_id || '',
                status: initialFilters.status || '',
                date_from: initialFilters.date_from || '',
                date_to: initialFilters.date_to || ''
            });
            setSearchTerm(initialFilters.search || '');
        }
    }, [initialFilters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        // Create a clean filters object without empty values
        const activeFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== '')
        );

        // Include search term if present
        if (searchTerm.trim()) {
            activeFilters.search = searchTerm.trim();
        }

        onFilter(activeFilters);
    };

    const handleClearFilters = () => {
        setFilters({
            order_id: '',
            delivery_person_id: '',
            status: '',
            date_from: '',
            date_to: ''
        });
        setSearchTerm('');
        onFilter({});
    };

    const handleSearch = () => {
        if (searchTerm.trim()) {
            onSearch(searchTerm.trim());
        } else {
            // If search is cleared, apply all other filters
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== '')
            );
            onFilter(activeFilters);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleQuickFilter = (filterType, value) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
        setTimeout(() => {
            const activeFilters = { [filterType]: value };
            if (searchTerm.trim()) {
                activeFilters.search = searchTerm.trim();
            }
            onFilter(activeFilters);
        }, 100);
    };

    // Check if any filter is active
    const hasActiveFilters = Object.values(filters).some(value => value !== '') || searchTerm.trim() !== '';

    return (
        <div className="filters-container">
            <div className="filters-top">
                {/* Search Bar */}
                <div className="search-container">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by order ID, customer name, delivery ID..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                        />
                        <FaSearch className="search-icon" />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    onSearch('');
                                }}
                                className="clear-search"
                                disabled={loading}
                                title="Clear search"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter and Advanced Toggle Buttons */}
                <div className="filters-actions">
                    {/* Quick Status Filters */}
                    <div className="quick-filters">
                        {['ASSIGNED', 'DELIVERED', 'CANCELLED'].map(status => (
                            <button
                                key={status}
                                onClick={() => handleQuickFilter('status', status)}
                                className={`quick-filter-button ${filters.status === status ? 'active' : ''}`}
                                disabled={loading}
                                title={`Filter by ${status}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`toggle-filters ${showFilters || hasActiveFilters ? 'active' : ''}`}
                        disabled={loading}
                    >
                        <FaFilter />
                        <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                        {hasActiveFilters && !showFilters && (
                            <span className="active-dot"></span>
                        )}
                    </button>

                    {/* Advanced Toggle Button */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`toggle-advanced ${showAdvanced ? 'active' : ''}`}
                        disabled={loading}
                    >
                        <FaCalendar />
                        <span>Date</span>
                    </button>
                </div>
            </div>

            {/* Advanced Date Filters */}
            {showAdvanced && (
                <div className="advanced-filters">
                    <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaCalendar className="w-4 h-4" />
                        Date Range Filter
                    </h4>
                    <div className="date-grid">
                        <div className="date-filters">
                            <label>From Date</label>
                            <input
                                type="date"
                                name="date_from"
                                className="date-input"
                                value={filters.date_from}
                                onChange={handleFilterChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="date-filters">
                            <label>To Date</label>
                            <input
                                type="date"
                                name="date_to"
                                className="date-input"
                                value={filters.date_to}
                                onChange={handleFilterChange}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Filters Panel */}
            {showFilters && (
                <div className="filters-panel">
                    <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>Filter Deliveries</h4>
                    <div className="filters-grid">
                        {/* Order ID Filter */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaSearch className="w-3 h-3" />
                                Order ID
                            </label>
                            <input
                                type="number"
                                name="order_id"
                                placeholder="e.g., 1001"
                                className="filter-input"
                                value={filters.order_id}
                                onChange={handleFilterChange}
                                disabled={loading}
                                min="1"
                            />
                        </div>

                        {/* Delivery Person ID Filter */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaUser className="w-3 h-3" />
                                Delivery Person ID
                            </label>
                            <input
                                type="number"
                                name="delivery_person_id"
                                placeholder="e.g., 201"
                                className="filter-input"
                                value={filters.delivery_person_id}
                                onChange={handleFilterChange}
                                disabled={loading}
                                min="1"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label>Status</label>
                            <select
                                name="status"
                                className="select-input"
                                value={filters.status}
                                onChange={handleFilterChange}
                                disabled={loading}
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {hasActiveFilters && (
                        <div className="active-filters">
                            <div className="active-filters-header">Active Filters:</div>
                            <div className="active-filters-list">
                                {Object.entries(filters).map(([key, value]) => {
                                    if (!value) return null;
                                    return (
                                        <span key={key} className="filter-tag">
                                            {key.replace('_', ' ')}: {value}
                                            <button
                                                onClick={() => {
                                                    setFilters(prev => ({ ...prev, [key]: '' }));
                                                    const newFilters = { ...filters, [key]: '' };
                                                    const activeFilters = Object.fromEntries(
                                                        Object.entries(newFilters).filter(([_, v]) => v !== '')
                                                    );
                                                    if (searchTerm.trim()) {
                                                        activeFilters.search = searchTerm.trim();
                                                    }
                                                    onFilter(activeFilters);
                                                }}
                                                className="remove-filter"
                                            >
                                                <FaTimes />
                                            </button>
                                        </span>
                                    );
                                })}
                                {searchTerm && (
                                    <span className="filter-tag" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--admin-accent-green)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                        Search: {searchTerm}
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                onSearch('');
                                            }}
                                            className="remove-filter"
                                            style={{ color: 'var(--admin-accent-green)' }}
                                        >
                                            <FaTimes />
                                        </button>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Filter Actions */}
                    <div className="filters-actions-panel">
                        <div>
                            {hasActiveFilters && (
                                <button
                                    onClick={handleClearFilters}
                                    className="clear-all-button"
                                    disabled={loading}
                                >
                                    <FaTimes />
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleApplyFilters}
                                className="apply-filters-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        Applying...
                                    </>
                                ) : (
                                    'Apply Filters'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryFilters;