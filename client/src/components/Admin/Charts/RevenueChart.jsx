import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Charts.css';

const RevenueChart = ({ data = [], height = 300, isLoading = false }) => {
  const chartData = Array.isArray(data) && data.length ? data : [];

  const getColor = (val, target = 0) => {
    if (!target) return '#667eea';
    const pct = (val / target) * 100;
    if (pct >= 100) return '#51cf66';
    if (pct >= 80) return '#ff922b';
    return '#ff6b6b';
  };

  if (isLoading) return <div className="chart-container loading"><div className="skeleton-line title"></div></div>;

  return (
    <div className="chart-container">
      <div className="chart-header"><h3 className="chart-title">Revenue by Period</h3></div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v) => `$${v}`} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={`c-${i}`} fill={getColor(entry.value, entry.target)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
