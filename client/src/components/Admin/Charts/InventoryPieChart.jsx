import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Charts.css';

const InventoryPieChart = ({ data = [], height = 300 }) => {
    // Assume data comes in as [{ status: 'Low Stock', count: 5 }, ...]
    // We need to shape it for the Pie Chart.
    // If data is just an array of items, we might need to aggregate.
    // Let's assume the passed data is [ { name: 'Active', value: 400 }, ... ]

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (!data || data.length === 0) {
        return (
            <div className="chart-container flex items-center justify-center" style={{ height }}>
                <p className="text-gray-400">No Inventory Data</p>
            </div>
        );
    }

    return (
        <div className="chart-container bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="chart-header mb-4">
                <h3 className="chart-title text-lg font-bold text-gray-800">Inventory Status</h3>
            </div>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={height - 60}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default InventoryPieChart;
