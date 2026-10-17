import React from 'react';
import MetricCard from './MetricCard';
import './DashboardSummary.css';

const DashboardSummary = ({ data }) => {
    const { sales_summary, top_products, customer_insights, inventory_alerts } = data;

    return (
        <div className="admin-summary-card">
            <div className="admin-summary-header">
                <h2 className="admin-summary-title">Dashboard Overview</h2>
                <span className="admin-summary-time">Real-time data</span>
            </div>

            {/* Key Metrics Grid */}
            <div className="admin-metrics-grid">
                <MetricCard
                    title="Total Revenue"
                    value={`$${sales_summary.total_revenue.toLocaleString()}`}
                    trend={sales_summary.revenue_growth}
                    icon="💰"
                    color="green"
                />
                <MetricCard
                    title="Total Orders"
                    value={sales_summary.total_orders.toLocaleString()}
                    description={`${sales_summary.completed_orders} completed`}
                    icon="📦"
                    color="blue"
                />
                <MetricCard
                    title="Customers"
                    value={customer_insights.total_customers.toLocaleString()}
                    description={`${customer_insights.new_customers} new`}
                    icon="👥"
                    color="purple"
                />
                <MetricCard
                    title="Inventory Alerts"
                    value={inventory_alerts.length}
                    description={`${inventory_alerts.filter(a => a.status === 'OUT_OF_STOCK').length} out of stock`}
                    icon="⚠️"
                    color="red"
                />
            </div>

            {/* Quick Stats */}
            <div className="admin-stats-grid">
                <div className="admin-stat-item">
                    <div className="admin-stat-content">
                        <span className="admin-stat-label">Avg Order Value</span>
                        <span className="admin-stat-value">${sales_summary.average_order_value.toFixed(2)}</span>
                    </div>
                </div>
                <div className="admin-stat-item">
                    <div className="admin-stat-content">
                        <span className="admin-stat-label">Repeat Purchase Rate</span>
                        <span className="admin-stat-value">{customer_insights.repeat_purchase_rate.toFixed(1)}%</span>
                    </div>
                </div>
                <div className="admin-stat-item">
                    <div className="admin-stat-content">
                        <span className="admin-stat-label">Top Product</span>
                        <span className="admin-stat-value admin-truncate">
                            {top_products[0]?.product_name || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSummary;