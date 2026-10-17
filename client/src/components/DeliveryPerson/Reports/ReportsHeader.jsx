import React from 'react';
import './ReportsHeader.css';

const ReportsHeader = ({ periodFilter, onPeriodChange, onExport, exportSuccess, loading, customExportButton }) => {
    return (
        <div className="reports-page-header">
            <div className="header-left">
                <h2>
                    <i data-lucide="bar-chart-3"></i>
                    Delivery Reports
                </h2>
                <p className="header-subtitle">
                    Track and analyze your delivery performance and earnings
                </p>
            </div>

            <div className="header-controls">
                <div className="period-selector">
                    <label htmlFor="periodSelect">Report Period:</label>
                    <select
                        id="periodSelect"
                        className="period-select"
                        value={periodFilter}
                        onChange={(e) => onPeriodChange(e.target.value)}
                        disabled={loading}
                    >
                        <option value="Overall">Overall</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Custom Range">Custom Range</option>
                    </select>
                </div>

                {customExportButton ? (
                    customExportButton
                ) : (
                    <button
                        className={`export-btn ${exportSuccess ? 'export-success' : ''}`}
                        onClick={onExport}
                        disabled={loading}
                    >
                        <i data-lucide="download"></i>
                        {loading ? 'Exporting...' : exportSuccess ? 'Exported!' : 'Export Report'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ReportsHeader;