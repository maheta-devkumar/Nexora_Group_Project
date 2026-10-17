import React from 'react';
import './ExportReportButton.css';

const ExportReportButton = ({ onExport, exportSuccess, loading }) => {
    return (
        <div className="export-report-section">
            <div className="export-options">
                <h4>Export Options</h4>
                <div className="option-buttons">
                    <button 
                        className="option-btn pdf-btn"
                        onClick={() => onExport('pdf')}
                        disabled={loading}
                    >
                        <i data-lucide="file-text"></i>
                        PDF
                    </button>
                    <button 
                        className="option-btn excel-btn"
                        onClick={() => onExport('csv')}
                        disabled={loading}
                    >
                        <i data-lucide="file-spreadsheet"></i>
                        Excel
                    </button>
                    <button 
                        className="option-btn print-btn"
                        onClick={() => window.print()}
                    >
                        <i data-lucide="printer"></i>
                        Print
                    </button>
                </div>
            </div>
            
            <div className="export-status">
                {exportSuccess && (
                    <div className="export-success-message">
                        <i data-lucide="check-circle"></i>
                        <span>Report exported successfully!</span>
                    </div>
                )}
                
                {loading && (
                    <div className="export-loading">
                        <div className="loading-spinner"></div>
                        <span>Preparing your report...</span>
                    </div>
                )}
            </div>
            
            <div className="export-tips">
                <h5>Export Tips:</h5>
                <ul>
                    <li>PDF exports are best for sharing and printing</li>
                    <li>Excel/CSV format allows data analysis</li>
                    <li>Ensure all filters are set before exporting</li>
                </ul>
            </div>
        </div>
    );
};

export default ExportReportButton;