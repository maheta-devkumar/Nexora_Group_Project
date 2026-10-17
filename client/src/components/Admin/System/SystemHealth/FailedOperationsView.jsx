import React, { useState, useCallback } from 'react';
import { useSystemContext } from '../../../../context/SystemContext';
import { FiAlertTriangle, FiFilter, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import './FailedOperationsView.css';

const FailedOperationsView = () => {
  const {
    systemHealth,
    fetchFailedOperationsSummary
  } = useSystemContext();

  const [timeRange, setTimeRange] = useState(7); // 7 days
  const [loadingTimeRange, setLoadingTimeRange] = useState(false);

  const handleTimeRangeChange = useCallback(async (days) => {
    setTimeRange(days);
    setLoadingTimeRange(true);
    try {
      await fetchFailedOperationsSummary(days);
    } catch (err) {
      console.error('Error fetching failed operations:', err);
    } finally {
      setLoadingTimeRange(false);
    }
  }, [fetchFailedOperationsSummary]);

  const failedOps = systemHealth?.failedOperationsSummary;

  if (!failedOps && !loadingTimeRange) {
    return (
      <div className="failed-operations-loading">
        <div className="spinner"></div>
        <p>Loading failed operations data...</p>
      </div>
    );
  }

  const timeRanges = [
    { days: 1, label: '24 Hours' },
    { days: 7, label: '7 Days' },
    { days: 30, label: '30 Days' }
  ];

  const getTrendIcon = (trend) => {
    if (trend > 0) {
      return <FiTrendingUp className="text-red-500" />;
    } else if (trend < 0) {
      return <FiTrendingDown className="text-green-500" />;
    }
    return null;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'positive';
    if (trend < 0) return 'negative';
    return '';
  };

  const totalFailed = failedOps?.total_failed || failedOps?.count || 0;
  const errorDistribution = failedOps?.error_distribution || failedOps?.errors || [];
  const recentFailures = failedOps?.recent_failures || failedOps?.recent || [];

  return (
    <div className="failed-operations-container">
      <div className="failed-operations-header">
        <div className="failed-operations-header-content">
          <div className="failed-operations-title">
            <div className="failed-operations-icon">
              <FiAlertTriangle />
            </div>
            <h3>Failed Operations</h3>
          </div>
          
          <div className="failed-operations-time-range">
            {timeRanges.map((range) => (
              <button
                key={range.days}
                onClick={() => handleTimeRangeChange(range.days)}
                disabled={loadingTimeRange}
                className={`failed-operations-time-btn ${timeRange === range.days ? 'active' : ''}`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="failed-operations-description">
          <p>System errors and failures overview</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="failed-operations-stats">
        <div className="failed-operations-stats-grid">
          <div className="failed-operations-stat-card red">
            <div className="failed-operations-stat-value">
              {totalFailed}
            </div>
            <div className="failed-operations-stat-label">
              Total Failed Operations
            </div>
            {failedOps?.failure_trend !== undefined && (
              <div className={`failed-operations-stat-trend ${getTrendColor(failedOps.failure_trend)}`}>
                {getTrendIcon(failedOps.failure_trend)}
                <span>
                  {failedOps.failure_trend > 0 ? '+' : ''}{failedOps.failure_trend}%
                </span>
              </div>
            )}
          </div>

          <div className="failed-operations-stat-card yellow">
            <div className="failed-operations-stat-value">
              {failedOps?.unique_errors || errorDistribution.length || 0}
            </div>
            <div className="failed-operations-stat-label">
              Unique Error Types
            </div>
          </div>

          <div className="failed-operations-stat-card blue">
            <div className="failed-operations-stat-value">
              {failedOps?.resolution_rate 
                ? `${Math.round(failedOps.resolution_rate)}%`
                : 'N/A'
              }
            </div>
            <div className="failed-operations-stat-label">
              Resolution Rate
            </div>
          </div>
        </div>
      </div>

      {/* Error Distribution */}
      {errorDistribution.length > 0 && (
        <div className="failed-operations-distribution">
          <h4>Error Type Distribution</h4>
          <div className="failed-operations-error-list">
            {errorDistribution.map((error, index) => (
              <div key={index} className="failed-operations-error-item">
                <div className="failed-operations-error-header">
                  <span className="failed-operations-error-name">
                    {error.error_type || error.type || 'Unknown Error'}
                  </span>
                  <span className="failed-operations-error-count">
                    {error.count || 0} occurrences
                  </span>
                </div>
                <div className="failed-operations-error-progress">
                  <div 
                    className="failed-operations-error-progress-fill"
                    style={{ 
                      width: `${totalFailed > 0 ? ((error.count || 0) / totalFailed) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                {error.last_occurrence && (
                  <div className="failed-operations-error-time">
                    Last: {new Date(error.last_occurrence).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Failures */}
      {recentFailures.length > 0 && (
        <div className="failed-operations-recent">
          <h4>Recent Failures</h4>
          <div className="failed-operations-recent-list">
            {recentFailures.slice(0, 5).map((failure, index) => (
              <div key={index} className="failed-operations-recent-item">
                <div className="failed-operations-recent-header">
                  <p className="failed-operations-recent-title">
                    {failure.operation_name || failure.endpoint || 'Unknown Operation'}
                  </p>
                  <div className="failed-operations-recent-time">
                    {failure.timestamp ? new Date(failure.timestamp).toLocaleTimeString() : 'Unknown time'}
                  </div>
                </div>
                <p className="failed-operations-recent-message">
                  {failure.error_message || failure.message || 'Unknown error'}
                </p>
                <div className="failed-operations-recent-meta">
                  <span>
                    {failure.user_id ? `User: ${failure.user_id}` : 'System'}
                  </span>
                  {failure.endpoint && (
                    <span className="failed-operations-recent-endpoint">
                      Endpoint: {failure.endpoint}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FailedOperationsView;