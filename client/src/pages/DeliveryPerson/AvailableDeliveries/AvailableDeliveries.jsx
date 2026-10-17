import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAvailableDeliveriesContext } from '../../../context/delivery_panel/AvailableDeliveriesContext';
import DeliveryLayout from '../../../components/DeliveryPerson/Layout/DeliveryLayout';
import AvailableDeliveryList from '../../../components/DeliveryPerson/AvailableDeliveries/AvailableDeliveryList';
import AvailableDeliveryActions from '../../../components/DeliveryPerson/AvailableDeliveries/AvailableDeliveryActions';
import AvailableDeliveryEmpty from '../../../components/DeliveryPerson/AvailableDeliveries/AvailableDeliveryEmpty';
import './AvailableDeliveries.css';
import {
  RefreshCw,
  AlertCircle,
  X,
  Search,
  AlertTriangle,
  Eye
} from 'lucide-react';

const AvailableDeliveries = () => {
  const {
    availableDeliveries,
    loading,
    error,
    getAvailableDeliveries,
    refreshAvailableDeliveries,
    getDeliveryStats,
    filterDeliveries,
    calculateWaitingTime,
    clearError
  } = useAvailableDeliveriesContext();

  const [filters, setFilters] = useState({
    status: 'all',
    sort: 'nearest',
    search: ''
  });
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);

  useEffect(() => {
    loadAvailableDeliveries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, availableDeliveries]);

  const loadAvailableDeliveries = async () => {
    try {
      await getAvailableDeliveries();
    } catch (err) {
      console.error('Error loading available deliveries:', err);
      toast.error("Failed to load available deliveries");
    }
  };

  const applyFilters = () => {
    const filtered = filterDeliveries({
      searchTerm: filters.search,
      minWaitingTime: filters.minWaitingTime || 0,
      maxWaitingTime: filters.maxWaitingTime || 999
    });

    // Apply sorting
    let sorted = [...filtered];
    switch (filters.sort) {
      case 'nearest':
        sorted.sort((a, b) => calculateWaitingTime(a.available_since) - calculateWaitingTime(b.available_since));
        break;
      case 'urgent':
        sorted.sort((a, b) => (b.priority === 'urgent' ? 1 : 0) - (a.priority === 'urgent' ? 1 : 0));
        break;
      case 'time_slot':
        sorted.sort((a, b) => new Date(a.expected_delivery_time) - new Date(b.expected_delivery_time));
        break;
      default:
        break;
    }

    setFilteredDeliveries(sorted);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleDeliverySelect = (delivery) => {
    if (!delivery || !delivery.delivery_id) {
      console.error('Invalid delivery selected');
      return;
    }
    setSelectedDelivery(delivery);
  };

  const handleActionComplete = async () => {
    try {
      await refreshAvailableDeliveries();
      setSelectedDelivery(null);
      toast.success("Delivery action completed successfully");
    } catch (err) {
      console.error('Error refreshing after action:', err);
      toast.error("Action completed but failed to refresh list");
    }
  };

  const stats = getDeliveryStats();

  const handleClearError = () => {
    clearError();
  };

  const handleRetry = () => {
    loadAvailableDeliveries();
  };

  return (
    <DeliveryLayout>
      <div className="dp-available-deliveries-page">
        <div className="dp-available-header">
          <h2>Available Deliveries</h2>
          <div className="dp-available-actions">
            <button
              className="dp-btn-secondary"
              onClick={refreshAvailableDeliveries}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="dp-error-alert">
            <div className="dp-error-content">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <div className="dp-error-actions">
              <button onClick={handleClearError} className="dp-btn-text">
                <X size={16} />
                Dismiss
              </button>
              <button onClick={handleRetry} className="dp-btn-secondary">
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="dp-deliveries-stats">
          <div className="dp-stat-chip">
            <span className="dp-chip-count">{stats.totalAvailable}</span>
            <span className="dp-chip-label">Total Available</span>
          </div>
          <div className="dp-stat-chip">
            <span className="dp-chip-count">{stats.avgWaitingTime}m</span>
            <span className="dp-chip-label">Avg Wait Time</span>
          </div>
          <div className="dp-stat-chip">
            <span className="dp-chip-count">{filteredDeliveries.filter(d => calculateWaitingTime(d.available_since) > 60).length}</span>
            <span className="dp-chip-label">Long Wait ({'>'}1h)</span>
          </div>
          <div className="dp-stat-chip">
            <span className="dp-chip-count">{filteredDeliveries.filter(d => d.priority === 'urgent').length}</span>
            <span className="dp-chip-label">Urgent</span>
          </div>
        </div>

        {/* Filters */}
        <div className="dp-filters-section">
          <div className="dp-filter-group">
            <div className="dp-search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by customer, address, or order ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="dp-search-input"
              />
              {filters.search && (
                <button
                  className="dp-clear-search"
                  onClick={() => handleFilterChange('search', '')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="dp-filter-group">
            <select
              className="dp-filter-select"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="nearest">Sort: Nearest First</option>
              <option value="urgent">Sort: Urgent First</option>
              <option value="time_slot">Sort: Time Slot</option>
              <option value="waiting">Sort: Longest Waiting</option>
            </select>
            <select
              className="dp-filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="urgent">Urgent Only</option>
              <option value="cod">COD Only</option>
              <option value="prepaid">Prepaid Only</option>
            </select>
          </div>
        </div>

        {loading && filteredDeliveries.length === 0 ? (
          <div className="dp-loading-state">
            <div className="dp-spinner"></div>
            <p>Loading available deliveries...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <AvailableDeliveryEmpty
            hasSearch={!!filters.search}
            onClearSearch={() => handleFilterChange('search', '')}
          />
        ) : (
          <>
            <AvailableDeliveryList
              deliveries={filteredDeliveries}
              selectedDelivery={selectedDelivery}
              onDeliverySelect={handleDeliverySelect}
              loading={loading}
              calculateWaitingTime={calculateWaitingTime}
            />

            {selectedDelivery && (
              <AvailableDeliveryActions
                delivery={selectedDelivery}
                onActionComplete={handleActionComplete}
              />
            )}
          </>
        )}

        {/* Longest Waiting Delivery Alert */}
        {stats.longestWaiting && stats.longestWaiting.waitingTime > 120 && (
          <div className="dp-alert-banner warning">
            <AlertTriangle size={24} />
            <div className="dp-alert-content">
              <strong>Longest Waiting Delivery:</strong>
              <span>Order #{stats.longestWaiting.order_id} has been waiting for {stats.longestWaiting.waitingTime} minutes</span>
            </div>
            <button className="dp-btn-text" onClick={() => handleDeliverySelect(stats.longestWaiting)}>
              <Eye size={16} />
              View
            </button>
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default AvailableDeliveries;
