import React, { useState } from 'react';
import { FaTimes, FaEdit, FaSave, FaUser, FaCalendar, FaEye, FaEyeSlash, FaTag } from 'react-icons/fa';
import NotificationBadge from './NotificationBadge';
import './NotificationDetailsModal.css';

const NotificationDetailsModal = ({ 
    notification, 
    isOpen, 
    onClose, 
    onUpdate,
    onMarkRead,
    loading 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: notification?.title || '',
        message: notification?.message || '',
        type: notification?.type || 'SYSTEM',
        reference_id: notification?.reference_id || ''
    });

    if (!isOpen || !notification) return null;

    const notificationTypes = [
        { value: 'ORDER', label: 'Order' },
        { value: 'PAYMENT', label: 'Payment' },
        { value: 'DELIVERY', label: 'Delivery' },
        { value: 'OFFER', label: 'Offer' },
        { value: 'FEEDBACK', label: 'Feedback' },
        { value: 'SYSTEM', label: 'System' }
    ];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const updates = {};
        if (formData.title !== notification.title) updates.title = formData.title;
        if (formData.message !== notification.message) updates.message = formData.message;
        if (formData.type !== notification.type) updates.type = formData.type;
        if (formData.reference_id !== notification.reference_id) updates.reference_id = formData.reference_id;

        if (Object.keys(updates).length > 0) {
            onUpdate(notification.notification_id, updates);
            setIsEditing(false);
        } else {
            setIsEditing(false);
        }
    };

    const handleMarkRead = () => {
        if (!notification.is_read) {
            onMarkRead(notification.notification_id);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-container">
                <div className="modal-panel">
                    {/* Header */}
                    <div className="modal-header">
                        <div className="header-left">
                            <h3>Notification Details #{notification.notification_id}</h3>
                            <NotificationBadge 
                                type={notification.type} 
                                status={notification.is_read ? 'read' : 'unread'}
                                size="sm"
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="close-button"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="modal-body">
                        {/* User Info */}
                        <div className="user-info-card">
                            <div className="user-header">
                                <FaUser className="user-icon" />
                                <h4>User Information</h4>
                            </div>
                            <div className="user-details">
                                User ID: {notification.user_id}
                                {notification.user_name && ` (${notification.user_name})`}
                                {notification.user_email && ` • ${notification.user_email}`}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="date-grid">
                            <div className="date-card">
                                <div className="date-label">
                                    <FaCalendar /> Created
                                </div>
                                <div className="date-value">{formatDate(notification.created_at)}</div>
                            </div>
                            {notification.read_at ? (
                                <div className="date-card read">
                                    <div className="date-label">
                                        <FaEye /> Read At
                                    </div>
                                    <div className="date-value">{formatDate(notification.read_at)}</div>
                                </div>
                            ) : (
                                <div className="date-card unread">
                                    <div className="date-label">
                                        <FaEyeSlash /> Not Read Yet
                                    </div>
                                    <div className="date-value">Unread</div>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="form-input"
                                    disabled={loading}
                                />
                            ) : (
                                <div className="form-input readonly">
                                    {notification.title}
                                </div>
                            )}
                        </div>

                        {/* Type */}
                        <div className="form-group">
                            <label className="form-label type-label">
                                <FaTag /> Type
                            </label>
                            {isEditing ? (
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="form-select"
                                    disabled={loading}
                                >
                                    {notificationTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="form-input readonly">
                                    {notification.type.toLowerCase()}
                                </div>
                            )}
                        </div>

                        {/* Message */}
                        <div className="form-group">
                            <label className="form-label">Message</label>
                            {isEditing ? (
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows="6"
                                    className="form-textarea"
                                    disabled={loading}
                                />
                            ) : (
                                <div className="form-textarea readonly">
                                    {notification.message}
                                </div>
                            )}
                        </div>

                        {/* Reference ID */}
                        <div className="form-group">
                            <label className="form-label">Reference ID</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    name="reference_id"
                                    value={formData.reference_id}
                                    onChange={handleChange}
                                    placeholder="Optional reference ID"
                                    className="form-input"
                                    disabled={loading}
                                />
                            ) : (
                                <div className="form-input readonly">
                                    {notification.reference_id || 'No reference ID'}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            <div className="left-actions">
                                {!notification.is_read && !isEditing && (
                                    <button
                                        onClick={handleMarkRead}
                                        disabled={loading}
                                        className="btn-mark-read"
                                    >
                                        <FaEye /> Mark as Read
                                    </button>
                                )}
                            </div>
                            
                            <div className="right-actions">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="btn-cancel"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="btn-save"
                                        >
                                            <FaSave /> Save Changes
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        disabled={loading}
                                        className="btn-edit"
                                    >
                                        <FaEdit /> Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetailsModal;