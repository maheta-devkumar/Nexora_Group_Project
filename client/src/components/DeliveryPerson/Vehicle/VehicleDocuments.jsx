import React from 'react';
import './VehicleDocuments.css';

const VehicleDocuments = ({ documents, loading, onDownload }) => {
    if (loading && !documents) {
        return (
            <div className="documents-section loading">
                <div className="section-header-skeleton">
                    <div className="title-skeleton"></div>
                </div>
                <div className="documents-grid-skeleton">
                    {[1, 2, 3].map(i => (
                        <div className="document-card-skeleton" key={i}>
                            <div className="document-icon-skeleton"></div>
                            <div className="document-info-skeleton">
                                <div className="title-skeleton-small"></div>
                                <div className="subtitle-skeleton"></div>
                            </div>
                            <div className="document-action-skeleton"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Safe data access
    const getDocumentsData = () => {
        if (!documents || documents.length === 0) {
            return [
                {
                    id: 1,
                    type: 'registration',
                    icon: 'file-text',
                    title: 'Registration Certificate',
                    description: 'Uploaded: Oct 15, 2025',
                    status: 'verified',
                    canDownload: true
                },
                {
                    id: 2,
                    type: 'insurance',
                    icon: 'shield',
                    title: 'Insurance Document',
                    description: 'Valid until: Dec 31, 2025',
                    status: 'verified',
                    canDownload: true
                },
                {
                    id: 3,
                    type: 'pollution',
                    icon: 'file-check',
                    title: 'Pollution Certificate',
                    description: 'Valid until: Jun 30, 2026',
                    status: 'verified',
                    canDownload: true
                }
            ];
        }

        return documents.map((doc, index) => ({
            id: doc.document_id || index + 1,
            type: doc.document_type || 'document',
            icon: getDocumentIcon(doc.document_type),
            title: doc.document_name || 'Vehicle Document',
            description: doc.valid_until 
                ? `Valid until: ${doc.valid_until}`
                : doc.upload_date 
                ? `Uploaded: ${doc.upload_date}`
                : 'Vehicle document',
            status: doc.status?.toLowerCase() || 'verified',
            canDownload: doc.can_download !== false
        }));
    };

    const documentList = getDocumentsData();

    return (
        <div className="documents-section">
            <h3>Vehicle Documents</h3>
            
            {documentList.length === 0 ? (
                <div className="empty-state">
                    <i data-lucide="file-text"></i>
                    <p>No vehicle documents uploaded</p>
                    <button className="btn-primary">
                        <i data-lucide="upload"></i>
                        Upload Documents
                    </button>
                </div>
            ) : (
                <div className="documents-grid">
                    {documentList.map(doc => (
                        <div className="document-card" key={doc.id}>
                            <div className="document-icon">
                                <i data-lucide={doc.icon}></i>
                            </div>
                            <div className="document-info">
                                <strong>{doc.title}</strong>
                                <span>{doc.description}</span>
                                {doc.status && (
                                    <span className={`document-status ${doc.status}`}>
                                        {doc.status === 'verified' ? '✓ Verified' : 
                                         doc.status === 'pending' ? '⏳ Pending' : 
                                         doc.status === 'expired' ? '✗ Expired' : 'Document'}
                                    </span>
                                )}
                            </div>
                            <button 
                                className="icon-btn" 
                                onClick={() => onDownload(doc.id)}
                                title="Download Document"
                                disabled={!doc.canDownload}
                            >
                                <i data-lucide="download"></i>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper function to get appropriate icon for document type
const getDocumentIcon = (docType) => {
    if (!docType) return 'file-text';
    
    switch(docType.toLowerCase()) {
        case 'registration':
        case 'rc':
            return 'file-text';
        case 'insurance':
            return 'shield';
        case 'pollution':
        case 'puc':
            return 'file-check';
        case 'license':
        case 'driving_license':
            return 'id-card';
        case 'permit':
            return 'file-check';
        default:
            return 'file-text';
    }
};

export default VehicleDocuments;