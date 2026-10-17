import React, { useEffect, useCallback } from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import FailedOperationsView from './FailedOperationsView';
import {
  FiServer,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiBarChart2
} from 'react-icons/fi';
import './HealthDashboard.css';
import AdminLayout from '../../../Layout/AdminLayout';

const HealthDashboard = () => {
  const {
    fetchSystemHealthStatus,
    fetchApiUsageOverview,
    fetchFailedOperationsSummary,
    systemHealth,
    loading,
    error,
    clearError
  } = useSystemContext();

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchSystemHealthStatus(),
        fetchApiUsageOverview(),
        fetchFailedOperationsSummary()
      ]);
    } catch (err) {
      console.error('Error loading health data:', err);
    }
  }, [fetchSystemHealthStatus, fetchApiUsageOverview, fetchFailedOperationsSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusColor = (status) => {
    if (!status) return 'loading';

    switch (status.toUpperCase()) {
      case 'HEALTHY': return 'healthy';
      case 'DEGRADED': return 'degraded';
      case 'UNHEALTHY': return 'unhealthy';
      default: return 'loading';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <FiActivity className="text-gray-500" />;

    switch (status.toUpperCase()) {
      case 'HEALTHY': return <FiCheckCircle className="text-green-500" />;
      case 'DEGRADED': return <FiAlertTriangle className="text-yellow-500" />;
      case 'UNHEALTHY': return <FiXCircle className="text-red-500" />;
      default: return <FiActivity className="text-gray-500" />;
    }
  };

  const healthComponents = systemHealth?.healthStatus?.components || {};

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">System Health</h1>
            <p className="text-[var(--admin-text-secondary)] mt-1">Monitor system performance and health metrics</p>
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

        {/* Overall Health Status */}
        <div className="admin-card mb-6">
          <div className="flex justify-between items-center mb-6 border-b border-[var(--admin-border)] pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <FiServer size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">Overall System Health</h3>
                <p className="text-sm text-[var(--admin-text-secondary)]">Current system status and performance</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-sm tracking-wider ${(systemHealth?.healthStatus?.overall_status || '').toUpperCase() === 'HEALTHY' ? 'bg-green-100 text-green-700' :
              (systemHealth?.healthStatus?.overall_status || '').toUpperCase() === 'DEGRADED' ? 'bg-yellow-100 text-yellow-700' :
                (systemHealth?.healthStatus?.overall_status || '').toUpperCase() === 'UNHEALTHY' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
              }`}>
              {systemHealth?.healthStatus?.overall_status || 'LOADING'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(healthComponents).map(([component, status]) => (
              <div key={component} className="admin-card bg-[var(--admin-bg-hover)] border border-[var(--admin-border)] shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-[var(--admin-text-primary)] capitalize">
                    {component.replace(/_/g, ' ')}
                  </span>
                  {getStatusIcon(status)}
                </div>
                <div className={`text-sm font-medium ${(status || '').toUpperCase() === 'HEALTHY' ? 'text-green-600' :
                  (status || '').toUpperCase() === 'DEGRADED' ? 'text-yellow-600' :
                    (status || '').toUpperCase() === 'UNHEALTHY' ? 'text-red-600' :
                      'text-gray-500'
                  }`}>
                  {status || 'UNKNOWN'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Performance */}
        {systemHealth?.apiUsageOverview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="admin-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <FiBarChart2 size={24} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-[var(--admin-text-primary)] mb-1">
                  {systemHealth.apiUsageOverview.avg_response_time || systemHealth.apiUsageOverview.average_response_time || 0}ms
                </div>
                <div className="text-sm text-[var(--admin-text-secondary)]">Average Response Time</div>
              </div>
              <div className="mt-4 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block self-start">
                Target: {systemHealth.apiUsageOverview.target_response_time || 500}ms
              </div>
            </div>

            <div className="admin-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <FiActivity size={24} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-[var(--admin-text-primary)] mb-1">
                  {(systemHealth.apiUsageOverview.total_requests || 0).toLocaleString()}
                </div>
                <div className="text-sm text-[var(--admin-text-secondary)]">Total Requests (24h)</div>
              </div>
            </div>

            <div className="admin-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <FiCheckCircle size={24} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-[var(--admin-text-primary)] mb-1">
                  {systemHealth.apiUsageOverview.success_rate
                    ? `${Math.round(systemHealth.apiUsageOverview.success_rate)}%`
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-[var(--admin-text-secondary)]">Success Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Component Details */}
        <div className="admin-card mb-6">
          <h3 className="text-lg font-bold text-[var(--admin-text-primary)] mb-6">Component Details</h3>
          <div className="space-y-4">
            {Object.entries(healthComponents).map(([component, status]) => {
              const details = systemHealth?.healthStatus?.details?.[component];
              return (
                <div key={component} className="border border-[var(--admin-border)] rounded-lg p-4 hover:bg-[var(--admin-bg-hover)] transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <span className="font-semibold text-[var(--admin-text-primary)] capitalize">
                        {component.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${(status || '').toUpperCase() === 'HEALTHY' ? 'bg-green-100 text-green-700' :
                      (status || '').toUpperCase() === 'DEGRADED' ? 'bg-yellow-100 text-yellow-700' :
                        (status || '').toUpperCase() === 'UNHEALTHY' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {status || 'UNKNOWN'}
                    </span>
                  </div>

                  {details && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-3 pt-3 border-t border-[var(--admin-border)]">
                      {details.version && (
                        <div>
                          <span className="text-[var(--admin-text-secondary)] block text-xs">Version</span>
                          <span className="font-mono text-[var(--admin-text-primary)]">{details.version}</span>
                        </div>
                      )}
                      {details.uptime && (
                        <div>
                          <span className="text-[var(--admin-text-secondary)] block text-xs">Uptime</span>
                          <span className="text-[var(--admin-text-primary)]">{details.uptime}</span>
                        </div>
                      )}
                      {details.last_check && (
                        <div>
                          <span className="text-[var(--admin-text-secondary)] block text-xs">Last Check</span>
                          <span className="text-[var(--admin-text-primary)]">{details.last_check}</span>
                        </div>
                      )}
                      {details.message && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-4">
                          <span className="text-[var(--admin-text-secondary)] block text-xs">Message</span>
                          <span className="text-[var(--admin-text-primary)] italic">{details.message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Failed Operations */}
        <div className="mb-6">
          <FailedOperationsView />
        </div>
      </div>
    </AdminLayout>
  );
};

export default HealthDashboard;