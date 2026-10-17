import React, { useEffect, useState } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import AdminLayout from '../../Admin/Layout/AdminLayout';
import { Bell, Check, Trash2, Clock, Filter, CheckCircle } from 'lucide-react';
import './MyNotifications.css';

const MyNotifications = () => {
    const {
        notifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        isLoading,
        unreadCount
    } = useNotification();

    const [filter, setFilter] = useState('all'); // all, unread, read

    useEffect(() => {
        fetchNotifications(true, true); // Reset and show all
    }, [fetchNotifications]);

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'order': return '🛒';
            case 'payment': return '💰';
            case 'user': return '👤';
            case 'system': return '🔔';
            default: return '📢';
        }
    };

    return (
        <AdminLayout>
            <div className="my-notifications-container">
                <div className="notifications-header">
                    <div>
                        <h1>My Notifications</h1>
                        <p className="text-[var(--admin-text-secondary)] mt-1">
                            Stay updated with your latest alerts
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="admin-btn admin-btn-secondary"
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            <CheckCircle size={18} /> Mark All Read
                        </button>
                        <button
                            className="admin-btn admin-btn-danger"
                            onClick={async () => {
                                if (window.confirm('Are you sure you want to delete all notifications?')) {
                                    await deleteAllNotifications();
                                }
                            }}
                            disabled={notifications.length === 0}
                        >
                            <Trash2 size={18} /> Clear All
                        </button>
                    </div>
                </div>

                <div className="notification-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        Unread
                    </button>
                    <button
                        className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                        onClick={() => setFilter('read')}
                    >
                        Read
                    </button>
                </div>

                {isLoading && notifications.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <div className="spinner"></div> // Ensure spinner class exists globally or in admin.css
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🔕</span>
                        <h3>No notifications found</h3>
                        <p>You're all caught up! Check back later for updates.</p>
                    </div>
                ) : (
                    <div className="notification-list-page">
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.notification_id}
                                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                            >
                                <div className="notification-icon">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="notification-content">
                                    <p className="notification-message">
                                        {notification.message}
                                    </p>
                                    <div className="notification-meta">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                        <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-xs border border-gray-200">
                                            {notification.type || 'General'}
                                        </span>
                                    </div>
                                </div>
                                <div className="notification-actions">
                                    {!notification.is_read && (
                                        <button
                                            className="action-btn"
                                            title="Mark as read"
                                            onClick={() => markAsRead(notification.notification_id)}
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    )}
                                    <button
                                        className="action-btn delete"
                                        title="Delete"
                                        onClick={() => deleteNotification(notification.notification_id)}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default MyNotifications;
