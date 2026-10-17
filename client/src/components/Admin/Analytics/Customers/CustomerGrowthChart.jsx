import React from 'react';
import './CustomerGrowthChart.css';

const CustomerGrowthChart = () => {
    return (
        <div className="customer-growth-chart bg-white rounded-lg p-4">
            <h4 className="chart-title font-medium text-gray-900 mb-4">Customer Growth</h4>
            <div className="chart-container h-48 flex items-center justify-center bg-gray-50 rounded">
                <p className="placeholder-text text-gray-500">Growth chart visualization</p>
            </div>
        </div>
    );
};

export default CustomerGrowthChart;