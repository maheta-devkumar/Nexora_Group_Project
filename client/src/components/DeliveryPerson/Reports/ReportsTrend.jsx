import React from 'react';
import './ReportsTrend.css';

const ReportsTrend = ({ trendData, reportsData, loading }) => {
    // Use either trendData or extract from reportsData
    const trend = trendData || reportsData?.trend;
    
    const deliveryData = trend?.delivery_data || [8, 7, 9, 6, 10, 8, 9];
    const earningsData = trend?.earnings_data || [1500, 1300, 1700, 1200, 1800, 1600, 1700];
    const labels = trend?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Calculate max values for percentage calculation
    const maxDelivery = Math.max(...deliveryData);
    const maxEarnings = Math.max(...earningsData);

    return (
        <div className="trend-section">
            <h3 className="section-title">
                <i data-lucide="trending-up"></i>
                Performance Trend (Last 7 Days)
            </h3>
            
            <div className="trend-charts">
                <div className="chart-container">
                    <div className="chart-header">
                        <h4>Deliveries</h4>
                        <div className="chart-stats">
                            <span className="stat-value">{deliveryData.reduce((a, b) => a + b, 0)}</span>
                            <span className="stat-label">total this week</span>
                        </div>
                    </div>
                    
                    <div className="chart-bars">
                        {deliveryData.map((value, index) => (
                            <div key={index} className="bar-group">
                                <div className="bar-label">{labels[index]}</div>
                                <div className="bar-container">
                                    <div 
                                        className="bar delivery-bar"
                                        style={{ 
                                            height: `${(value / maxDelivery) * 80}%`,
                                            '--bar-value': value 
                                        }}
                                        data-value={value}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="chart-container">
                    <div className="chart-header">
                        <h4>Earnings</h4>
                        <div className="chart-stats">
                            <span className="stat-value">₹{earningsData.reduce((a, b) => a + b, 0)}</span>
                            <span className="stat-label">total this week</span>
                        </div>
                    </div>
                    
                    <div className="chart-bars">
                        {earningsData.map((value, index) => (
                            <div key={index} className="bar-group">
                                <div className="bar-label">{labels[index]}</div>
                                <div className="bar-container">
                                    <div 
                                        className="bar earnings-bar"
                                        style={{ 
                                            height: `${(value / maxEarnings) * 80}%`,
                                            '--bar-value': `₹${value}`
                                        }}
                                        data-value={`₹${value}`}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="trend-metrics">
                <div className="trend-metric">
                    <div className="metric-header">
                        <i data-lucide="arrow-up-right" className="metric-trend positive"></i>
                        <span className="metric-label">Weekly Growth</span>
                    </div>
                    <div className="metric-value">+12.5%</div>
                </div>
                
                <div className="trend-metric">
                    <div className="metric-header">
                        <i data-lucide="zap" className="metric-trend neutral"></i>
                        <span className="metric-label">Peak Day</span>
                    </div>
                    <div className="metric-value">
                        {labels[deliveryData.indexOf(maxDelivery)]} ({maxDelivery} deliveries)
                    </div>
                </div>
                
                <div className="trend-metric">
                    <div className="metric-header">
                        <i data-lucide="dollar-sign" className="metric-trend positive"></i>
                        <span className="metric-label">Max Earnings</span>
                    </div>
                    <div className="metric-value">
                        {labels[earningsData.indexOf(maxEarnings)]} (₹{maxEarnings})
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsTrend;