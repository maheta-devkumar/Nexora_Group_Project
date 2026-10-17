import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { FiActivity, FiUsers, FiShield, FiAlertTriangle, FiBell, FiKey } from 'react-icons/fi';
import { CgPerformance } from 'react-icons/cg';
import { FaChartBar, FaUserLock } from 'react-icons/fa';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout'; // Add this import
import './System.css'; // Added CSS import

// Import Components
import SystemDashboard from '../../../components/Admin/System/Dashboard/SystemDashboard';
import UserAccessView from '../../../components/Admin/System/UserAccess/UserAccessView';
import AuditLogsView from '../../../components/Admin/System/AuditLogs/AuditLogsView';
import HealthDashboard from '../../../components/Admin/System/SystemHealth/HealthDashboard';
import NotificationsView from '../../../components/Admin/System/Notifications/NotificationsView';
import PermissionManager from '../../../components/Admin/System/Permissions/PermissionManager';
import RolePermissionsView from '../../../components/Admin/System/Permissions/RolePermissionsView';

const System = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '', icon: <FaChartBar />, label: 'Dashboard', component: SystemDashboard },
    { path: 'user-access', icon: <FaUserLock />, label: 'User Access', component: UserAccessView },
    { path: 'audit-logs', icon: <FiShield />, label: 'Audit Logs', component: AuditLogsView },
    { path: 'system-health', icon: <CgPerformance />, label: 'System Health', component: HealthDashboard },
    { path: 'notifications', icon: <FiBell />, label: 'Notifications', component: NotificationsView },
    { path: 'permissions', icon: <FiKey />, label: 'Permissions', component: PermissionManager },
    { path: 'role-permissions', icon: <FiActivity />, label: 'Role Mapping', component: RolePermissionsView },
  ];

  return (
    <AdminLayout>
      <div className="system-container">
        <div className="flex">
          {/* Sidebar */}
          <div className="system-sidebar">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">System Management</h1>
              <p className="text-sm text-gray-600">Monitor and manage system operations</p>
            </div>
            
            <nav className="system-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.path || 'dashboard'}
                  to={`/admin/system/${item.path}`}
                  end={item.path === ''}
                  className={({ isActive }) => 
                    `system-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="system-quick-actions">
              <div className="px-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <button className="system-quick-btn primary">
                  Refresh All Data
                </button>
                <button className="system-quick-btn secondary">
                  Export Reports
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="system-main-content">
            <Routes>
              {navItems.map((item) => (
                <Route
                  key={item.path || 'dashboard'}
                  path={item.path || ''}
                  element={<item.component />}
                />
              ))}
            </Routes>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default System;