import React, { useEffect, useState, useCallback } from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import CriticalAlertsPanel from './CriticalAlertsPanel';
import './AuditLogsView.css';
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiActivity
} from 'react-icons/fi';
import AdminLayout from '../../../Layout/AdminLayout';

const AuditLogsView = () => {
  const {
    fetchAdminActivityLogs,
    fetchCriticalAdminActions,
    adminLogs,
    loading,
    error,
    clearError
  } = useSystemContext();

  const [filters, setFilters] = useState({
    adminId: '',
    actionType: '',
    resourceType: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchAdminActivityLogs(),
      fetchCriticalAdminActions()
    ]);
  }, [fetchAdminActivityLogs, fetchCriticalAdminActions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = useCallback(async () => {
    setIsApplyingFilters(true);
    try {
      const adminId = filters.adminId ? parseInt(filters.adminId) : null;
      await fetchAdminActivityLogs(adminId, currentPage, pageSize);
    } catch (err) {
      console.error('Error applying filters:', err);
    } finally {
      setIsApplyingFilters(false);
    }
  }, [filters.adminId, currentPage, pageSize, fetchAdminActivityLogs]);

  const resetFilters = () => {
    setFilters({
      adminId: '',
      actionType: '',
      resourceType: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setCurrentPage(1);
    loadData();
  };

  const getActionIcon = (actionType) => {
    if (!actionType) return <FiActivity className="audit-action-icon" style={{ color: 'var(--admin-text-subtle)' }} />;

    switch (actionType.toLowerCase()) {
      case 'create':
        return <FiCheckCircle className="audit-action-icon" style={{ color: 'var(--admin-success)' }} />;
      case 'update':
        return <FiActivity className="audit-action-icon" style={{ color: 'var(--admin-primary)' }} />;
      case 'delete':
        return <FiXCircle className="audit-action-icon" style={{ color: 'var(--admin-accent-red)' }} />;
      case 'login':
        return <FiCheckCircle className="audit-action-icon" style={{ color: 'var(--admin-success)' }} />;
      case 'logout':
        return <FiXCircle className="audit-action-icon" style={{ color: 'var(--admin-text-subtle)' }} />;
      case 'critical':
        return <FiAlertTriangle className="audit-action-icon" style={{ color: 'var(--admin-accent-gold)' }} />;
      default:
        return <FiActivity className="audit-action-icon" style={{ color: 'var(--admin-text-subtle)' }} />;
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'N/A';
    }
  };

  const getSeverityColor = (severity) => {
    // Return inline styles or classes for badges
    if (!severity) return 'audit-severity-badge info';

    switch (severity.toLowerCase()) {
      case 'critical': return 'audit-severity-badge danger';
      case 'high': return 'audit-severity-badge warning';
      case 'medium': return 'audit-severity-badge warning';
      case 'low': return 'audit-severity-badge info';
      default: return 'audit-severity-badge info';
    }
  };

  const logs = adminLogs.adminActivityLogs.logs || [];
  const filteredLogs = logs.filter(log => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        log.admin_name?.toLowerCase().includes(searchLower) ||
        log.admin_username?.toLowerCase().includes(searchLower) ||
        log.action_description?.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower) ||
        log.resource_type?.toLowerCase().includes(searchLower) ||
        log.ip_address?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const pagination = adminLogs.adminActivityLogs.pagination || {};
  const totalLogs = pagination.total || filteredLogs.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredLogs.length);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">Audit Logs</h1>
            <p className="text-[var(--admin-text-secondary)] mt-1">Monitor and review all system activities</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="text-red-500" />
              <span>{error}</span>
            </div>
            <button onClick={clearError} className="hover:bg-red-100 p-1 rounded text-sm">
              Dismiss
            </button>
          </div>
        )}

        {/* Critical Alerts */}
        <div className="mb-6">
          <CriticalAlertsPanel />
        </div>

        {/* Filters */}
        <div className="admin-card mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-[var(--admin-border)] pb-4">
            <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">Filter Logs</h3>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={resetFilters}
                disabled={loading || isApplyingFilters}
                className="admin-btn admin-btn-secondary flex-1 md:flex-none justify-center"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                disabled={loading || isApplyingFilters}
                className="admin-btn admin-btn-primary flex-1 md:flex-none justify-center"
              >
                {isApplyingFilters ? 'Applying...' : 'Apply Filters'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1">Admin ID</label>
              <input
                type="number"
                value={filters.adminId}
                onChange={(e) => handleFilterChange('adminId', e.target.value)}
                placeholder="Enter admin ID"
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1">Action Type</label>
              <select
                value={filters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                className="admin-input"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1">Resource Type</label>
              <input
                type="text"
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                placeholder="User, Permission, etc."
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--admin-text-secondary)] mb-1">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--admin-text-secondary)]" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search logs..."
                  className="admin-input pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="admin-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">Activity Logs</h3>
            <div className="text-sm text-[var(--admin-text-secondary)]">
              Showing <span className="font-semibold text-[var(--admin-text-primary)]">{Math.min(startIndex + 1, totalLogs)}-{Math.min(endIndex, totalLogs)}</span> of <span className="font-semibold text-[var(--admin-text-primary)]">{totalLogs}</span> logs
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Admin</th>
                  <th>Details</th>
                  <th>Severity</th>
                  <th>Timestamp</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-[var(--admin-text-muted)]">
                      {filters.search ? 'No logs found matching your search' : 'No logs found'}
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log, index) => (
                    <tr key={index}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-[var(--admin-bg-hover)]">
                            {getActionIcon(log.action_type)}
                          </div>
                          <div>
                            <div className="font-semibold capitalize text-[var(--admin-text-primary)]">
                              {log.action_type || 'action'}
                            </div>
                            <div className="text-xs text-[var(--admin-text-secondary)]">
                              {log.resource_type || 'General'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-[var(--admin-text-primary)]">
                          {log.admin_name || log.admin_username || 'Unknown Admin'}
                        </div>
                        <div className="text-xs text-[var(--admin-text-secondary)]">
                          ID: {log.admin_id || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="max-w-xs truncate text-[var(--admin-text-primary)]" title={log.action_description || log.description}>
                          {log.action_description || log.description || 'No description'}
                        </div>
                        {log.resource_id && (
                          <div className="text-xs text-[var(--admin-text-secondary)] font-mono mt-0.5">
                            ID: {log.resource_id}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${(log.severity || '').toLowerCase() === 'critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                          (log.severity || '').toLowerCase() === 'high' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            (log.severity || '').toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                              'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                          {log.severity || 'Info'}
                        </span>
                      </td>
                      <td className="text-sm text-[var(--admin-text-secondary)] whitespace-nowrap">
                        {formatDateTime(log.timestamp || log.created_at)}
                      </td>
                      <td className="text-sm font-mono text-[var(--admin-text-secondary)]">
                        {log.ip_address || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredLogs.length > pageSize && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[var(--admin-border)]">
              <div className="text-sm text-[var(--admin-text-secondary)]">
                Page {currentPage} of {Math.ceil(totalLogs / pageSize)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="admin-btn admin-btn-secondary py-1 px-3 text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={endIndex >= filteredLogs.length}
                  className="admin-btn admin-btn-secondary py-1 px-3 text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogsView;