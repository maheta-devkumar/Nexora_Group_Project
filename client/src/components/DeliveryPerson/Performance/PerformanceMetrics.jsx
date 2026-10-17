import React from 'react';
import './PerformanceMetrics.css';

const PerformanceMetrics = ({ metrics, loading }) => {
    if (loading && !metrics) {
        return (
            <div className="performance-metrics">
                {[1, 2, 3, 4].map(i => (
                    <div className="metric-card loading" key={i}>
                        <div className="metric-header">
                            <div className="metric-title-skeleton"></div>
                            <div className="metric-trend-skeleton"></div>
                        </div>
                        <div className="metric-value-skeleton"></div>
                        <div className="metric-progress-skeleton"></div>
                    </div>
                ))}
            </div>
        );
    }

    // Safe data access
    const getMetricValue = (key, defaultValue = '0') => {
        if (!metrics || typeof metrics !== 'object') return defaultValue;
        return metrics[key] !== undefined ? metrics[key] : defaultValue;
    };

    // Get trend direction
    const getTrendDirection = (value) => {
        if (typeof value === 'number') {
            return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
        }
        return 'neutral';
    };

    // Format percentage
    const formatPercentage = (value) => {
        if (typeof value === 'number') {
            return `${value.toFixed(1)}%`;
        }
        return value;
    };

    // Format time
    const formatTime = (minutes) => {
        if (typeof minutes === 'number') {
            if (minutes < 60) {
                return `${Math.round(minutes)} min`;
            } else {
                const hours = minutes / 60;
                return `${hours.toFixed(1)} hrs`;
            }
        }
        return minutes || '0 min';
    };

    // Get metrics data
    const metricsData = [
        {
            id: 1,
            title: 'On-Time Delivery Rate',
            value: formatPercentage(getMetricValue('on_time_rate', 92.5)),
            trend: getMetricValue('on_time_trend', '+5.2%'),
            trendDirection: getTrendDirection(getMetricValue('on_time_trend_value', 5.2)),
            progress: parseFloat(getMetricValue('on_time_rate', 92.5)),
            target: 90,
            showProgress: true
        },
        {
            id: 2,
            title: 'Customer Rating',
            value: `${parseFloat(getMetricValue('average_rating', 4.8)).toFixed(1)}/5.0`,
            trend: getMetricValue('rating_trend', '+0.2'),
            trendDirection: getTrendDirection(getMetricValue('rating_trend_value', 0.2)),
            stars: parseFloat(getMetricValue('average_rating', 4.8)),
            showStars: true
        },
        {
            id: 3,
            title: 'Delivery Speed',
            value: formatTime(getMetricValue('average_delivery_time', 28)),
            trend: getMetricValue('speed_trend', '+12%'),
            trendDirection: getTrendDirection(getMetricValue('speed_trend_value', 12)),
            info: 'Average delivery time',
            showInfo: true
        },
        {
            id: 4,
            title: 'Cancellation Rate',
            value: formatPercentage(getMetricValue('cancellation_rate', 1.2)),
            trend: getMetricValue('cancellation_trend', '-0.5%'),
            trendDirection: getTrendDirection(getMetricValue('cancellation_trend_value', -0.5)),
            info: 'Below target of 2%',
            showInfo: true
        }
    ];

    return (
        <div className="performance-metrics">
            {metricsData.map(metric => (
                <div className="metric-card" key={metric.id}>
                    <div className="metric-header">
                        <h4>{metric.title}</h4>
                        {metric.trend && (
                            <span className={`metric-trend ${metric.trendDirection}`}>
                                {metric.trend}
                            </span>
                        )}
                    </div>
                    
                    <div className="metric-value">{metric.value}</div>
                    
                    {metric.showProgress && (
                        <div className="metric-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${Math.min(metric.progress || 0, 100)}%` }}
                                ></div>
                            </div>
                            <span>Target: {metric.target}%</span>
                        </div>
                    )}
                    
                    {metric.showStars && (
                        <div className="metric-stars">
                            {[...Array(5)].map((_, i) => (
                                <i 
                                    key={i}
                                    data-lucide="star"
                                    className={i < Math.floor(metric.stars || 0) ? 'filled' : ''}
                                ></i>
                            ))}
                            {metric.stars % 1 >= 0.5 && (
                                <i data-lucide="star" className="half-filled"></i>
                            )}
                        </div>
                    )}
                    
                    {metric.showInfo && metric.info && (
                        <div className="metric-info">{metric.info}</div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PerformanceMetrics;