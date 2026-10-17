import React from 'react';
import './MetricCard.css';

const MetricCard = ({ title, value, description, trend, icon, color }) => {
    const colorClasses = {
        green: 'icon-green bg-green-50 text-green-700',
        blue: 'icon-blue bg-blue-50 text-blue-700',
        purple: 'icon-purple bg-purple-50 text-purple-700',
        red: 'icon-red bg-red-50 text-red-700',
        yellow: 'icon-yellow bg-yellow-50 text-yellow-700'
    };

    return (
        <div className="metric-card bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="metric-header flex justify-between items-start">
                <div className="metric-content">
                    <p className="metric-title text-sm text-gray-600 font-medium mb-1">{title}</p>
                    <p className="metric-value text-2xl font-bold text-gray-900">{value}</p>
                    {description && (
                        <p className="metric-description text-sm text-gray-500 mt-1">{description}</p>
                    )}
                </div>
                <div className={`metric-icon ${colorClasses[color]} p-3 rounded-lg`}>
                    <span className="text-xl">{icon}</span>
                </div>
            </div>
            
            {trend !== undefined && (
                <div className="metric-trend flex items-center mt-4">
                    <span className={`trend-value text-sm font-medium ${trend >= 0 ? 'trend-positive text-green-600' : 'trend-negative text-red-600'}`}>
                        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                    </span>
                    <span className="trend-label text-gray-500 text-sm ml-2">from previous period</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;