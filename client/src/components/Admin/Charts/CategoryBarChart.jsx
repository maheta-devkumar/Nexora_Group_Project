import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './Charts.css';

const CategoryBarChart = ({ data = [], height = 300 }) => {
    // data: [{ name: 'Electronics', value: 50 }, ...]

    if (!data || data.length === 0) {
        return (
            <div className="chart-container flex items-center justify-center" style={{ height }}>
                <p className="text-gray-400">No Category Data</p>
            </div>
        );
    }

    return (
        <div className="chart-container bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="chart-header mb-4">
                <h3 className="chart-title text-lg font-bold text-gray-800">Sales by Category</h3>
            </div>
            <div className="chart-wrapper" style={{ height: height - 60 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CategoryBarChart;
