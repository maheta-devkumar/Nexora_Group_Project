import React, { useEffect } from 'react';
import { ExcelDataProvider, useExcelData } from '../../context/ExcelDataContext';
import BulkTableSelector from '../../components/admin/BulkTableSelector';
import ExcelUploadBox from '../../components/admin/ExcelUploadBox';
import ExcelPreviewTable from '../../components/admin/ExcelPreviewTable';
import BulkUploadErrors from '../../components/admin/BulkUploadErrors';
import AdminLayout from '../../components/admin/Layout/AdminLayout';
import './BulkExcelUpload.css';

const BulkExcelUploadContent = () => {
    const {
        handleInsert,
        loading,
        previewData,
        successMessage,
        clearMessages
    } = useExcelData();

    // Clear messages on mount
    useEffect(() => {
        clearMessages();
    }, []);

    const hasErrors = previewData?.invalid_rows > 0;
    const canSubmit = previewData && !loading && !hasErrors;

    return (
        <div className="bulk-upload-page">
            <div className="bulk-header">
                <div className="bulk-title">
                    <h1>Bulk Data Management</h1>
                    <p>Seamlessly import large datasets into your inventory and catalog.</p>
                </div>
                <div className="hidden sm:block">
                    <div className="bulk-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Success Notification */}
            {successMessage && (
                <div className="success-notification">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" className="text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="success-content">
                        <h3>Import Successful</h3>
                        <p>{successMessage}</p>
                    </div>
                </div>
            )}

            {/* Main Content Areas */}
            <div className="bulk-layout-grid">
                {/* Left Column: Controls */}
                <div className="left-column">
                    <BulkTableSelector />
                </div>

                {/* Right Column: Upload & Preview */}
                <div className="right-column">
                    <ExcelUploadBox />

                    <div className="preview-error-wrapper">
                        <BulkUploadErrors />
                        <ExcelPreviewTable />
                    </div>

                    {/* Submit Action */}
                    {previewData && (
                        <div className="submit-action-bar">
                            <button
                                onClick={handleInsert}
                                disabled={!canSubmit}
                                className="btn-confirm-upload"
                            >
                                {loading ? (
                                    <>
                                        <svg className="btn-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing Upload...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" style={{ marginRight: '0.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Confirm & Import Data
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const BulkExcelUpload = () => {
    return (
        <ExcelDataProvider>
            <AdminLayout>
                <BulkExcelUploadContent />
            </AdminLayout>
        </ExcelDataProvider>
    );
};

export default BulkExcelUpload;
