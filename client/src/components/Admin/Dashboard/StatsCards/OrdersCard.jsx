import React from 'react';
import { ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import './StatsCards.css';

const OrdersCard = ({ orders = 0, growth = 0, isLoading = false }) => {
  const isPositive = (growth || 0) >= 0;

  return (
    <div className="stats-card orders-card">
      <div className="card-header">
        <div className="card-icon orders-icon">
          <ShoppingCart size={24} />
        </div>
        <h3 className="card-title">Total Orders</h3>
      </div>

      <div className="card-content">
        {isLoading ? (
          <div className="loading-skeleton">
            <div className="skeleton-line large"></div>
            <div className="skeleton-line small"></div>
          </div>
        ) : (
          <>
            <p className="card-value">{new Intl.NumberFormat().format(orders || 0)}</p>
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
        <span className="card-subtitle">Completed orders</span>
      </div>
    </div>
  );
};

export default OrdersCard;