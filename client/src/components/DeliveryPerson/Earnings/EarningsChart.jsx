import React, { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import './EarningsChart.css';

Chart.register(...registerables);

const EarningsChart = ({ chartData, loading, activeFilter, onFilterChange }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Process data for Chart.js
    const { chartLabels, chartValues, totalEarnings } = useMemo(() => {
        if (!chartData || !chartData.data_points) {
            return { chartLabels: [], chartValues: [], totalEarnings: 0 };
        }

        const labels = chartData.data_points.map(point => point.label);
        const values = chartData.data_points.map(point => point.amount);
        const total = chartData.total_amount || 0;

        return { chartLabels: labels, chartValues: values, totalEarnings: total };
    }, [chartData]);

    useEffect(() => {
        if (!chartRef.current) return;

        // Destroy previous chart instance if it exists
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Earnings',
                    data: chartValues,
                    borderColor: '#3b82f6',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#3b82f6',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        padding: 12,
                        titleFont: {
                            size: 13,
                            family: "'Inter', sans-serif"
                        },
                        bodyFont: {
                            size: 14,
                            family: "'Inter', sans-serif",
                            weight: 'bold'
                        },
                        callbacks: {
                            label: function (context) {
                                return `₹${context.parsed.y}`;
                            }
                        },
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 11
                            },
                            maxRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f3f4f6',
                            borderDash: [5, 5],
                            drawBorder: false
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 11
                            },
                            callback: function (value) {
                                return '₹' + value;
                            },
                            maxTicksLimit: 6
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
    }, [chartLabels, chartValues]);

    if (loading && !chartData) {
        return (
            <div className="chart-card">
                <div className="chart-header">
                    <div>
                        <h3>Earnings Trend</h3>
                        <div className="total-earnings-skeleton"></div>
                    </div>
                    <div className="chart-filters">
                        <div className="filter-skeleton"></div>
                    </div>
                </div>
                <div className="chart-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading chart data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chart-card">
            <div className="chart-header-wrapper">
                <div className="chart-info">
                    <h3>Earnings Trend</h3>
                    <div className="total-chart-earnings">
                        <span className="label">Total in this period</span>
                        <span className="value">₹{totalEarnings.toFixed(2)}</span>
                    </div>
                </div>
                <div className="chart-filters">
                    <button
                        className={`chart-filter-btn ${activeFilter === '7 Days' ? 'active' : ''}`}
                        onClick={() => onFilterChange('7 Days')}
                    >
                        7 Days
                    </button>
                    <button
                        className={`chart-filter-btn ${activeFilter === '30 Days' ? 'active' : ''}`}
                        onClick={() => onFilterChange('30 Days')}
                    >
                        30 Days
                    </button>
                    <button
                        className={`chart-filter-btn ${activeFilter === 'This Month' ? 'active' : ''}`}
                        onClick={() => onFilterChange('This Month')}
                    >
                        This Month
                    </button>
                </div>
            </div>
            <div className="chart-container">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default EarningsChart;