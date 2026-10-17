import React from 'react';
import { NotificationAdminProvider } from '../../../context/NotificationAdminContext';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout'; // Add this import
import NotificationDashboard from '../../../components/Admin/Notification/NotificationDashboard';

const NotificationPage = () => {
    return (
        <NotificationAdminProvider>
            <AdminLayout>
                <NotificationDashboard />
            </AdminLayout>
        </NotificationAdminProvider>
    );
};

export default NotificationPage;