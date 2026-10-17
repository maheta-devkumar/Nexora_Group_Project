import React from 'react';
import { FaEye, FaEdit, FaTrash, FaEnvelope, FaEnvelopeOpen, FaClock, FaUser } from 'react-icons/fa';
import NotificationBadge from './NotificationBadge';
import './NotificationTable.css';

const NotificationTable = ({ 
    notifications, 
    loading, 
    onViewDetails, 
    onMarkRead, 
    onDelete,
    currentPage,
    totalPages,
    onPageChange 
}) => {
    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p className="loading-text">Loading notifications...</p>
            </div>
        );
    }

    if (!notifications || notifications.length === 0) {
        return (
            <div className="empty-state">
                <FaEnvelope className="empty-icon" />
                <h3 className="empty-title">No notifications found</h3>
                <p className="empty-description">Try adjusting your filters or check back later.</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="table-container">
            <div className="table-scroll">
                <table className="notification-table">
                    <thead className="table-header">
                        <tr>
                            <th className="table-header-cell">ID</th>
                            <th className="table-header-cell">User / Message</th>
                            <th className="table-header-cell">Type / Status</th>
                            <th className="table-header-cell">Date</th>
                            <th className="table-header-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="table-body">
                        {notifications.map((notification) => (
                            <tr key={notification.notification_id} className="table-row">
                                <td className="table-cell id-cell">
                                    #{notification.notification_id}
                                </td>
                                <td className="table-cell user-cell">
                                    <div className="user-info">
                                        <div className="user-header">
                                            <FaUser className="user-icon" />
                                            <span className="user-id">User #{notification.user_id}</span>
                                            {notification.user_name && (
                                                <span className="user-name">({notification.user_name})</span>
                                            )}
                                        </div>
                                        <div className="message-title">{notification.title}</div>
                                        <p className="message-preview">
                                            {notification.message}
                                        </p>
                                    </div>
                                </td>
                                <td className="table-cell status-cell">
                                    <div className="status-content">
                                        <NotificationBadge 
                                            type={notification.type} 
                                            status={notification.is_read ? 'read' : 'unread'}
                                            size="sm"
                                        />
                                    </div>
                                </td>
                                <td className="table-cell date-cell">
                                    <div className="date-content">
                                        <FaClock className="date-icon" />
                                        <div>
                                            <div className="date-main">{formatDate(notification.created_at)}</div>
                                            {notification.read_at && (
                                                <div className="date-read">
                                                    Read: {formatDate(notification.read_at)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="table-cell action-cell">
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => onViewDetails(notification)}
                                            className="btn-action btn-view"
                                            title="View Details"
                                        >
                                            <FaEye /> View
                                        </button>
                                        
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => onMarkRead(notification.notification_id)}
                                                className="btn-action btn-mark-read"
                                                title="Mark as Read"
                                            >
                                                <FaEnvelopeOpen /> Mark Read
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this notification?')) {
                                                    onDelete(notification.notification_id);
                                                }
                                            }}
                                            className="btn-action btn-delete"
                                            title="Delete"
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <div className="pagination-content">
                        <div className="pagination-info">
                            Page <span className="page-number">{currentPage}</span> of <span className="page-number">{totalPages}</span>
                        </div>
                        <div className="pagination-controls">
                            <button
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="btn-pagination"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="btn-pagination"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationTable;