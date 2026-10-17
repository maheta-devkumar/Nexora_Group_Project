import React, { useEffect, useState } from 'react';
import { useCompletedDeliveriesContext } from '../../../context/delivery_panel/CompletedDeliveriesContext';
import DeliveryLayout from '../../../components/DeliveryPerson/Layout/DeliveryLayout';
import CompletedDeliveryTable from '../../../components/DeliveryPerson/CompletedDeliveries/CompletedDeliveryTable';
import DeliveryDetailsModal from '../../../components/DeliveryPerson/CompletedDeliveries/DeliveryDetailsModal';
import './CompletedDeliveries.css';
import {
  PackageCheck,
  Clock,
  Star,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const CompletedDeliveries = () => {
  const {
    completedDeliveries = [],
    summaryStatistics,
    loading,
    error,
    fetchAllCompletedDeliveryData,
    fetchCompletedDeliveries,
    updateFilters,
    filters
  } = useCompletedDeliveriesContext();

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    period: 'Last 7 Days',
    date: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchAllCompletedDeliveryData();
      } catch (err) {
        console.error('Error loading completed deliveries:', err);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...localFilters,
      [filterType]: value
    };
    setLocalFilters(newFilters);

    // Map UI filters to API filters
    let apiFilters = {};

    if (newFilters.date) {
      apiFilters.start_date = newFilters.date;
      apiFilters.end_date = newFilters.date;
    }

    switch (newFilters.period) {
      case 'Last 7 Days':
        apiFilters.period = '7days';
        break;
      case 'Last 30 Days':
        apiFilters.period = '30days';
        break;
      case 'This Month':
        apiFilters.period = 'month';
        break;
      case 'Custom Range':
        // Handle custom date range
        break;
    }

    updateFilters(apiFilters);
    fetchCompletedDeliveries(apiFilters);
  };

  const handleViewDetails = (delivery) => {
    if (!delivery || !delivery.delivery_id) {
      console.error('Invalid delivery selected');
      return;
    }
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  const handleDownloadPOD = (deliveryId) => {
    // This would trigger file download in a real app
    console.log('Downloading POD for delivery:', deliveryId);
    alert(`Downloading Proof of Delivery for delivery ${deliveryId}. In a real app, this would download the file.`);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedDelivery(null);
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get formatted statistics
  const getFormattedStats = () => {
    if (!summaryStatistics) {
      return {
        total: 0,
        onTimeRate: '0%',
        avgRating: '0.0'
      };
    }

    return {
      total: summaryStatistics.total_completed || completedDeliveries.length,
      onTimeRate: `${summaryStatistics.on_time_rate || 0}%`,
      avgRating: (summaryStatistics.average_rating || 0).toFixed(1)
    };
  };

  const stats = getFormattedStats();

  return (
    <DeliveryLayout>
      <div className="dp-completed-deliveries-page">
        <div className="dp-page-header">
          <h2>Completed Deliveries</h2>
          <div className="dp-filters">
            <input
              type="date"
              className="dp-filter-input"
              value={localFilters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />
            <select
              className="dp-filter-select"
              value={localFilters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="dp-error-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => fetchAllCompletedDeliveryData()}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        {loading && completedDeliveries.length === 0 ? (
          <div className="dp-loading-state">
            <div className="dp-spinner"></div>
            <p>Loading completed deliveries...</p>
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            <div className="dp-completed-summary">
              <div className="dp-summary-card">
                <div className="dp-summary-icon">
                  <PackageCheck />
                </div>
                <div className="dp-summary-info">
                  <strong>{stats.total}</strong>
                  <span>Total Completed</span>
                </div>
              </div>
              <div className="dp-summary-card">
                <div className="dp-summary-icon">
                  <Clock />
                </div>
                <div className="dp-summary-info">
                  <strong>{stats.onTimeRate}</strong>
                  <span>On-Time Rate</span>
                </div>
              </div>
              <div className="dp-summary-card">
                <div className="dp-summary-icon">
                  <Star />
                </div>
                <div className="dp-summary-info">
                  <strong>{stats.avgRating}</strong>
                  <span>Avg Rating</span>
                </div>
              </div>
            </div>

            {/* Delivery Table */}
            <CompletedDeliveryTable
              deliveries={completedDeliveries}
              onViewDetails={handleViewDetails}
              onDownloadPOD={handleDownloadPOD}
              loading={loading}
            />

            {/* Pagination */}
            <div className="dp-pagination">
              <button className="dp-page-btn" disabled>
                <ChevronLeft size={16} />
              </button>
              <button className="dp-page-btn active">1</button>
              <button className="dp-page-btn">2</button>
              <button className="dp-page-btn">3</button>
              <span className="dp-page-dots">...</span>
              <button className="dp-page-btn">10</button>
              <button className="dp-page-btn">
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}

        {/* Delivery Details Modal */}
        {showDetailsModal && selectedDelivery && (
          <DeliveryDetailsModal
            delivery={selectedDelivery}
            onClose={handleCloseModal}
            onDownloadPOD={() => handleDownloadPOD(selectedDelivery.delivery_id)}
          />
        )}
      </div>
    </DeliveryLayout>
  );
};

export default CompletedDeliveries;
