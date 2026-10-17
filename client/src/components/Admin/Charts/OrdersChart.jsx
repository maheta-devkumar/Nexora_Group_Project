import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './Charts.css';

const OrdersChart = ({ data = [], height = 300, isLoading = false }) => {
  const chartData = Array.isArray(data) && data.length ? data : [];

  const avg = chartData.length ? Math.round(chartData.reduce((s, d) => s + (d.orders || d.value || 0), 0) / chartData.length) : 0;

  if (isLoading) return <div className="chart-container loading"><div className="skeleton-line title"></div></div>;

  return (
    <div className="chart-container">
      <div className="chart-header"><h3 className="chart-title">Orders by Period</h3></div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <ReferenceLine y={avg} stroke="#ff922b" strokeDasharray="3 3" />
            <Line type="monotone" dataKey={'orders'} stroke="#667eea" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrdersChart;
