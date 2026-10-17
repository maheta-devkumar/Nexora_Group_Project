import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import './PerformanceChart.css';

Chart.register(...registerables);

const PerformanceChart = ({ chartData, loading, activeFilter, onFilterChange }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;

        // Destroy previous chart instance
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        
        // Prepare data
        let labels = [];
        let onTimeData = [];
        let ratingData = [];

        if (chartData && chartData.labels && chartData.datasets) {
            labels = Array.isArray(chartData.labels) ? chartData.labels : [];
            
            // Extract on-time rate data
            const onTimeDataset = chartData.datasets.find(d => d.label === 'On-time Rate %' || d.label?.includes('On-time'));
            onTimeData = onTimeDataset?.data || [];
            
            // Extract rating data
            const ratingDataset = chartData.datasets.find(d => d.label === 'Rating' || d.label?.includes('Rating'));
            ratingData = ratingDataset?.data || [];
        } else {
            // Fallback data
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            onTimeData = [92, 94, 91, 93, 95, 90, 92];
            ratingData = [4.8, 4.9, 4.7, 5.0, 4.8, 4.6, 4.8];
        }

        // Normalize rating data (multiply by 20 to match 100 scale)
        const normalizedRatingData = ratingData.map(rating => 
            typeof rating === 'number' ? rating * 20 : 0
        );

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'On-time Rate %',
                        data: onTimeData,
                        backgroundColor: '#10b981',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 4,
                        barPercentage: 0.6
                    },
                    {
                        label: 'Rating (x20)',
                        data: normalizedRatingData,
                        backgroundColor: '#f59e0b',
                        borderColor: '#f59e0b',
                        borderWidth: 1,
                        borderRadius: 4,
                        barPercentage: 0.6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#6b7280',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label.includes('Rating')) {
                                    const rating = context.raw / 20;
                                    return `${label}: ${rating.toFixed(1)}/5.0`;
                                }
                                return `${label}: ${context.raw}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            borderDash: [5, 5]
                        },
                        ticks: {
                            color: '#6b7280',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [chartData]);

    if (loading && !chartData) {
        return (
            <div className="chart-card">
                <div className="chart-header">
                    <h3>Performance Trend</h3>
                    <div className="chart-filters">
                        <button className="chart-filter-btn active">Weekly</button>
                        <button className="chart-filter-btn">Monthly</button>
                    </div>
                </div>
                <div className="chart-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading performance chart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chart-card">
            <div className="chart-header">
                <h3>Performance Trend</h3>
                <div className="chart-filters">
                    <button 
                        className={`chart-filter-btn ${activeFilter === 'Weekly' ? 'active' : ''}`}
                        onClick={() => onFilterChange('Weekly')}
                    >
                        Weekly
                    </button>
                    <button 
                        className={`chart-filter-btn ${activeFilter === 'Monthly' ? 'active' : ''}`}
                        onClick={() => onFilterChange('Monthly')}
                    >
                        Monthly
                    </button>
                </div>
            </div>
            <div className="chart-container">
                <canvas ref={chartRef}></canvas>
            </div>
            <div className="chart-legend">
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                    <span>On-time Delivery Rate</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
                    <span>Customer Rating (÷20)</span>
                </div>
            </div>
        </div>
    );
};

export default PerformanceChart;