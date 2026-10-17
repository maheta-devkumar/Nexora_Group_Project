import React from 'react';
import './PeriodSelector.css';

const PeriodSelector = ({ period, onPeriodChange }) => {
    const periods = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'year', label: 'This Year' },
    ];

    return (
        <div className="period-selector flex items-center space-x-2">
            <span className="period-label text-sm text-gray-600">Period:</span>
            <div className="period-buttons flex bg-gray-100 rounded-lg p-1">
                {periods.map((p) => (
                    <button
                        key={p.value}
                        onClick={() => onPeriodChange(p.value)}
                        className={`period-button px-3 py-1 text-sm rounded-md transition-colors ${
                            period === p.value
                                ? 'active bg-white shadow-sm text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PeriodSelector;