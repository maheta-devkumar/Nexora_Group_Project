import React from 'react';
import './SalesOverview.css';

const SalesOverview = ({ data }) => {
    const { summary, trends, period } = data;

    return (
        <div className="sales-overview bg-white rounded-xl shadow-sm p-6">
            <div className="overview-header flex justify-between items-center mb-6">
                <h2 className="overview-title text-xl font-bold text-gray-900">Sales Overview</h2>
                <div className="flex items-center space-x-2">
                    <span className="period-badge px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                    </span>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="stat-item text-center">
                    <p className="stat-value text-2xl font-bold text-gray-900">${summary.total_revenue.toLocaleString()}</p>
                    <p className="stat-label text-sm text-gray-600">Revenue</p>
                </div>
                <div className="stat-item text-center">
                    <p className="stat-value text-2xl font-bold text-gray-900">{summary.total_orders}</p>
                    <p className="stat-label text-sm text-gray-600">Orders</p>
                </div>
                <div className="stat-item text-center">
                    <p className="stat-value text-2xl font-bold text-gray-900">${summary.average_order_value.toFixed(2)}</p>
                    <p className="stat-label text-sm text-gray-600">Avg Order Value</p>
                </div>
                <div className="stat-item text-center">
                    <p className="stat-value text-2xl font-bold text-gray-900">{summary.completed_orders}</p>
                    <p className="stat-label text-sm text-gray-600">Completed</p>
                </div>
            </div>

            {/* Trends Table */}
            <div className="table-container overflow-x-auto">
                <table className="trends-table min-w-full divide-y divide-gray-200">
                    <thead className="table-header">
                        <tr>
                            <th className="header-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Period
                            </th>
                            <th className="header-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Revenue
                            </th>
                            <th className="header-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Orders
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {trends.slice(-5).map((trend, index) => (
                            <tr key={index} className="table-row">
                                <td className="table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {trend.period}
                                </td>
                                <td className="table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    ${trend.revenue.toLocaleString()}
                                </td>
                                <td className="table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {trend.orders}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesOverview;