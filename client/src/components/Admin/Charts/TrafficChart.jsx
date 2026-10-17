import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './Charts.css';

const TrafficChart = ({ data = [], height = 300, isLoading = false }) => {
  const chartData = Array.isArray(data) && data.length ? data : [];

  if (isLoading) return <div className="chart-container loading"><div className="skeleton-line title"></div></div>;

  const colors = ['#667eea', '#ff6b6b', '#51cf66', '#ff922b', '#9c36b5'];

  return (
    <div className="chart-container">
      <div className="chart-header"><h3 className="chart-title">Traffic Sources</h3></div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={chartData} dataKey="sessions" nameKey="source" cx="50%" cy="45%" outerRadius={80} innerRadius={45} label>
              {chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrafficChart;
