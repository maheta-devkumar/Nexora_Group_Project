import React from 'react';
import './CustomerInsights.css';

const CustomerInsights = ({ data }) => {
    return (
        <div className="customer-insights bg-white rounded-xl shadow-sm p-6">
            <div className="insights-header flex justify-between items-center mb-6">
                <h2 className="insights-title text-xl font-bold text-gray-900">Customer Insights</h2>
                <span className="insights-updated text-sm text-gray-500">Updated today</span>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="metric-item text-center p-4 bg-gray-50 rounded-lg">
                    <div className="metric-value text-2xl font-bold text-gray-900">{data.total_customers.toLocaleString()}</div>
                    <div className="metric-label text-sm text-gray-600">Total Customers</div>
                </div>
                <div className="metric-item text-center p-4 bg-gray-50 rounded-lg">
                    <div className="metric-value text-2xl font-bold text-green-600">{data.new_customers}</div>
                    <div className="metric-label text-sm text-gray-600">New (30d)</div>
                </div>
                <div className="metric-item text-center p-4 bg-gray-50 rounded-lg">
                    <div className="metric-value text-2xl font-bold text-blue-600">{data.returning_customers}</div>
                    <div className="metric-label text-sm text-gray-600">Returning</div>
                </div>
                <div className="metric-item text-center p-4 bg-gray-50 rounded-lg">
                    <div className="metric-value text-2xl font-bold text-purple-600">{data.repeat_purchase_rate.toFixed(1)}%</div>
                    <div className="metric-label text-sm text-gray-600">Repeat Rate</div>
                </div>
            </div>

            {/* Top Customers */}
            <div>
                <h4 className="top-customers-title font-medium text-gray-900 mb-4">Top Customers by Spending</h4>
                <div className="customers-list space-y-3">
                    {data.top_customers.slice(0, 5).map((customer, index) => (
                        <div key={customer.user_id} className="customer-item flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="customer-info flex items-center">
                                <div className="customer-rank w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="customer-number text-blue-600 font-bold">{index + 1}</span>
                                </div>
                                <div>
                                    <div className="customer-name font-medium text-gray-900">{customer.name}</div>
                                    <div className="customer-email text-sm text-gray-500">{customer.email}</div>
                                </div>
                            </div>
                            <div className="customer-stats text-right">
                                <div className="customer-spent font-bold text-gray-900">${customer.total_spent.toLocaleString()}</div>
                                <div className="customer-orders text-sm text-gray-500">{customer.total_orders} orders</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomerInsights;