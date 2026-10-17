import React, { useState, useEffect } from 'react';
import { useDeliveryContext } from '../../../context/DeliveryContext';
import './DeliveryEarnings.css';

const DeliveryEarnings = () => {
  const { 
    deliveryEarnings = [], 
    adminGetDeliveryEarnings,
    loading 
  } = useDeliveryContext();

  const [dateRange, setDateRange] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEarnings, setFilteredEarnings] = useState([]);

  useEffect(() => {
    adminGetDeliveryEarnings();
  }, [adminGetDeliveryEarnings]);

  useEffect(() => {
    if (deliveryEarnings && deliveryEarnings.length > 0) {
      const filtered = deliveryEarnings.filter(earning => {
        if (!earning) return false;
        
        const name = earning.delivery_person_name || '';
        const id = earning.delivery_person_id || '';
        
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               id.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredEarnings(filtered);
    } else {
      setFilteredEarnings([]);
    }
  }, [deliveryEarnings, searchTerm]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTotalStats = () => {
    if (!deliveryEarnings || deliveryEarnings.length === 0) {
      return {
        totalEarnings: 0,
        totalPaid: 0,
        totalPending: 0,
        totalDeliveries: 0,
        avgEarning: 0
      };
    }

    const totalEarnings = deliveryEarnings.reduce((sum, e) => sum + (e.total_earnings || 0), 0);
    const totalPaid = deliveryEarnings.reduce((sum, e) => sum + (e.paid_amount || 0), 0);
    const totalPending = deliveryEarnings.reduce((sum, e) => sum + (e.pending_amount || 0), 0);
    const totalDeliveries = deliveryEarnings.reduce((sum, e) => sum + (e.completed_deliveries || 0), 0);
    const avgEarning = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

    return {
      totalEarnings,
      totalPaid,
      totalPending,
      totalDeliveries,
      avgEarning
    };
  };

  const totalStats = getTotalStats();

  return (
    <div className="delivery-earnings">
      <div className="earnings-header">
        <h2>Delivery Earnings</h2>
        <p className="subtitle">Track earnings and payments for delivery persons</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>Total Earnings</h3>
            <div className="summary-value">{formatCurrency(totalStats.totalEarnings)}</div>
            <div className="summary-meta">{totalStats.totalDeliveries} deliveries</div>
          </div>
        </div>

        <div className="summary-card paid-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <h3>Paid Amount</h3>
            <div className="summary-value">{formatCurrency(totalStats.totalPaid)}</div>
            <div className="summary-meta">
              {deliveryEarnings.filter(e => e && e.payment_status === 'PAID').length} persons paid
            </div>
          </div>
        </div>

        <div className="summary-card pending-card">
          <div className="summary-icon">⏳</div>
          <div className="summary-content">
            <h3>Pending Payment</h3>
            <div className="summary-value">{formatCurrency(totalStats.totalPending)}</div>
            <div className="summary-meta">
              {deliveryEarnings.filter(e => e && e.payment_status === 'PENDING').length} pending
            </div>
          </div>
        </div>

        <div className="summary-card avg-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <h3>Avg per Delivery</h3>
            <div className="summary-value">{formatCurrency(totalStats.avgEarning)}</div>
            <div className="summary-meta">Per delivery average</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="earnings-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search delivery person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="date-filters">
          <button 
            className={`date-btn ${dateRange === 'today' ? 'active' : ''}`}
            onClick={() => setDateRange('today')}
          >
            Today
          </button>
          <button 
            className={`date-btn ${dateRange === 'week' ? 'active' : ''}`}
            onClick={() => setDateRange('week')}
          >
            This Week
          </button>
          <button 
            className={`date-btn ${dateRange === 'month' ? 'active' : ''}`}
            onClick={() => setDateRange('month')}
          >
            This Month
          </button>
          <button 
            className={`date-btn ${dateRange === 'all' ? 'active' : ''}`}
            onClick={() => setDateRange('all')}
          >
            All Time
          </button>
        </div>

        <button 
          className="export-btn"
          onClick={() => alert('Export feature coming soon')}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Earnings Table */}
      <div className="earnings-table-container">
        {loading ? (
          <div className="loading-earnings">
            <div className="spinner"></div>
            <p>Loading earnings data...</p>
          </div>
        ) : filteredEarnings.length === 0 ? (
          <div className="no-earnings">
            <div className="no-earnings-icon">💰</div>
            <h3>No Earnings Data</h3>
            <p>No earnings data available for the selected period</p>
          </div>
        ) : (
          <table className="earnings-table">
            <thead>
              <tr>
                <th>Delivery Person</th>
                <th>Completed Deliveries</th>
                <th>Total Earnings</th>
                <th>Paid Amount</th>
                <th>Pending Amount</th>
                <th>Payment Status</th>
                <th>Last Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEarnings.map((earning, index) => (
                <tr key={earning.delivery_person_id || index}>
                  <td className="person-cell">
                    <div className="person-info">
                      <div className="person-name">{earning.delivery_person_name || 'Unknown'}</div>
                      <div className="person-id">ID: {earning.delivery_person_id || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="deliveries-cell">
                    <div className="deliveries-count">{earning.completed_deliveries || 0}</div>
                  </td>
                  <td className="total-cell">
                    <div className="amount total-amount">
                      {formatCurrency(earning.total_earnings)}
                    </div>
                  </td>
                  <td className="paid-cell">
                    <div className="amount paid-amount">
                      {formatCurrency(earning.paid_amount)}
                    </div>
                  </td>
                  <td className="pending-cell">
                    <div className="amount pending-amount">
                      {formatCurrency(earning.pending_amount)}
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`payment-status ${(earning.payment_status || '').toLowerCase()}`}>
                      {earning.payment_status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="date-cell">
                    {earning.last_payment_date 
                      ? new Date(earning.last_payment_date).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="actions-cell">
                    <div className="earning-actions">
                      <button
                        className="action-btn view-btn"
                        onClick={() => alert(`View details for ${earning.delivery_person_name || 'unknown'}`)}
                      >
                        View
                      </button>
                      {(earning.pending_amount || 0) > 0 && (
                        <button
                          className="action-btn pay-btn"
                          onClick={() => alert(`Process payment for ${earning.delivery_person_name || 'unknown'}`)}
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Footer */}
      {filteredEarnings.length > 0 && (
        <div className="earnings-footer">
          <div className="footer-summary">
            <div className="summary-item">
              <span className="label">Total Delivery Persons:</span>
              <span className="value">{filteredEarnings.length}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Completed Deliveries:</span>
              <span className="value">
                {filteredEarnings.reduce((sum, e) => sum + (e.completed_deliveries || 0), 0)}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Total Pending Payments:</span>
              <span className="value">
                {formatCurrency(filteredEarnings.reduce((sum, e) => sum + (e.pending_amount || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryEarnings;