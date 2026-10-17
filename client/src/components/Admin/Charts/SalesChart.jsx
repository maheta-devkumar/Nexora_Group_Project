import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './Charts.css';

const SalesChart = ({ data = [], type = 'revenue', height = 300, isLoading = false }) => {
  const chartData = Array.isArray(data) && data.length ? data : [];

  const formatYAxis = (val) => {
    if (type === 'revenue') return `$${(val / 1000).toFixed(0)}k`;
    return val;
  };

  if (isLoading) {
    return <div className="chart-container loading"><div className="skeleton-line title"></div></div>;
  }

  return (
    <div className="chart-container">
      <div className="chart-header"><h3 className="chart-title">Sales Overview</h3></div>
      <div className="chart-wrapper" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip formatter={(value) => (type === 'revenue' ? `$${value}` : value)} />
            <Area type="monotone" dataKey={type === 'revenue' ? 'value' : (type === 'orders' ? 'orders' : 'value')} stroke="#667eea" fill="#667eea" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
