import React, { useEffect, useState } from 'react';
import { usePerformanceContext } from '../../../context/delivery_panel/PerformanceContext';
import DeliveryLayout from '../../../components/DeliveryPerson/Layout/DeliveryLayout';
import PerformanceMetrics from '../../../components/DeliveryPerson/Performance/PerformanceMetrics';
import PerformanceChart from '../../../components/DeliveryPerson/Performance/PerformanceChart';
import './Performance.css';

const Performance = () => {
    const {
        performanceMetrics,
        performanceCharts,
        ratingHistory,
        performanceBadges,
        performanceTrends,
        peerComparison,
        completeData,
        loading,
        error,
        fetchAllPerformanceData,
        fetchPerformanceMetrics,
        fetchPerformanceCharts,
        fetchPerformanceBadges,
        fetchRatingHistory,
        clearError,
        updatePeriod,
        selectedPeriod
    } = usePerformanceContext();

    const [activeChartFilter, setActiveChartFilter] = useState('Weekly');
    const [periodFilter, setPeriodFilter] = useState('This Week');

    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchAllPerformanceData();
            } catch (err) {
                console.error('Error loading performance data:', err);
            }
        };
        
        loadData();
    }, []);

    const handlePeriodChange = (period) => {
        setPeriodFilter(period);
        
        let apiPeriod = 'last_7_days';
        switch(period) {
            case 'This Week':
                apiPeriod = 'last_7_days';
                break;
            case 'Last Week':
                apiPeriod = 'last_week';
                break;
            case 'This Month':
                apiPeriod = 'this_month';
                break;
            case 'Last Month':
                apiPeriod = 'last_month';
                break;
        }
        
        updatePeriod(apiPeriod);
        fetchPerformanceMetrics(apiPeriod);
        fetchPerformanceCharts(apiPeriod, null, null, activeChartFilter === 'Weekly' ? 'day' : 'month');
    };

    const handleChartFilterChange = (filter) => {
        setActiveChartFilter(filter);
        const groupBy = filter === 'Weekly' ? 'day' : 'month';
        fetchPerformanceCharts(selectedPeriod, null, null, groupBy);
    };

    // Helper function to safely get badge data
    const getBadgesData = () => {
        if (!performanceBadges || !performanceBadges.badges) {
            return [
                {
                    id: 1,
                    type: 'gold',
                    icon: 'zap',
                    title: 'Speed Star',
                    description: 'Completed 50 deliveries in record time',
                    earned: true
                },
                {
                    id: 2,
                    type: 'silver',
                    icon: 'star',
                    title: '5-Star Champion',
                    description: 'Maintained 5.0 rating for 30 days',
                    earned: true
                },
                {
                    id: 3,
                    type: 'bronze',
                    icon: 'trending-up',
                    title: 'Consistent Performer',
                    description: 'On-time delivery rate >95% for month',
                    earned: true
                }
            ];
        }

        return performanceBadges.badges.map(badge => ({
            id: badge.id,
            type: badge.type || 'bronze',
            icon: getIconForBadge(badge.type),
            title: badge.title || badge.name || 'Badge',
            description: badge.description || 'Achievement badge',
            earned: badge.earned || true
        }));
    };

    // Helper to get icon for badge type
    const getIconForBadge = (type) => {
        switch(type) {
            case 'speed':
            case 'gold':
                return 'zap';
            case 'rating':
            case 'silver':
                return 'star';
            case 'consistency':
            case 'bronze':
                return 'trending-up';
            default:
                return 'award';
        }
    };

    if (loading && !performanceMetrics) {
        return (
            <DeliveryLayout>
                <div className="page active" id="performance-page">
                    <div className="page-header">
                        <h2>Performance Metrics</h2>
                    </div>
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading performance data...</p>
                    </div>
                </div>
            </DeliveryLayout>
        );
    }

    return (
        <DeliveryLayout>
            <div className="page active" id="performance-page">
                <div className="page-header">
                    <h2>Performance Metrics</h2>
                    <div className="filters">
                        <select 
                            className="filter-select"
                            value={periodFilter}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            disabled={loading}
                        >
                            <option value="This Week">This Week</option>
                            <option value="Last Week">Last Week</option>
                            <option value="This Month">This Month</option>
                            <option value="Last Month">Last Month</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="error-alert">
                        <div className="alert-content">
                            <i data-lucide="alert-circle"></i>
                            <span>{error}</span>
                        </div>
                        <button className="alert-close" onClick={clearError}>
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                )}

                {/* Performance Metrics */}
                <PerformanceMetrics 
                    metrics={performanceMetrics}
                    loading={loading}
                />

                {/* Performance Chart */}
                <PerformanceChart 
                    chartData={performanceCharts}
                    loading={loading}
                    activeFilter={activeChartFilter}
                    onFilterChange={handleChartFilterChange}
                />

                {/* Performance Badges */}
                <div className="badges-section">
                    <h3>Your Badges & Achievements</h3>
                    <div className="badges-grid">
                        {getBadgesData().map(badge => (
                            <div className={`badge-card ${badge.type}`} key={badge.id}>
                                <div className="badge-icon">
                                    <i data-lucide={badge.icon}></i>
                                </div>
                                <div className="badge-info">
                                    <strong>{badge.title}</strong>
                                    <span>{badge.description}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rating History (if available) */}
                {ratingHistory && ratingHistory.ratings && ratingHistory.ratings.length > 0 && (
                    <div className="rating-history-section">
                        <h3>Recent Ratings</h3>
                        <div className="rating-list">
                            {ratingHistory.ratings.slice(0, 5).map((rating, index) => (
                                <div className="rating-item" key={index}>
                                    <div className="rating-header">
                                        <div className="customer-info">
                                            <img 
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(rating.customer_name || 'Customer')}&background=3b82f6&color=fff`} 
                                                alt={rating.customer_name || 'Customer'}
                                            />
                                            <div>
                                                <strong>{rating.customer_name || 'Customer'}</strong>
                                                <span>{rating.date || 'Recently'}</span>
                                            </div>
                                        </div>
                                        <div className="rating-stars">
                                            {[...Array(5)].map((_, i) => (
                                                <i 
                                                    key={i}
                                                    data-lucide="star"
                                                    className={i < (rating.rating || 5) ? 'filled' : ''}
                                                ></i>
                                            ))}
                                        </div>
                                    </div>
                                    {rating.comment && (
                                        <p className="rating-comment">{rating.comment}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Peer Comparison (if available) */}
                {peerComparison && (
                    <div className="peer-comparison-section">
                        <h3>Peer Comparison</h3>
                        <div className="comparison-stats">
                            <div className="comparison-stat">
                                <div className="stat-label">Your Ranking</div>
                                <div className="stat-value">
                                    #{peerComparison.your_rank || 'N/A'} / {peerComparison.total_peers || 'N/A'}
                                </div>
                                <div className="stat-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ 
                                                width: `${(peerComparison.your_percentile || 0)}%` 
                                            }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">
                                        Top {peerComparison.your_percentile || 0}%
                                    </span>
                                </div>
                            </div>
                            <div className="comparison-stat">
                                <div className="stat-label">Average Rating</div>
                                <div className="stat-value">
                                    {peerComparison.your_average_rating?.toFixed(1) || 'N/A'}
                                    <span className="stat-trend positive">
                                        <i data-lucide="trending-up"></i>
                                        {peerComparison.rating_change || 0} from last period
                                    </span>
                                </div>
                            </div>
                            <div className="comparison-stat">
                                <div className="stat-label">On-Time Rate</div>
                                <div className="stat-value">
                                    {peerComparison.your_on_time_rate || 0}%
                                    <span className="stat-trend positive">
                                        <i data-lucide="trending-up"></i>
                                        {peerComparison.on_time_change || 0}% from average
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Performance Trends (if available) */}
                {performanceTrends && (
                    <div className="trends-section">
                        <h3>Performance Trends</h3>
                        <div className="trends-grid">
                            {performanceTrends.trends && performanceTrends.trends.map((trend, index) => (
                                <div className="trend-item" key={index}>
                                    <div className="trend-label">
                                        <i data-lucide={getTrendIcon(trend.metric)}></i>
                                        <span>{trend.metric_name || trend.metric}</span>
                                    </div>
                                    <div className="trend-value">
                                        <span className="trend-number">
                                            {trend.current_value || 0}
                                            {trend.unit || ''}
                                        </span>
                                        <span className={`trend-change ${trend.direction || 'neutral'}`}>
                                            <i data-lucide={trend.direction === 'positive' ? 'trending-up' : 'trending-down'}></i>
                                            {trend.change_percentage || 0}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DeliveryLayout>
    );
};

// Helper function to get trend icon
const getTrendIcon = (metric) => {
    if (!metric) return 'activity';
    
    switch(metric.toLowerCase()) {
        case 'on_time_rate':
        case 'on-time':
            return 'clock';
        case 'rating':
        case 'customer_rating':
            return 'star';
        case 'speed':
        case 'delivery_speed':
            return 'zap';
        case 'completion_rate':
            return 'check-circle';
        case 'cancellation_rate':
            return 'x-circle';
        default:
            return 'activity';
    }
};

export default Performance;