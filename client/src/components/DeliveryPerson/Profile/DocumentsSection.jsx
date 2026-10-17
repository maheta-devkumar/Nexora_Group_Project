import React from 'react';
import './DocumentsSection.css';

const DocumentsSection = ({ verificationStatus, loading }) => {
    const handleDownload = (documentType) => {
        console.log('Downloading:', documentType);
        // Implement download logic
    };

    if (loading && !verificationStatus) {
        return (
            <div className="verification-card loading">
                <div className="card-header">
                    <h3>Documents & Verification</h3>
                </div>
                <div className="loading-content">
                    Loading documents...
                </div>
            </div>
        );
    }

    return (
        <div className="verification-card">
            <div className="card-header">
                <h3>Documents & Verification</h3>
                <span className={`verification-status ${verificationStatus?.is_verified ? 'verified' : 'pending'}`}>
                    {verificationStatus?.is_verified ? 'Verified' : 'Pending Verification'}
                </span>
            </div>
            <div className="verification-list">
                <div className="verification-item">
                    <div className="doc-info">
                        <i data-lucide="id-card"></i>
                        <div>
                            <strong>Aadhaar Card</strong>
                            <span>
                                {verificationStatus?.aadhaar_status === 'verified' ? 'Verified' : 'Pending'} • 
                                {verificationStatus?.aadhaar_upload_date ? ` Uploaded: ${verificationStatus.aadhaar_upload_date}` : ' Not uploaded'}
                            </span>
                        </div>
                    </div>
                    {verificationStatus?.aadhaar_url && (
                        <button className="icon-btn" onClick={() => handleDownload('aadhaar')} title="Download">
                            <i data-lucide="download"></i>
                        </button>
                    )}
                </div>
                
                <div className="verification-item">
                    <div className="doc-info">
                        <i data-lucide="file-text"></i>
                        <div>
                            <strong>Driving License</strong>
                            <span>
                                {verificationStatus?.license_status === 'verified' ? 'Verified' : 'Pending'} • 
                                {verificationStatus?.license_valid_until ? ` Valid until: ${verificationStatus.license_valid_until}` : ' Not uploaded'}
                            </span>
                        </div>
                    </div>
                    {verificationStatus?.license_url && (
                        <button className="icon-btn" onClick={() => handleDownload('license')} title="Download">
                            <i data-lucide="download"></i>
                        </button>
                    )}
                </div>

                {/* Additional documents can be added here */}
                <div className="verification-item">
                    <div className="doc-info">
                        <i data-lucide="shield"></i>
                        <div>
                            <strong>Vehicle Insurance</strong>
                            <span>
                                {verificationStatus?.insurance_status === 'verified' ? 'Verified' : 'Pending'} • 
                                {verificationStatus?.insurance_valid_until ? ` Valid until: ${verificationStatus.insurance_valid_until}` : ' Not uploaded'}
                            </span>
                        </div>
                    </div>
                    {verificationStatus?.insurance_url && (
                        <button className="icon-btn" onClick={() => handleDownload('insurance')} title="Download">
                            <i data-lucide="download"></i>
                        </button>
                    )}
                </div>

                <div className="verification-item">
                    <div className="doc-info">
                        <i data-lucide="file-check"></i>
                        <div>
                            <strong>PAN Card</strong>
                            <span>
                                {verificationStatus?.pan_status === 'verified' ? 'Verified' : 'Pending'} • 
                                {verificationStatus?.pan_upload_date ? ` Uploaded: ${verificationStatus.pan_upload_date}` : ' Not uploaded'}
                            </span>
                        </div>
                    </div>
                    {verificationStatus?.pan_url && (
                        <button className="icon-btn" onClick={() => handleDownload('pan')} title="Download">
                            <i data-lucide="download"></i>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentsSection;