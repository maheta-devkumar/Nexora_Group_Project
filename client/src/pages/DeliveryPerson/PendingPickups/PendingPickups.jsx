import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { usePendingPickupsContext } from '../../../context/delivery_panel/PendingPickupsContext';
import DeliveryLayout from '../../../components/DeliveryPerson/Layout/DeliveryLayout';
import PickupList from '../../../components/DeliveryPerson/PendingPickups/PickupList';
import PickupActions from '../../../components/DeliveryPerson/PendingPickups/PickupActions';
import './PendingPickups.css';
import {
  Package,
  MapPin,
  Clock,
  CalendarClock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const PendingPickups = () => {
  const {
    groupedPickups = [],
    pickupStats,
    loading,
    error,
    fetchAllPickupData,
    fetchPendingPickups
  } = usePendingPickupsContext();

  const [filters, setFilters] = useState({
    vendor_type: 'all',
    sort_by: 'nearest'
  });
  const [selectedPickup, setSelectedPickup] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchAllPickupData();
      } catch (err) {
        console.error('Error loading pickup data:', err);
        toast.error("Failed to load pickup data");
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: value
    };
    setFilters(newFilters);

    // Apply filters by fetching new data
    fetchPendingPickups(newFilters);
  };

  const handlePickupSelect = (pickup) => {
    // Validate pickup before selection
    if (!pickup || !pickup.delivery_id) {
      console.error('Invalid pickup selected');
      return;
    }
    setSelectedPickup(pickup);
  };

  const handleActionComplete = async () => {
    try {
      // Refresh data after action
      await fetchPendingPickups(filters);
      setSelectedPickup(null);
      toast.success("Pickup action completed successfully");
    } catch (err) {
      console.error('Error refreshing after action:', err);
      toast.error("Action completed but failed to refresh list");
    }
  };

  // Get total packages count from stats
  const getTotalPackages = () => {
    if (!pickupStats || !pickupStats.total_packages) {
      return groupedPickups.reduce((total, location) => {
        return total + (location.pickups?.length || 0);
      }, 0);
    }
    return pickupStats.total_packages;
  };

  // Get total locations count
  const getTotalLocations = () => {
    return groupedPickups.length;
  };

  return (
    <DeliveryLayout>
      <div className="dp-pending-pickups-page">
        <div className="dp-page-header">
          <h2>Pending Pickup</h2>
          <div className="dp-filters">
            <select
              className="dp-filter-select"
              value={filters.vendor_type}
              onChange={(e) => handleFilterChange('vendor_type', e.target.value)}
            >
              <option value="all">All Pickup Locations</option>
              <option value="store">Stores</option>
              <option value="warehouse">Warehouses</option>
              <option value="vendor">Vendors</option>
              <option value="supplier">Suppliers</option>
            </select>
            <select
              className="dp-filter-select"
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
            >
              <option value="nearest">Sort: Nearest First</option>
              <option value="time_slot">Sort: Time Slot</option>
              <option value="package_size">Sort: Package Size</option>
              <option value="priority">Sort: Priority</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="dp-error-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => fetchAllPickupData()}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        {loading && groupedPickups.length === 0 ? (
          <div className="dp-loading-state">
            <div className="dp-spinner"></div>
            <p>Loading pending pickups...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="dp-pickup-summary">
              <div className="dp-summary-card">
                <div className="dp-summary-icon">
                  <Package />
                </div>
                <div className="dp-summary-info">
                  <strong>{getTotalPackages()}</strong>
                  <span>Packages to Pickup</span>
                </div>
              </div>
              <div className="dp-summary-card">
                <div className="dp-summary-icon">
                  <MapPin />
                </div>
                <div className="dp-summary-info">
                  <strong>{getTotalLocations()}</strong>
                  <span>Pickup Locations</span>
                </div>
              </div>
              <div className="dp-summary-card">
                <div className="dp-summary-icon">
                  <Clock />
                </div>
                <div className="dp-summary-info">
                  <strong>{pickupStats?.average_pickup_time || 'N/A'}</strong>
                  <span>Avg Pickup Time</span>
                </div>
              </div>
              <div className="dp-summary-card">
                <div className="dp-summary-icon">
                  <CalendarClock />
                </div>
                <div className="dp-summary-info">
                  <strong>{pickupStats?.urgent_pickups || 0}</strong>
                  <span>Urgent Pickups</span>
                </div>
              </div>
            </div>

            <PickupList
              groupedPickups={groupedPickups}
              selectedPickup={selectedPickup}
              onPickupSelect={handlePickupSelect}
              loading={loading}
            />

            {selectedPickup && (
              <PickupActions
                pickup={selectedPickup}
                onActionComplete={handleActionComplete}
              />
            )}
          </>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default PendingPickups;
