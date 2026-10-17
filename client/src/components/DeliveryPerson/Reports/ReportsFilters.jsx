import React from 'react';
import './ReportsFilters.css';

const ReportsFilters = ({
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    onApplyFilters,
    onClearFilters,
    loading
}) => {
    return (
        <div className="filters-container">
            <h3 className="filters-title">
                <i data-lucide="filter"></i>
                Filter Reports
            </h3>
            
            <div className="filters-grid">
                <div className="filter-group">
                    <label htmlFor="startDate" className="filter-label">
                        <i data-lucide="calendar"></i>
                        Start Date
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        className="filter-input"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        disabled={loading}
                    />
                </div>
                
                <div className="filter-group">
                    <label htmlFor="endDate" className="filter-label">
                        <i data-lucide="calendar"></i>
                        End Date
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        className="filter-input"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        min={dateRange.startDate}
                        disabled={loading}
                    />
                </div>
                
                <div className="filter-group">
                    <label htmlFor="statusFilter" className="filter-label">
                        <i data-lucide="package"></i>
                        Status Filter
                    </label>
                    <select
                        id="statusFilter"
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        disabled={loading}
                    >
                        <option>All Status</option>
                        <option>Delivered</option>
                        <option>In Transit</option>
                        <option>Failed</option>
                        <option>Cancelled</option>
                        <option>Pending</option>
                    </select>
                </div>
                
                <div className="filter-group">
                    <label className="filter-label">
                        Quick Filters
                    </label>
                    <div className="quick-filters">
                        <button
                            className="quick-filter-btn"
                            onClick={() => {
                                const endDate = new Date().toISOString().split('T')[0];
                                const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                setDateRange({ startDate, endDate });
                            }}
                            disabled={loading}
                        >
                            Last 7 Days
                        </button>
                        <button
                            className="quick-filter-btn"
                            onClick={() => {
                                const endDate = new Date().toISOString().split('T')[0];
                                const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                setDateRange({ startDate, endDate });
                            }}
                            disabled={loading}
                        >
                            Last 30 Days
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="filter-actions">
                <button
                    className="clear-btn"
                    onClick={onClearFilters}
                    disabled={loading}
                >
                    <i data-lucide="x"></i>
                    Clear All
                </button>
                <button
                    className="apply-btn"
                    onClick={onApplyFilters}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <i data-lucide="loader-2" className="animate-spin"></i>
                            Applying...
                        </>
                    ) : (
                        <>
                            <i data-lucide="check"></i>
                            Apply Filters
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ReportsFilters;