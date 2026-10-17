import React from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import './BulkUploadErrors.css';

const BulkUploadErrors = () => {
    const { previewData, error } = useExcelData();

    // Global errors (e.g. from API)
    if (error && typeof error === 'string') {
        return (
            <div className="error-alert-card" role="alert">
                <svg height="24" width="24" className="flex-shrink-0" style={{ color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <strong className="error-title">Upload Error</strong>
                    <span className="error-text">{error}</span>
                </div>
            </div>
        );
    }

    // Row validation errors
    if (!previewData || !previewData.errors || previewData.errors.length === 0) return null;

    return (
        <div className="error-detail-card">
            <div className="error-header">
                <h3>
                    <div className="error-icon-box">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    Validation Issues Found
                </h3>
                <span className="error-badge-count">
                    {previewData.errors.length} Errors
                </span>
            </div>

            <div className="error-table-container">
                <table className="error-table">
                    <thead>
                        <tr>
                            <th>Row #</th>
                            <th>Issue Type</th>
                            <th>Specific Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {previewData.errors.map((err, idx) => (
                            <tr key={idx}>
                                <td className="row-index">
                                    Row {err.row_index}
                                </td>
                                <td>
                                    <span className="error-type-badge">
                                        {err.error_message}
                                    </span>
                                </td>
                                <td>
                                    <ul className="error-details-list">
                                        {Object.entries(err.column_errors).map(([col, msg]) => (
                                            <li key={col} className="error-item">
                                                <span className="col-name">{col}:</span>
                                                <span>{msg}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="error-footer">
                <p className="action-required-text">
                    <svg height="16" width="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Action Required: Please correct these errors in your Excel file and re-upload to proceed.
                </p>
            </div>
        </div>
    );
};

export default BulkUploadErrors;
