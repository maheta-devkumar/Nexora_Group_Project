import React from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import './ExcelPreviewTable.css';

const ExcelPreviewTable = () => {
    const { previewData, loading } = useExcelData();

    if (loading) return null;
    if (!previewData || !previewData.preview_data) return null;

    const { columns, preview_data, valid_rows, invalid_rows } = previewData;
    const hasErrors = invalid_rows > 0;

    return (
        <div className="preview-card">
            <div className="preview-header">
                <div className="preview-title">
                    <div className="preview-icon-box">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3>3. Data Preview</h3>
                </div>

                <div className="preview-stats">
                    <div className="stat-badge valid">
                        <div className="stat-dot valid"></div>
                        Valid: <span className="stat-count">{valid_rows}</span>
                    </div>
                    {invalid_rows > 0 && (
                        <div className="stat-badge invalid">
                            <div className="stat-dot invalid"></div>
                            Invalid: <span className="stat-count">{invalid_rows}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="preview-table-container">
                <table className="preview-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            {columns.map((col) => (
                                <th key={col}>
                                    {col.replace(/_/g, " ")}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {preview_data.map((row, idx) => {
                            const isErrorRow = row._error;
                            return (
                                <tr
                                    key={idx}
                                    className={isErrorRow ? 'error-row' : 'normal-row'}
                                >
                                    <td className="col-index">
                                        {idx + 1}
                                    </td>
                                    {columns.map((col) => (
                                        <td key={col}>
                                            {String(row[col] !== null && row[col] !== undefined ? row[col] : '') || <span className="null-val">null</span>}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="preview-footer">
                <span>Showing {preview_data.length} rows</span>
                {!hasErrors ? (
                    <span className="status-ready">
                        <svg height="16" width="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Ready for import
                    </span>
                ) : (
                    <span className="status-error">Resolve errors to proceed</span>
                )}
            </div>
        </div>
    );
};

export default ExcelPreviewTable;
