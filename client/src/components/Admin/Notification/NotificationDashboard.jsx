import React, { useState, useEffect } from 'react';
import {
    FaBell, FaChartBar, FaPaperPlane, FaBroadcastTower, FaTrash,
    FaCog, FaUsers, FaSearch, FaExclamationCircle, FaHome
} from 'react-icons/fa';
import { useNotificationAdminContext } from '../../../context/NotificationAdminContext';
import AllNotificationsList from './AllNotificationsList';
import AnalyticsPanel from './AnalyticsPanel';
import SendNotificationForm from './SendNotificationForm';
import BroadcastForm from './BroadcastForm';
import CleanupPanel from './CleanupPanel';
import NotificationDetailsModal from './NotificationDetailsModal';
import './NotificationDashboard.css';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout';

const NotificationDashboard = () => {
    const {
        // State
        allNotifications,
        currentNotification,
        stats,
        typeStats,
        loading,
        error,
        pagination,

        // Functions
        fetchAllNotifications,
        fetchNotificationsByUser,
        fetchUnreadNotifications,
        searchNotifications,
        fetchNotificationStats,
        fetchNotificationCountByType,
        sendNotificationToUser,
        sendNotificationToMultipleUsers,
        broadcastNotification,
        markNotificationReadByAdmin,
        updateNotification,
        deleteNotificationByAdmin,
        deleteOldNotifications,
        setNotification,
        clearCurrentNotification,
        clearError,
        clearAllData
    } = useNotificationAdminContext();

    const [activeTab, setActiveTab] = useState('all');
    const [cleanupPreview, setCleanupPreview] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Initial data fetch
    useEffect(() => {
        fetchAllNotifications({ skip: 0, limit: 50 });
        fetchNotificationStats();
        fetchNotificationCountByType();
    }, []);

    const tabs = [
        { id: 'all', label: 'All Notifications', icon: FaBell, count: pagination?.total },
        { id: 'analytics', label: 'Analytics', icon: FaChartBar },
        { id: 'send', label: 'Send', icon: FaPaperPlane },
        { id: 'broadcast', label: 'Broadcast', icon: FaBroadcastTower },
        { id: 'cleanup', label: 'Cleanup', icon: FaTrash }
    ];

    const handleSendNotification = async (payload, mode) => {
        try {
            if (mode === 'single') {
                await sendNotificationToUser(
                    payload.userId,
                    payload.title,
                    payload.message,
                    payload.type,
                    payload.referenceId
                );
            } else {
                await sendNotificationToMultipleUsers(
                    payload.userIds,
                    payload.title,
                    payload.message,
                    payload.type,
                    payload.referenceId
                );
            }
            // Refresh data
            fetchAllNotifications({ skip: 0, limit: 50 });
            fetchNotificationStats();
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    const handleBroadcast = async (broadcastData) => {
        try {
            await broadcastNotification(broadcastData);
            // Refresh data
            fetchAllNotifications({ skip: 0, limit: 50 });
            fetchNotificationStats();
        } catch (error) {
            console.error('Error broadcasting:', error);
        }
    };

    const handleMarkRead = async (notificationId) => {
        try {
            await markNotificationReadByAdmin(notificationId);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await deleteNotificationByAdmin(notificationId);
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleUpdateNotification = async (notificationId, updateData) => {
        try {
            await updateNotification(notificationId, updateData);
            setIsDetailsModalOpen(false);
        } catch (error) {
            console.error('Error updating:', error);
        }
    };

    const handleCleanup = async (days, confirm) => {
        try {
            const result = await deleteOldNotifications(days, confirm);
            if (!confirm) {
                setCleanupPreview(result.data);
            } else {
                setCleanupPreview(null);
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    };

    const handleViewDetails = (notification) => {
        setNotification(notification);
        setIsDetailsModalOpen(true);
    };

    const handleRefreshAnalytics = () => {
        fetchNotificationStats();
        fetchNotificationCountByType();
    };

    const handleDateRangeChange = (range, startDate, endDate) => {
        // Implement date-based filtering if needed
        console.log('Date range changed:', range, startDate, endDate);
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">Notification Management</h1>
                        </div>
                        <p className="text-[var(--admin-text-secondary)]">
                            Manage system notifications, send alerts, and monitor user engagement
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 min-w-[100px]">
                            <span className="text-xl font-bold">{stats?.total_notifications || 0}</span>
                            <span className="text-xs uppercase tracking-wider font-semibold">Total</span>
                        </div>
                        <div className="flex flex-col items-center px-4 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-100 min-w-[100px]">
                            <span className="text-xl font-bold">{stats?.total_unread || 0}</span>
                            <span className="text-xs uppercase tracking-wider font-semibold">Unread</span>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex justify-between items-center animate-fade-in">
                        <div className="flex items-center gap-3">
                            <FaExclamationCircle className="text-xl shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm">Error</h4>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={clearError}
                            className="hover:bg-red-100 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Main Content Card */}
                <div className="bg-[var(--admin-card-bg)] border border-[var(--admin-border)] rounded-xl shadow-sm overflow-hidden min-h-[600px]">
                    {/* Tabs */}
                    <div className="flex border-b border-[var(--admin-border)] overflow-x-auto bg-[var(--admin-bg-secondary)] scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all relative whitespace-nowrap ${isActive
                                        ? 'text-[var(--admin-primary)] bg-[var(--admin-card-bg)]'
                                        : 'text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-hover)]'
                                        }`}
                                >
                                    <Icon className={isActive ? 'text-[var(--admin-primary)]' : 'text-[var(--admin-text-muted)]'} />
                                    <span>{tab.label}</span>
                                    {tab.count !== undefined && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive
                                            ? 'bg-[var(--admin-primary)] text-white'
                                            : 'bg-[var(--admin-border)] text-[var(--admin-text-secondary)]'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--admin-primary)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-xl border border-gray-100">
                                <div className="spinner mb-3"></div>
                                <span className="text-gray-600 font-medium">Processing...</span>
                            </div>
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'all' && (
                            <AllNotificationsList
                                notifications={allNotifications}
                                pagination={pagination}
                                loading={loading}
                                error={error}
                                onFetchAll={fetchAllNotifications}
                                onFilter={fetchAllNotifications}
                                onViewDetails={handleViewDetails}
                                onMarkRead={handleMarkRead}
                                onDelete={handleDelete}
                                onSendNotification={handleSendNotification}
                            />
                        )}

                        {activeTab === 'analytics' && (
                            <AnalyticsPanel
                                stats={stats}
                                typeStats={typeStats}
                                loading={loading}
                                onRefresh={handleRefreshAnalytics}
                                onDateRangeChange={handleDateRangeChange}
                            />
                        )}

                        {activeTab === 'send' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <SendNotificationForm
                                        onSubmit={handleSendNotification}
                                        loading={loading}
                                    />
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-[var(--admin-bg-secondary)] rounded-lg p-5 border border-[var(--admin-border)]">
                                        <h3 className="font-bold text-[var(--admin-text-primary)] mb-4 flex items-center gap-2">
                                            <FaUsers className="text-[var(--admin-text-muted)]" />
                                            Quick Actions
                                        </h3>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => {
                                                    fetchUnreadNotifications(0, 20);
                                                    setActiveTab('all');
                                                }}
                                                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all text-left text-sm text-gray-700 group"
                                            >
                                                <div className="p-2 bg-orange-100 text-orange-600 rounded-full group-hover:bg-orange-200">
                                                    <FaExclamationCircle />
                                                </div>
                                                <span>View Unread Notifications</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    searchNotifications('important', 0, 20);
                                                    setActiveTab('all');
                                                }}
                                                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all text-left text-sm text-gray-700 group"
                                            >
                                                <div className="p-2 bg-blue-100 text-blue-600 rounded-full group-hover:bg-blue-200">
                                                    <FaSearch />
                                                </div>
                                                <span>Search "Important"</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    clearAllData();
                                                    fetchAllNotifications({ skip: 0, limit: 50 });
                                                }}
                                                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-left text-sm text-gray-700 group"
                                            >
                                                <div className="p-2 bg-gray-100 text-gray-600 rounded-full group-hover:bg-gray-200">
                                                    <FaCog />
                                                </div>
                                                <span>Refresh All Data</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'broadcast' && (
                            <div className="max-w-3xl mx-auto">
                                <BroadcastForm
                                    onSubmit={handleBroadcast}
                                    loading={loading}
                                />
                            </div>
                        )}

                        {activeTab === 'cleanup' && (
                            <div className="max-w-3xl mx-auto">
                                <CleanupPanel
                                    onCleanup={handleCleanup}
                                    loading={loading}
                                    cleanupPreview={cleanupPreview}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Notification Details Modal */}
                <NotificationDetailsModal
                    notification={currentNotification}
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        clearCurrentNotification();
                    }}
                    onUpdate={handleUpdateNotification}
                    onMarkRead={handleMarkRead}
                    loading={loading}
                />

                {/* Footer Stats */}
                <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-[var(--admin-text-secondary)] border-t border-[var(--admin-border)] pt-6">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <FaBell className="text-green-500" />
                            <span>System Status: <span className="font-semibold text-green-600">Operational</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaHome className="text-[var(--admin-text-muted)]" />
                            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <div className="mt-2 md:mt-0">
                        <span className="font-semibold text-[var(--admin-text-primary)]">{allNotifications.length}</span> notifications loaded
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default NotificationDashboard;