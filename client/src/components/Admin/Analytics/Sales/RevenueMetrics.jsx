import React from 'react';
import './RevenueMetrics.css';

const RevenueMetrics = ({ summary }) => {
    return (
        <div className="revenue-metrics bg-white rounded-lg p-4">
            <h4 className="metrics-title font-medium text-gray-900 mb-4">Revenue Breakdown</h4>
            <div className="metrics-list space-y-3">
                <div className="metric-row flex justify-between">
                    <span className="metric-label text-gray-600">Total Revenue</span>
                    <span className="metric-value font-semibold">${summary.total_revenue.toLocaleString()}</span>
                </div>
                <div className="metric-row flex justify-between">
                    <span className="metric-label text-gray-600">Refunded Amount</span>
                    <span className="metric-value refund-amount font-semibold text-red-600">${summary.refunded_amount.toLocaleString()}</span>
                </div>
                <div className="metric-row flex justify-between">
                    <span className="metric-label text-gray-600">Net Revenue</span>
                    <span className="metric-value net-revenue font-semibold text-green-600">
                        ${(summary.total_revenue - summary.refunded_amount).toLocaleString()}
                    </span>
                </div>
                <div className="metrics-divider pt-3 border-t">
                    <div className="metric-row flex justify-between">
                        <span className="metric-label text-gray-600">Cancelled Orders</span>
                        <span className="cancelled-orders font-semibold">{summary.cancelled_orders}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueMetrics;