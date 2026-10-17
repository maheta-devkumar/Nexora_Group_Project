import React, { useState, useEffect } from 'react';
import { FaBell, FaFilter, FaRedo, FaPlus, FaExclamationCircle } from 'react-icons/fa';
import NotificationTable from './NotificationTable';
import NotificationFilters from './NotificationFilters';
import SendNotificationModal from './SendNotificationModal';
import './AllNotificationsList.css';

const AllNotificationsList = ({ 
    notifications,
    pagination,
    loading,
    error,
    onFetchAll,
    onFilter,
    onViewDetails,
    onMarkRead,
    onDelete,
    onSendNotification
}) => {
    const [filters, setFilters] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [sendMode, setSendMode] = useState('single');

    useEffect(() => {
        if (currentPage > 1) {
            const newSkip = (currentPage - 1) * (pagination?.limit || 100);
            onFilter({ ...filters, skip: newSkip, limit: pagination?.limit || 100 });
        }
    }, [currentPage]);

    const handleFilter = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
        onFilter({ ...newFilters, skip: 0, limit: pagination?.limit || 100 });
    };

    const handleRefresh = () => {
        onFetchAll({ ...filters, skip: (currentPage - 1) * (pagination?.limit || 100), limit: pagination?.limit || 100 });
    };

    const handleSendNotification = (payload, mode) => {
        onSendNotification(payload, mode);
        setIsSendModalOpen(false);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    return (
        <div className="all-notifications-container">
            {/* Header */}
            <div className="notifications-header">
                <div className="header-content">
                    <div className="header-left">
                        <h2 className="notifications-title">
                            <FaBell /> All Notifications
                        </h2>
                        <p className="notifications-subtitle">
                            Total: {pagination?.total || 0} notifications • 
                            Page {currentPage} of {pagination?.total_pages || 1}
                        </p>
                    </div>
                    
                    <div className="header-actions">
                        <button
                            onClick={() => {
                                setSendMode('single');
                                setIsSendModalOpen(true);
                            }}
                            className="btn-send"
                        >
                            <FaPlus /> Send Notification
                        </button>
                        
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="btn-refresh"
                        >
                            <FaRedo /> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-alert">
                    <FaExclamationCircle className="error-icon" />
                    <div className="error-content">
                        <h4>Error</h4>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <NotificationFilters 
                onFilter={handleFilter} 
                loading={loading}
            />

            {/* Table */}
            <NotificationTable 
                notifications={notifications}
                loading={loading}
                onViewDetails={onViewDetails}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
                currentPage={currentPage}
                totalPages={pagination?.total_pages || 1}
                onPageChange={handlePageChange}
            />

            {/* Send Notification Modal */}
            <SendNotificationModal 
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                onSubmit={handleSendNotification}
                loading={loading}
                mode={sendMode}
            />
        </div>
    );
};

export default AllNotificationsList;