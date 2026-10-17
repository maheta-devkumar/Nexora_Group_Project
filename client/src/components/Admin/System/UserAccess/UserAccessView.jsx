import React, { useEffect, useState, useCallback } from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import ActiveSessionsPanel from './ActiveSessionsPanel';
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiPieChart,
  FiRefreshCw,
  FiSearch,
  FiFilter
} from 'react-icons/fi';
import { FaDesktop, FaMobileAlt, FaTabletAlt } from 'react-icons/fa';
import './UserAccessView.css';
import AdminLayout from '../../../Layout/AdminLayout';

const UserAccessView = () => {
  const {
    fetchActiveUsersCount,
    fetchLoggedInUsers,
    fetchUserRoleDistribution,
    fetchActiveSessions,
    fetchDeviceLoginDistribution,
    userAccess,
    sessions,
    loading,
    error,
    clearError
  } = useSystemContext();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchActiveUsersCount(),
        fetchLoggedInUsers(),
        fetchUserRoleDistribution(),
        fetchActiveSessions(),
        fetchDeviceLoginDistribution()
      ]);
    } catch (err) {
      console.error('Error fetching all data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    fetchActiveUsersCount,
    fetchLoggedInUsers,
    fetchUserRoleDistribution,
    fetchActiveSessions,
    fetchDeviceLoginDistribution
  ]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredUsers = (userAccess.loggedInUsers || []).filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getDeviceIcon = (deviceType) => {
    if (!deviceType) return <FaDesktop className="text-gray-500" />;

    switch (deviceType.toLowerCase()) {
      case 'desktop': return <FaDesktop className="user-access-device-icon desktop" />;
      case 'mobile': return <FaMobileAlt className="user-access-device-icon mobile" />;
      case 'tablet': return <FaTabletAlt className="user-access-device-icon tablet" />;
      default: return <FaDesktop className="user-access-device-icon" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'N/A';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FiPieChart /> },
    { id: 'active-users', label: 'Active Users', icon: <FiUserCheck /> },
    { id: 'sessions', label: 'Sessions', icon: <FiUsers /> },
    { id: 'devices', label: 'Devices', icon: <FaDesktop /> }
  ];

  const totalActiveUsers = userAccess.activeUsersCount?.active_users ||
    userAccess.activeUsersCount?.count ||
    (userAccess.loggedInUsers || []).length ||
    0;

  const totalSessions = Array.isArray(sessions.activeSessions) ? sessions.activeSessions.length : 0;
  const totalDevices = Array.isArray(sessions.deviceDistribution) ?
    sessions.deviceDistribution.reduce((sum, device) => sum + (device.count || 0), 0) : 0;

  return (
    <AdminLayout>
      <div className="user-access-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">User Access Monitoring</h1>
            <p className="text-[var(--admin-text-secondary)] mt-1">Monitor active users, sessions, and device access</p>
          </div>
          <button
            onClick={fetchAllData}
            disabled={loading || isRefreshing}
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            <FiRefreshCw className={`${loading || isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FiUserX className="text-red-500" />
              <span>{error}</span>
            </div>
            <button onClick={clearError} className="hover:bg-red-100 p-1 rounded text-sm">
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[var(--admin-border)] mb-6">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                  ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]'
                  : 'border-transparent text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="admin-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <FiUsers size={24} />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-[var(--admin-text-primary)] mb-1">{totalActiveUsers}</div>
                    <div className="text-sm text-[var(--admin-text-secondary)]">Total Active Users</div>
                  </div>
                </div>

                <div className="admin-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <FiUserCheck size={24} />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-[var(--admin-text-primary)] mb-1">{(userAccess.loggedInUsers || []).length}</div>
                    <div className="text-sm text-[var(--admin-text-secondary)]">Logged In Users</div>
                  </div>
                </div>

                <div className="admin-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                        <FiUsers size={24} />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-[var(--admin-text-primary)] mb-1">{totalSessions}</div>
                    <div className="text-sm text-[var(--admin-text-secondary)]">Active Sessions</div>
                  </div>
                </div>

                <div className="admin-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                        <FaDesktop size={24} />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-[var(--admin-text-primary)] mb-1">{totalDevices}</div>
                    <div className="text-sm text-[var(--admin-text-secondary)]">Unique Devices</div>
                  </div>
                </div>
              </div>

              {/* Role Distribution */}
              {userAccess.userRoleDistribution && (
                <div className="admin-card">
                  <h3 className="text-lg font-bold text-[var(--admin-text-primary)] mb-6">Role Distribution</h3>
                  <div className="space-y-4">
                    {Array.isArray(userAccess.userRoleDistribution.distribution) ?
                      userAccess.userRoleDistribution.distribution.map((role, index) => {
                        const totalUsers = userAccess.userRoleDistribution.total_users ||
                          userAccess.userRoleDistribution.total ||
                          1;
                        const percentage = Math.round((role.count / totalUsers) * 100);

                        return (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-full">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-[var(--admin-text-primary)]">{role.role_name || role.role || 'Unknown'}</span>
                                <span className="text-sm text-[var(--admin-text-secondary)]">{role.count || 0} users ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-[var(--admin-bg-hover)] rounded-full h-2">
                                <div
                                  className="bg-[var(--admin-primary)] h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="text-center py-8 text-[var(--admin-text-muted)] italic">
                          No role distribution data available
                        </div>
                      )
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Users Tab */}
          {activeTab === 'active-users' && (
            <div className="admin-card">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">Logged In Users</h3>
                <div className="relative w-full md:w-64">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--admin-text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-input pl-10"
                  />
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Last Active</th>
                      <th>Status</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12">
                          <div className="spinner mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-[var(--admin-text-muted)]">
                          {searchTerm ? 'No users found matching your search' : 'No users found'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <tr key={index}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--admin-primary)] text-white flex items-center justify-center font-bold text-sm">
                                {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-medium text-[var(--admin-text-primary)]">{user.username || user.name || 'Unknown User'}</h4>
                                <p className="text-xs text-[var(--admin-text-secondary)]">{user.email || 'No email'}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                              {user.role || 'User'}
                            </span>
                          </td>
                          <td className="text-sm text-[var(--admin-text-secondary)]">
                            {formatTime(user.last_active || user.last_seen || user.updated_at)}
                          </td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${(user.status === 'active' || user.status === 'online')
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                              }`}>
                              {user.status || 'inactive'}
                            </span>
                          </td>
                          <td className="text-sm font-mono text-[var(--admin-text-secondary)]">
                            {user.ip_address || user.last_ip || 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && <ActiveSessionsPanel />}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <div className="admin-card">
              <h3 className="text-lg font-bold text-[var(--admin-text-primary)] mb-6">Device Login Distribution</h3>
              {sessions.deviceDistribution && Array.isArray(sessions.deviceDistribution) && sessions.deviceDistribution.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.deviceDistribution.map((device, index) => {
                    const totalDevicesCount = sessions.deviceDistribution.reduce((sum, d) => sum + (d.count || 0), 0);
                    const percentage = totalDevicesCount > 0 ? Math.round((device.count / totalDevicesCount) * 100) : 0;

                    return (
                      <div key={index} className="bg-[var(--admin-bg-hover)] p-4 rounded-lg flex items-center gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm text-blue-600">
                          {getDeviceIcon(device.device_type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[var(--admin-text-primary)]">{device.device_type || 'Unknown Device'}</h4>
                          <p className="text-xs text-[var(--admin-text-secondary)] mb-1">
                            {device.os || ''} {device.browser && device.os ? `• ${device.browser}` : device.browser || ''}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-[var(--admin-primary)]">{device.count || 0}</span>
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{percentage}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--admin-text-muted)] italic">
                  <p>No device distribution data available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserAccessView;