import React, { useState, useEffect } from 'react';
import { FaChartBar, FaChartPie, FaChartLine, FaFilter, FaCalendar } from 'react-icons/fa';
import StatsCards from './StatsCards';
import './AnalyticsPanel.css';

const AnalyticsPanel = ({ 
    stats, 
    typeStats, 
    loading, 
    onRefresh,
    onDateRangeChange 
}) => {
    const [dateRange, setDateRange] = useState('7days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const dateRanges = [
        { value: 'today', label: 'Today' },
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: '90days', label: 'Last 90 Days' },
        { value: 'custom', label: 'Custom Range' }
    ];

    useEffect(() => {
        if (dateRange !== 'custom' && onDateRangeChange) {
            onDateRangeChange(dateRange);
        }
    }, [dateRange]);

    const handleCustomDateSubmit = () => {
        if (customStartDate && customEndDate && onDateRangeChange) {
            onDateRangeChange('custom', customStartDate, customEndDate);
        }
    };

    if (loading && !stats) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="analytics-panel">
            {/* Header with Controls */}
            <div className="analytics-header">
                <div className="header-main">
                    <div>
                        <h2 className="analytics-title">
                            <FaChartBar /> Notification Analytics
                        </h2>
                        <p className="analytics-subtitle">Monitor notification trends and user engagement</p>
                    </div>
                    
                    <div className="controls">
                        {/* Date Range Selector */}
                        <div className="date-selector">
                            <FaCalendar className="calendar-icon" />
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="date-select"
                                disabled={loading}
                            >
                                {dateRanges.map(range => (
                                    <option key={range.value} value={range.value}>
                                        {range.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="btn-refresh"
                        >
                            <FaFilter />
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* Custom Date Range Inputs */}
                {dateRange === 'custom' && (
                    <div className="custom-date-range">
                        <div className="date-inputs">
                            <div className="date-input-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="date-input"
                                />
                            </div>
                            <div className="date-input-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="date-input"
                                />
                            </div>
                            <div className="date-apply">
                                <button
                                    onClick={handleCustomDateSubmit}
                                    disabled={!customStartDate || !customEndDate}
                                    className="btn-apply"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} typeStats={typeStats} />

            {/* Additional Analytics Sections */}
            <div className="analytics-grid">
                {/* Activity Trends */}
                <div className="activity-trends">
                    <div className="section-header">
                        <FaChartLine />
                        <h3>Activity Trends</h3>
                    </div>
                    <div className="progress-container">
                        <div className="progress-item">
                            <div className="progress-header">
                                <span className="progress-label">Notifications per User</span>
                                <span className="progress-value">{stats?.average_notifications_per_user?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${Math.min((stats?.average_notifications_per_user || 0) * 10, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        
                        <div className="progress-item">
                            <div className="progress-header">
                                <span className="progress-label">Read Rate</span>
                                <span className="progress-value">
                                    {stats?.total_notifications ? 
                                        `${(((stats.total_notifications - (stats.total_unread || 0)) / stats.total_notifications) * 100).toFixed(1)}%` : 
                                        '0%'}
                                </span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ 
                                        width: `${stats?.total_notifications ? 
                                            (((stats.total_notifications - (stats.total_unread || 0)) / stats.total_notifications) * 100) : 
                                            0}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Type Distribution */}
                <div className="type-distribution">
                    <div className="section-header">
                        <FaChartPie />
                        <h3>Type Distribution</h3>
                    </div>
                    {typeStats?.stats && typeStats.stats.length > 0 ? (
                        <div className="distribution-list">
                            {typeStats.stats.map((typeStat, index) => (
                                <div key={index} className="distribution-item">
                                    <div className="distribution-header">
                                        <span className="distribution-label">{typeStat.type.toLowerCase()}</span>
                                        <span className="distribution-value">{typeStat.percentage}%</span>
                                    </div>
                                    <div className="distribution-bar">
                                        <div 
                                            className="distribution-fill" 
                                            style={{ 
                                                width: `${typeStat.percentage}%`,
                                                backgroundColor: getColorForType(typeStat.type)
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">No type distribution data available</p>
                    )}
                </div>
            </div>

            {/* Insights */}
            <div className="insights-container">
                <h3 className="insights-title">Insights</h3>
                <div className="insights-grid">
                    <div className="insight-card blue">
                        <div className="insight-card-title">Most Active Users</div>
                        <div className="insight-card-value">
                            {stats?.total_users_with_notifications || 0}
                        </div>
                        <div className="insight-card-sub">Users have received notifications</div>
                    </div>
                    
                    <div className="insight-card green">
                        <div className="insight-card-title">Engagement Rate</div>
                        <div className="insight-card-value">
                            {stats?.total_notifications && stats.total_unread ? 
                                `${(100 - ((stats.total_unread / stats.total_notifications) * 100)).toFixed(1)}%` : 
                                '0%'}
                        </div>
                        <div className="insight-card-sub">Notifications have been read</div>
                    </div>
                    
                    <div className="insight-card purple">
                        <div className="insight-card-title">Daily Average</div>
                        <div className="insight-card-value">
                            {stats?.total_notifications ? (stats.total_notifications / 30).toFixed(1) : '0.0'}
                        </div>
                        <div className="insight-card-sub">Notifications per day (30-day avg)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function for type colors
const getColorForType = (type) => {
    const colors = {
        ORDER: '#3b82f6',
        PAYMENT: '#10b981',
        DELIVERY: '#8b5cf6',
        OFFER: '#f59e0b',
        FEEDBACK: '#ec4899',
        SYSTEM: '#6b7280'
    };
    return colors[type] || '#6b7280';
};

export default AnalyticsPanel;