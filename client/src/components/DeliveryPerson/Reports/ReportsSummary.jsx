import React from 'react';
import './ReportsSummary.css';

const ReportsSummary = ({ summaryData, reportsData, loading }) => {
    // Use either summaryData or extract from reportsData
    const summary = summaryData || reportsData?.summary || {};
    
    const cards = [
        {
            id: 'total',
            icon: 'package',
            label: 'Total Deliveries',
            value: summary.total_deliveries || summary.total_orders || 0,
            color: '#3b82f6',
            trend: summary.success_rate ? `${summary.success_rate}% success rate` : ''
        },
        {
            id: 'completed',
            icon: 'check-circle',
            label: 'Completed',
            value: summary.completed_deliveries || summary.completed || 0,
            color: '#10b981',
            trend: summary.completed_rate ? `${summary.completed_rate}% completion rate` : ''
        },
        {
            id: 'failed',
            icon: 'x-circle',
            label: 'Failed',
            value: summary.failed_deliveries || summary.failed || 0,
            color: '#ef4444',
            trend: summary.failure_rate ? `${summary.failure_rate}% failure rate` : ''
        },
        {
            id: 'earnings',
            icon: 'dollar-sign',
            label: 'Total Earnings',
            value: `₹${summary.total_earnings || 0}`,
            color: '#8b5cf6',
            trend: summary.average_earnings ? `₹${summary.average_earnings}/delivery` : ''
        }
    ];

    return (
        <div className="summary-section">
            <h3 className="section-title">
                <i data-lucide="pie-chart"></i>
                Performance Summary
            </h3>
            
            <div className="summary-grid">
                {cards.map((card) => (
                    <div 
                        key={card.id} 
                        className={`summary-card ${card.id}-card ${loading ? 'loading' : ''}`}
                        style={{ '--card-color': card.color }}
                    >
                        <div className="card-icon">
                            <i data-lucide={card.icon}></i>
                        </div>
                        
                        <div className="card-content">
                            <div className="card-value">
                                {loading ? (
                                    <div className="value-skeleton"></div>
                                ) : (
                                    card.value
                                )}
                            </div>
                            
                            <div className="card-label">
                                {loading ? (
                                    <div className="label-skeleton"></div>
                                ) : (
                                    card.label
                                )}
                            </div>
                            
                            {card.trend && !loading && (
                                <div className="card-trend">
                                    <i data-lucide="trending-up"></i>
                                    <span>{card.trend}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="card-decoration"></div>
                    </div>
                ))}
            </div>
            
            {summaryData && !loading && (
                <div className="additional-metrics">
                    <div className="metric">
                        <span className="metric-label">Average Delivery Time</span>
                        <span className="metric-value">
                            {summary.average_delivery_time || 0} min
                        </span>
                    </div>
                    <div className="metric">
                        <span className="metric-label">On-Time Rate</span>
                        <span className="metric-value">
                            {summary.on_time_rate || summary.success_rate || 0}%
                        </span>
                    </div>
                    <div className="metric">
                        <span className="metric-label">Avg. Distance</span>
                        <span className="metric-value">
                            {summary.average_distance || 0} km
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsSummary;