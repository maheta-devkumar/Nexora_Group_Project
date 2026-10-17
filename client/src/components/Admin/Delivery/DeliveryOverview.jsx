import React, { useEffect } from 'react';
import { useDeliveryContext } from '../../../context/DeliveryContext';
import './DeliveryOverview.css';

const DeliveryOverview = () => {
  const {
    deliveryOverview, // Cached data from Context
    adminFetchOverview, // New consolidated fetcher
    loading
  } = useDeliveryContext();

  useEffect(() => {
    // Only fetch if data is missing (Caching Strategy)
    if (!deliveryOverview) {
      adminFetchOverview();
    }
  }, [deliveryOverview, adminFetchOverview]);

  // Safe access to stats from the optimized structure
  const stats = deliveryOverview || {};
  const delivery_stats = stats.delivery_stats || {};
  const recent_activity = Array.isArray(stats.recent_activity) ? stats.recent_activity : [];

  const statsCards = [
    {
      title: 'Total Deliveries',
      value: stats.total_deliveries || 0,
      icon: '📦',
      color: '#4CAF50',
      change: stats.delivery_growth ? `${stats.delivery_growth}%` : '0%'
    },
    {
      title: 'Delivered',
      value: stats.delivered_count || 0,
      icon: '✅',
      color: '#2196F3',
      percent: delivery_stats.delivered_rate || '0%'
    },
    {
      title: 'Pending',
      value: stats.pending_count || 0,
      icon: '⏳',
      color: '#FF9800',
      percent: delivery_stats.pending_rate || '0%'
    },
    {
      title: 'Failed',
      value: stats.failed_count || 0,
      icon: '❌',
      color: '#F44336',
      percent: delivery_stats.failed_rate || '0%'
    },
    {
      title: 'Avg Delivery Time',
      value: stats.avg_delivery_time ? `${stats.avg_delivery_time} mins` : '0 mins',
      icon: '⏱️',
      color: '#9C27B0',
      change: stats.time_improvement ? `${stats.time_improvement}% faster` : ''
    },
    {
      title: 'Active Delivery Persons',
      value: stats.active_delivery_persons || 0,
      icon: '🚚',
      color: '#00BCD4',
      change: stats.available_delivery_persons ? `${stats.available_delivery_persons} available` : ''
    }
  ];

  return (
    <div className="delivery-overview">
      <div className="overview-header">
        <h2>Delivery Dashboard</h2>
        <p className="last-updated">Real-time delivery metrics and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statsCards.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
            <div className="stat-icon" style={{ backgroundColor: stat.color + '20' }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-meta">
                {stat.percent && <span className="percent">{stat.percent}</span>}
                {stat.change && <span className="change">{stat.change}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn assign-btn">
            <span className="action-icon">➕</span>
            Assign Delivery
          </button>
          <button className="action-btn view-pool-btn">
            <span className="action-icon">👥</span>
            View Delivery Pool
          </button>
          <button className="action-btn issues-btn">
            <span className="action-icon">⚠️</span>
            View Issues
          </button>
          <button className="action-btn analytics-btn">
            <span className="action-icon">📊</span>
            Generate Report
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Delivery Activity</h3>
        <div className="activity-list">
          {loading ? (
            <div className="loading-activity">Loading activity...</div>
          ) : recent_activity.length > 0 ? (
            recent_activity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">{activity.icon || '📦'}</div>
                <div className="activity-details">
                  <p className="activity-text">{activity.description || 'No description'}</p>
                  <span className="activity-time">{activity.time || 'Just now'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryOverview;