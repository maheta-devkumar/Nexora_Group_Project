import React from 'react';
import './EarningsCards.css';

const EarningsCards = ({
    todayEarnings,
    weeklyEarnings,
    monthlyEarnings,
    earningsOverview,
    loading
}) => {
    return (
        <div className="dp-earnings-cards-grid">
            <div className="dp-ec-card">
                <span className="dp-ec-label">Today</span>
                <span className="dp-ec-value">
                    ₹{loading ? '...' : (todayEarnings?.earnings || 0)}
                </span>
                <span className="dp-ec-count">
                    {loading ? '...' : (todayEarnings?.deliveries || 0)} deliveries
                </span>
            </div>
            <div className="dp-ec-card">
                <span className="dp-ec-label">This Week</span>
                <span className="dp-ec-value">
                    ₹{loading ? '...' : (weeklyEarnings?.earnings || 0)}
                </span>
                <span className="dp-ec-count">
                    {loading ? '...' : (weeklyEarnings?.deliveries || 0)} deliveries
                </span>
            </div>
            <div className="dp-ec-card">
                <span className="dp-ec-label">This Month</span>
                <span className="dp-ec-value">
                    ₹{loading ? '...' : (monthlyEarnings?.earnings || 0)}
                </span>
                <span className="dp-ec-count">
                    {loading ? '...' : (monthlyEarnings?.deliveries || 0)} deliveries
                </span>
            </div>
            <div className="dp-ec-card">
                <span className="dp-ec-label">Pending</span>
                <span className="dp-ec-value">
                    ₹{loading ? '...' : (earningsOverview?.pending_settlement || 0)}
                </span>
                <span className="dp-ec-count">To be settled</span>
            </div>
        </div>
    );
};

export default EarningsCards;
