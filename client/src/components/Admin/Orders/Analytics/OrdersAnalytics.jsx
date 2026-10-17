import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatusBadge from '../common/StatusBadge';

const OrdersAnalytics = ({ stats, ordersByDate, dateRange }) => {
    const orderStatusData = [
        { name: 'Placed', value: stats?.placed || 0 },
        { name: 'Delivered', value: stats?.delivered || 0 },
        { name: 'Processing', value: 0 },
        { name: 'Cancelled', value: 0 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    // Calculate daily orders
    const dailyOrders = ordersByDate.reduce((acc, order) => {
        const date = new Date(order.placed_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const dailyOrdersData = Object.entries(dailyOrders).map(([date, count]) => ({
        date,
        orders: count
    }));

    return (
        <div className="orders-analytics">
            <div className="analytics-header">
                <h2>Order Analytics Overview</h2>
                <div className="stats-overview">
                    <div className="stat-card blue">
                        <p className="stat-label">Total Orders</p>
                        <p className="stat-value">{stats?.total || 0}</p>
                    </div>
                    <div className="stat-card green">
                        <p className="stat-label">Delivered</p>
                        <p className="stat-value">{stats?.delivered || 0}</p>
                    </div>
                    <div className="stat-card yellow">
                        <p className="stat-label">Placed</p>
                        <p className="stat-value">{stats?.placed || 0}</p>
                    </div>
                    <div className="stat-card purple">
                        <p className="stat-label">Date Range</p>
                        <p className="stat-value">
                            {dateRange.startDate} to {dateRange.endDate}
                        </p>
                    </div>
                </div>
            </div>

            <div className="analytics-grid">
                <div className="chart-container">
                    <h3>Order Status Distribution</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={orderStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {orderStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-container">
                    <h3>Daily Orders ({dateRange.startDate} - {dateRange.endDate})</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailyOrdersData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="orders" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="recent-orders-section">
                <h3>Recent Orders</h3>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordersByDate.slice(0, 5).map((order) => (
                            <tr key={order.order_id}>
                                <td>#{order.order_id}</td>
                                <td>
                                    {order.user?.name || `User #${order.user_id}`}
                                </td>
                                <td>
                                    {new Date(order.placed_at).toLocaleDateString()}
                                </td>
                                <td>
                                    ${parseFloat(order.total_amount).toFixed(2)}
                                </td>
                                <td>
                                    <span className={`status-badge ${order.order_status === 'DELIVERED' ? 'delivered' :
                                            order.order_status === 'CANCELLED' ? 'cancelled' :
                                                'other'
                                        }`}>
                                        {order.order_status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrdersAnalytics;