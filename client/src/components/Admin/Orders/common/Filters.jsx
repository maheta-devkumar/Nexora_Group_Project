import React, { useState } from 'react';
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa';
import './Filters.css';

const Filters = ({ filters, onFilterChange, onSearch, onClearSearch }) => {
    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'PLACED', label: 'Placed' },
        { value: 'PROCESSING', label: 'Processing' },
        { value: 'SHIPPED', label: 'Shipped' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'RETURNED', label: 'Returned' },
        { value: 'REFUNDED', label: 'Refunded' }
    ];

    const [localSearch, setLocalSearch] = useState(filters.search);

    const handleSearchChange = (e) => {
        setLocalSearch(e.target.value);
    };

    const handleStatusChange = (e) => {
        onFilterChange({
            ...filters,
            status: e.target.value
        });
    };

    const handleStartDateChange = (e) => {
        onFilterChange({
            ...filters,
            startDate: e.target.value
        });
    };

    const handleEndDateChange = (e) => {
        onFilterChange({
            ...filters,
            endDate: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onFilterChange({
            ...filters,
            search: localSearch
        });
        if (onSearch) {
            onSearch();
        }
    };

    const handleClear = () => {
        setLocalSearch('');
        if (onClearSearch) {
            onClearSearch();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className="admin-orders-filters-wrapper">
            <form onSubmit={handleSubmit} className="admin-of-form">
                <div className="admin-of-grid">
                    {/* Search Group */}
                    <div className="admin-of-group">
                        <label>Search Order</label>
                        <div className="admin-of-search-wrapper">
                            <input
                                type="text"
                                placeholder="Order ID or Customer Name..."
                                value={localSearch}
                                onChange={handleSearchChange}
                                onKeyPress={handleKeyPress}
                                className="admin-of-input admin-of-input-search"
                            />
                            {localSearch ? (
                                <button
                                    type="button"
                                    onClick={() => setLocalSearch('')}
                                    className="admin-of-clear-icon-btn"
                                >
                                    <FaTimes />
                                </button>
                            ) : (
                                <FaSearch className="admin-of-search-icon" />
                            )}
                        </div>
                    </div>

                    {/* Status Select */}
                    <div className="admin-of-group">
                        <label>Status</label>
                        <div className="admin-of-select-wrapper">
                            <select
                                className="admin-of-select"
                                value={filters.status}
                                onChange={handleStatusChange}
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="admin-of-group admin-of-span-2">
                        <label>Date Range</label>
                        <div className="admin-of-date-inputs">
                            <div className="admin-of-date-wrapper">
                                <input
                                    type="date"
                                    className="admin-of-input"
                                    value={filters.startDate}
                                    onChange={handleStartDateChange}
                                    placeholder="Start Date"
                                />
                            </div>
                            <span className="admin-of-date-separator">-</span>
                            <div className="admin-of-date-wrapper">
                                <input
                                    type="date"
                                    className="admin-of-input"
                                    value={filters.endDate}
                                    onChange={handleEndDateChange}
                                    placeholder="End Date"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-of-actions">
                    {(filters.search || filters.status || filters.startDate || filters.endDate) && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="admin-of-btn-clear"
                        >
                            <FaTimes /> Clear
                        </button>
                    )}

                    <button
                        type="submit"
                        className="admin-of-btn-apply"
                    >
                        Apply Filters
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Filters;
