import React, { useState, useEffect } from 'react';
import { useDeliveryContext } from '../../../context/DeliveryContext';
import './DeliveryPerformance.css';

const DeliveryPerformance = () => {
  const { 
    deliveryPerformance = [], 
    adminGetDeliveryPersonPerformance,
    loading 
  } = useDeliveryContext();

  const [timeRange, setTimeRange] = useState('week');
  const [sortBy, setSortBy] = useState('success_rate');
  const [sortedPerformance, setSortedPerformance] = useState([]);

  useEffect(() => {
    adminGetDeliveryPersonPerformance();
  }, [adminGetDeliveryPersonPerformance]);

  useEffect(() => {
    if (deliveryPerformance && deliveryPerformance.length > 0) {
      const sorted = [...deliveryPerformance].sort((a, b) => {
        const aName = a.delivery_person_name || '';
        const bName = b.delivery_person_name || '';
        
        switch (sortBy) {
          case 'name':
            return aName.localeCompare(bName);
          case 'deliveries':
            return (b.total_deliveries || 0) - (a.total_deliveries || 0);
          case 'success_rate':
            return (b.success_rate || 0) - (a.success_rate || 0);
          case 'avg_time':
            return (a.avg_delivery_time || 0) - (b.avg_delivery_time || 0);
          case 'rating':
            return (b.avg_rating || 0) - (a.avg_rating || 0);
          default:
            return 0;
        }
      });
      setSortedPerformance(sorted);
    } else {
      setSortedPerformance([]);
    }
  }, [deliveryPerformance, sortBy]);

  const calculateSuccessRate = (successful, total) => {
    if (!total || total === 0) return 0;
    return Math.round((successful / total) * 100);
  };

  const formatTime = (minutes) => {
    if (!minutes && minutes !== 0) return '0m';
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getPerformanceScore = (performance) => {
    if (!performance) return 0;
    
    const successWeight = 0.4;
    const timeWeight = 0.3;
    const ratingWeight = 0.3;

    const successScore = performance.success_rate || 0;
    const timeScore = performance.avg_delivery_time > 0 
      ? Math.max(0, 100 - (performance.avg_delivery_time * 0.5))
      : 0;
    const ratingScore = (performance.avg_rating || 0) * 20;

    return Math.round(
      (successScore * successWeight) + 
      (timeScore * timeWeight) + 
      (ratingScore * ratingWeight)
    );
  };

  const getScoreColor = (score) => {
    if (!score && score !== 0) return '#757575';
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#8BC34A';
    if (score >= 60) return '#FFC107';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const performanceData = Array.isArray(deliveryPerformance) ? deliveryPerformance : [];
  const hasData = performanceData.length > 0;

  return (
    <div className="delivery-performance">
      <div className="performance-header">
        <div>
          <h2>Delivery Performance</h2>
          <p className="subtitle">Monitor and analyze delivery person performance metrics</p>
        </div>
        <button 
          className="refresh-btn"
          onClick={adminGetDeliveryPersonPerformance}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Time Range Filter */}
      <div className="time-range-filter">
        <div className="filter-buttons">
          <button 
            className={`range-btn ${timeRange === 'today' ? 'active' : ''}`}
            onClick={() => setTimeRange('today')}
          >
            Today
          </button>
          <button 
            className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button 
            className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
          <button 
            className={`range-btn ${timeRange === 'quarter' ? 'active' : ''}`}
            onClick={() => setTimeRange('quarter')}
          >
            This Quarter
          </button>
          <button 
            className={`range-btn ${timeRange === 'year' ? 'active' : ''}`}
            onClick={() => setTimeRange('year')}
          >
            This Year
          </button>
        </div>

        <div className="sort-controls">
          <span className="sort-label">Sort by:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="success_rate">Success Rate</option>
            <option value="deliveries">Total Deliveries</option>
            <option value="avg_time">Avg Delivery Time</option>
            <option value="rating">Customer Rating</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>Average Success Rate</h3>
            <div className="metric-value">
              {hasData
                ? Math.round(performanceData.reduce((sum, p) => sum + (p.success_rate || 0), 0) / performanceData.length)
                : 0
              }%
            </div>
            <div className="metric-change">Overall performance</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <h3>Avg Delivery Time</h3>
            <div className="metric-value">
              {hasData
                ? formatTime(performanceData.reduce((sum, p) => sum + (p.avg_delivery_time || 0), 0) / performanceData.length)
                : '0m'
              }
            </div>
            <div className="metric-change">Across all deliveries</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-content">
            <h3>Avg Customer Rating</h3>
            <div className="metric-value">
              {hasData
                ? (performanceData.reduce((sum, p) => sum + (p.avg_rating || 0), 0) / performanceData.length).toFixed(1)
                : '0.0'
              }/5
            </div>
            <div className="metric-change">Based on customer feedback</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Active Delivery Persons</h3>
            <div className="metric-value">{performanceData.length}</div>
            <div className="metric-change">Currently active</div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="performance-table-container">
        {loading ? (
          <div className="loading-performance">
            <div className="spinner"></div>
            <p>Loading performance data...</p>
          </div>
        ) : sortedPerformance.length === 0 ? (
          <div className="no-performance">
            <div className="no-performance-icon">📈</div>
            <h3>No Performance Data</h3>
            <p>No performance data available for the selected period</p>
          </div>
        ) : (
          <table className="performance-table">
            <thead>
              <tr>
                <th>Delivery Person</th>
                <th>Total Deliveries</th>
                <th>Successful</th>
                <th>Failed</th>
                <th>Success Rate</th>
                <th>Avg Delivery Time</th>
                <th>Avg Rating</th>
                <th>Performance Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPerformance.map((performance, index) => {
                const performanceScore = getPerformanceScore(performance);
                const scoreColor = getScoreColor(performanceScore);

                return (
                  <tr key={performance.delivery_person_id || index}>
                    <td className="person-cell">
                      <div className="person-info">
                        <div className="person-name">{performance.delivery_person_name || 'Unknown'}</div>
                        <div className="person-id">ID: {performance.delivery_person_id || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="deliveries-cell">
                      <div className="deliveries-count">{performance.total_deliveries || 0}</div>
                    </td>
                    <td className="successful-cell">
                      <div className="successful-count">{performance.successful_deliveries || 0}</div>
                    </td>
                    <td className="failed-cell">
                      <div className="failed-count">{performance.failed_deliveries || 0}</div>
                    </td>
                    <td className="rate-cell">
                      <div className="rate-container">
                        <div className="rate-bar">
                          <div 
                            className="rate-fill"
                            style={{ 
                              width: `${performance.success_rate || 0}%`,
                              backgroundColor: (performance.success_rate || 0) >= 90 ? '#4CAF50' :
                                             (performance.success_rate || 0) >= 80 ? '#8BC34A' :
                                             (performance.success_rate || 0) >= 70 ? '#FFC107' :
                                             (performance.success_rate || 0) >= 60 ? '#FF9800' : '#F44336'
                            }}
                          />
                        </div>
                        <span className="rate-text">{performance.success_rate || 0}%</span>
                      </div>
                    </td>
                    <td className="time-cell">
                      <div className="time-value">{formatTime(performance.avg_delivery_time)}</div>
                    </td>
                    <td className="rating-cell">
                      <div className="rating-container">
                        <div className="stars">
                          {'★'.repeat(Math.floor(performance.avg_rating || 0))}
                          {'☆'.repeat(5 - Math.floor(performance.avg_rating || 0))}
                        </div>
                        <span className="rating-text">{(performance.avg_rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="score-cell">
                      <div 
                        className="score-badge"
                        style={{ backgroundColor: scoreColor }}
                      >
                        {performanceScore}
                      </div>
                    </td>
                    <td className="actions-cell">
                      <div className="performance-actions">
                        <button
                          className="action-btn details-btn"
                          onClick={() => alert(`View detailed performance for ${performance.delivery_person_name || 'unknown'}`)}
                        >
                          Details
                        </button>
                        <button
                          className="action-btn feedback-btn"
                          onClick={() => alert(`View feedback for ${performance.delivery_person_name || 'unknown'}`)}
                        >
                          Feedback
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Performance Summary */}
      {sortedPerformance.length > 0 && (
        <div className="performance-summary">
          <h3>Performance Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Top Performer:</span>
              <span className="value">
                {sortedPerformance[0]?.delivery_person_name || 'N/A'}
                <span className="score">
                  ({getPerformanceScore(sortedPerformance[0])})
                </span>
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Avg Success Rate:</span>
              <span className="value">
                {Math.round(sortedPerformance.reduce((sum, p) => sum + (p.success_rate || 0), 0) / sortedPerformance.length)}%
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Total Deliveries Tracked:</span>
              <span className="value">
                {sortedPerformance.reduce((sum, p) => sum + (p.total_deliveries || 0), 0)}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Need Improvement:</span>
              <span className="value">
                {sortedPerformance.filter(p => (p.success_rate || 0) < 70).length} persons
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPerformance;