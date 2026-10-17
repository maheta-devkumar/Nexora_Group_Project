import React from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import './BulkTableSelector.css';

const BulkTableSelector = () => {
    const { allowedTables, selectedTable, handleTableSelect, handleDownloadTemplate, loading, allowedTablesError } = useExcelData();

    return (
        <div className="selector-card">
            <div className="selector-header">
                <div className="selector-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h3>1. Select Data Type</h3>
            </div>

            <div className="selector-form-group">
                <div>
                    <label className="selector-label">
                        Target Table
                    </label>
                    <div className="select-wrapper">
                        <select
                            className="custom-select"
                            value={selectedTable || ''}
                            onChange={(e) => handleTableSelect(e.target.value)}
                            disabled={loading}
                        >
                            <option value="" disabled>Choose a table...</option>
                            {allowedTables.map((table) => (
                                <option key={table.table_name} value={table.table_name}>
                                    {table.label} ({table.table_name})
                                </option>
                            ))}
                        </select>
                        <div className="select-arrow">
                            <svg height="16" width="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="selector-actions">
                    <p className="template-hint">
                        {selectedTable ? (
                            <span className="hint-active">
                                <svg height="16" width="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Template required for headers
                            </span>
                        ) : "Select a table to proceed"}
                    </p>

                    <button
                        onClick={handleDownloadTemplate}
                        disabled={!selectedTable || loading}
                        className="btn-download-template"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Template
                    </button>
                </div>

                {/* Debugging / Empty State */}
                {allowedTables && allowedTables.length === 0 && !loading && (
                    <div className="selector-error-state">
                        <svg style={{ flexShrink: 0 }} height="20" width="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        <div>
                            <p style={{ fontWeight: 600, margin: 0 }}>Unable to list tables.</p>
                            <p style={{ margin: 0 }}>Check network or permissions.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-reload"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkTableSelector;
