import React, { useRef, useState } from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import './ExcelUploadBox.css';

const ExcelUploadBox = () => {
    const { selectedTable, handlePreview, loading } = useExcelData();
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            handlePreview(file);
        }
    };

    const triggerUpload = () => {
        if (!loading && selectedTable) {
            fileInputRef.current.click();
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (selectedTable && !loading) setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (selectedTable && !loading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setFileName(file.name);
            handlePreview(file);
        }
    };

    return (
        <div className={`upload-card ${!selectedTable ? 'disabled' : ''}`}>
            <div className="upload-header">
                <div className="upload-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </div>
                <h3>2. Upload Excel File</h3>
            </div>

            {!selectedTable ? (
                <div className="dashed-placeholder">
                    <p className="placeholder-text">Please select a Target Table first.</p>
                </div>
            ) : (
                <div
                    className={`upload-dropzone ${isDragOver ? 'drag-active' : ''} ${loading ? 'loading' : ''}`}
                    onClick={triggerUpload}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={onFileChange}
                    />

                    <div className="dropzone-content">
                        <div className="icon-circle">
                            {loading ? (
                                <svg className="spinner-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" height="32" width="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            )}
                        </div>

                        {fileName ? (
                            <div className="file-name-display">
                                <p className="file-name">{fileName}</p>
                                <p className="file-status">
                                    {loading ? 'Analyzing file...' : 'File ready for preview'}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="instruction-text">
                                    {isDragOver ? "Drop file now" : "Click to upload or drag & drop"}
                                </p>
                                <p className="sub-text">
                                    Excel files (.xlsx, .xls) supported
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExcelUploadBox;
