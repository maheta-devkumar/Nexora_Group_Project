import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import './StatsCards.css';

const RevenueCard = ({ revenue = 0, growth = 0, isLoading = false }) => {
  const isPositive = (growth || 0) >= 0;

  const formattedRevenue = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(revenue || 0);

  return (
    <div className="stats-card revenue-card">
      <div className="card-header">
        <div className="card-icon revenue-icon">
          <DollarSign size={24} />
        </div>
        <h3 className="card-title">Total Revenue</h3>
      </div>

      <div className="card-content">
        {isLoading ? (
          <div className="loading-skeleton">
            <div className="skeleton-line large"></div>
            <div className="skeleton-line small"></div>
          </div>
        ) : (
          <>
            <p className="card-value">{formattedRevenue}</p>
            <div className="card-trend">
              {isPositive ? (
                <TrendingUp size={16} className="trend-icon positive" />
              ) : (
                <TrendingDown size={16} className="trend-icon negative" />
              )}
              <span className={`trend-text ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{growth}% from last period
              </span>
            </div>
          </>
        )}
      </div>

      <div className="card-footer">
        <span className="card-subtitle">Total revenue generated</span>
      </div>
    </div>
  );
};

export default RevenueCard;