// components/Admin/ProductCatalog/Attributes/AttributeList.jsx
import React, { useState, useEffect } from 'react';
import { useAttributes } from '../../../../context/AttributeContext';
import './AttributeList.css';

const AttributeList = ({ onEdit }) => {
    const { attributes, loading, error, fetchAttributes, deleteAttribute } = useAttributes();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchAttributes();
    }, []);

    const filteredAttributes = attributes.filter(attr =>
        attr.attribute_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAttributes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAttributes.length / itemsPerPage);

    const handleDelete = async (attributeId, attributeName) => {
        if (window.confirm(`Are you sure you want to delete "${attributeName}"? This action cannot be undone.`)) {
            setDeleteLoading(attributeId);
            const result = await deleteAttribute(attributeId);
            setDeleteLoading(null);
            
            if (result.success) {
                // If we're on a page that's now empty, go back a page
                if (currentItems.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
            } else {
                alert(result.message || 'Failed to delete attribute');
            }
        }
    };

    const handleRefresh = () => {
        fetchAttributes();
        setSearchTerm('');
        setCurrentPage(1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="attribute-list-container">
            <div className="attribute-list-header">
                <div className="list-search-box">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        placeholder="Search attributes by name..."
                        className="list-search-input"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                    {searchTerm && (
                        <button 
                            className="clear-search-btn"
                            onClick={() => setSearchTerm('')}
                            title="Clear search"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>
                <div className="list-actions">
                    <button 
                        className="action-btn refresh-btn" 
                        onClick={handleRefresh} 
                        disabled={loading}
                    >
                        <i className="fas fa-sync-alt"></i>
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="list-error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                    <button className="retry-btn" onClick={handleRefresh}>
                        Retry
                    </button>
                </div>
            )}

            <div className="attribute-list-table-container">
                <table className="attribute-list-table">
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header">ID</th>
                            <th className="table-header">Attribute Name</th>
                            <th className="table-header">Created</th>
                            <th className="table-header actions-header">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && attributes.length === 0 ? (
                            <tr className="loading-row">
                                <td colSpan="4" className="loading-message">
                                    <div className="loading-spinner"></div>
                                    Loading attributes...
                                </td>
                            </tr>
                        ) : currentItems.length === 0 ? (
                            <tr className="empty-row">
                                <td colSpan="4" className="empty-message">
                                    <i className="fas fa-inbox"></i>
                                    {searchTerm ? 'No attributes match your search' : 'No attributes found'}
                                </td>
                            </tr>
                        ) : (
                            currentItems.map(attribute => (
                                <tr key={attribute.attribute_id} className="table-row">
                                    <td className="attribute-id-cell">
                                        <span className="attribute-id">
                                            #{attribute.attribute_id}
                                        </span>
                                    </td>
                                    <td className="attribute-name-cell">
                                        <span className="attribute-name">
                                            {attribute.attribute_name}
                                        </span>
                                    </td>
                                    <td className="created-cell">
                                        <span className="created-time">
                                            {formatDate(attribute.created_at)}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <div className="action-buttons">
                                            <button 
                                                className="action-btn edit-btn"
                                                onClick={() => onEdit(attribute.attribute_id)}
                                                title="Edit Attribute"
                                                disabled={deleteLoading === attribute.attribute_id}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button 
                                                className="action-btn delete-btn"
                                                onClick={() => handleDelete(attribute.attribute_id, attribute.attribute_name)}
                                                title="Delete Attribute"
                                                disabled={deleteLoading === attribute.attribute_id}
                                            >
                                                {deleteLoading === attribute.attribute_id ? (
                                                    <span className="mini-spinner"></span>
                                                ) : (
                                                    <i className="fas fa-trash"></i>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {filteredAttributes.length > itemsPerPage && (
                <div className="list-pagination">
                    <button 
                        className="pagination-btn prev-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        <i className="fas fa-chevron-left"></i>
                        Previous
                    </button>
                    
                    <div className="page-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => 
                                page === 1 || 
                                page === totalPages || 
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            )
                            .map((page, index, array) => (
                                <React.Fragment key={page}>
                                    {index > 0 && page - array[index - 1] > 1 && (
                                        <span className="page-ellipsis">...</span>
                                    )}
                                    <button
                                        className={`page-number ${currentPage === page ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                </React.Fragment>
                            ))}
                    </div>
                    
                    <button 
                        className="pagination-btn next-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}

            <div className="list-summary">
                <div className="summary-item">
                    <span className="summary-label">Total Attributes:</span>
                    <span className="summary-value">{attributes.length}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Showing:</span>
                    <span className="summary-value">
                        {filteredAttributes.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredAttributes.length)}` : '0'}
                        {' of '}{filteredAttributes.length}
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Page:</span>
                    <span className="summary-value">{currentPage} of {totalPages || 1}</span>
                </div>
            </div>
        </div>
    );
};

export default AttributeList;