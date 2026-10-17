import React, { useEffect } from 'react';
import './EarningsOverview.css';
import { useDeliveryDashboardContext } from '../../../context/DeliveryPersonDashboardContext';

const EarningsOverview = () => {
  const { earningsOverview, loading, fetchEarningsOverview, addLog } = useDeliveryDashboardContext();

  useEffect(() => {
    if (!earningsOverview) {
      fetchEarningsOverview();
    }
  }, [earningsOverview, fetchEarningsOverview]);

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || '0'}`;
  };

  // Transform API data to component format
  const earningsData = earningsOverview?.periods ? [
    {
      period: 'Today',
      amount: earningsOverview.periods[0]?.amount || 0,
      deliveries: earningsOverview.periods[0]?.deliveries || 0,
      color: '#3b82f6'
    },
    {
      period: 'This Week',
      amount: earningsOverview.periods[1]?.amount || 0,
      deliveries: earningsOverview.periods[1]?.deliveries || 0,
      color: '#10b981'
    },
    {
      period: 'This Month',
      amount: earningsOverview.periods[2]?.amount || 0,
      deliveries: earningsOverview.periods[2]?.deliveries || 0,
      color: '#8b5cf6'
    },
    {
      period: 'Pending',
      amount: earningsOverview.pending_settlement || 0,
      description: 'To be settled',
      color: '#f59e0b'
    }
  ] : [];

  if (loading && !earningsOverview) {
    return (
      <div className="dp-earnings-overview">
        <h3>Earnings Overview</h3>
        <div className="dp-earnings-grid loading">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dp-earnings-card loading-card">
              <div className="dp-earnings-header">
                <div className="dp-loading-line-wrapper small" style={{ width: '60px' }}></div>
                <div className="dp-color-indicator" style={{ backgroundColor: '#e2e8f0' }}></div>
              </div>
              <div className="dp-loading-line-wrapper large"></div>
              <div className="dp-earnings-details">
                <div className="dp-loading-line-wrapper small"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!earningsOverview) {
    return (
      <div className="dp-earnings-overview">
        <h3>Earnings Overview</h3>
        <div className="dp-no-data">
          <p>Unable to load earnings data.</p>
          <button onClick={fetchEarningsOverview} className="dp-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-earnings-overview">
      <h3>Earnings Overview</h3>
      <div className="dp-earnings-grid">
        {earningsData.map((item) => (
          <div
            key={item.period}
            className="dp-earnings-card"
            style={{ '--card-color': item.color }}
          >
            <div className="dp-earnings-header">
              <span className="dp-earnings-period">{item.period}</span>
              <div
                className="dp-color-indicator"
                style={{ backgroundColor: item.color }}
              ></div>
            </div>

            <div className="dp-earnings-amount">
              {formatCurrency(item.amount)}
            </div>

            <div className="dp-earnings-details">
              {item.deliveries ? (
                <span className="dp-deliveries-count">
                  {item.deliveries} deliver{item.deliveries === 1 ? 'y' : 'ies'}
                </span>
              ) : (
                <span className="dp-pending-description">{item.description}</span>
              )}
            </div>

            {item.period === 'Today' && earningsData[1]?.amount > 0 && (
              <div className="dp-earnings-trend">
                <span className="dp-trend-up">
                  ↑ {((earningsData[0].amount / earningsData[1].amount) * 100).toFixed(0)}% from weekly avg
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EarningsOverview;
