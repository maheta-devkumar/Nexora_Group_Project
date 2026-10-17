import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DeliveryDashboardProvider } from '../../context/DeliveryPersonDashboardContext';

// Import all delivery context providers
import { ActiveDeliveriesProvider } from '../../context/delivery_panel/ActiveDeliveriesContext';
import { PendingPickupsProvider } from '../../context/delivery_panel/PendingPickupsContext';
import { CompletedDeliveriesProvider } from '../../context/delivery_panel/CompletedDeliveriesContext';
import { EarningsProvider } from '../../context/delivery_panel/EarningsContext';
import { PerformanceProvider } from '../../context/delivery_panel/PerformanceContext';
import { ScheduleProvider } from '../../context/delivery_panel/ScheduleContext';
import { VehicleProvider } from '../../context/delivery_panel/VehicleContext';
import { DeliveryProfileProvider } from '../../context/delivery_panel/DeliveryProfileContext';

// Import Error Boundary
import DeliveryErrorBoundary from '../../components/DeliveryPerson/Common/ErrorBoundary';
import { DeliveryReportsProvider } from '../../context/delivery_panel/DeliveryReportsContext';
import { AvailableDeliveriesProvider } from '../../context/delivery_panel/AvailableDeliveriesContext';

// IMPORT THE MISSING PROVIDERS
import { DeliveryPersonProvider } from '../../context/DeliveryPersonContext';
import { NotificationProvider } from '../../context/NotificationContext';

// Import pages - using lazy loading for better performance
const DeliveryDashboard = React.lazy(() => import('./Dashboard/Dashboard'));
const ActiveDeliveries = React.lazy(() => import('./ActiveDeliveries/ActiveDeliveries'));
const PendingPickups = React.lazy(() => import('./PendingPickups/PendingPickups'));
const CompletedDeliveries = React.lazy(() => import('./CompletedDeliveries/CompletedDeliveries'));
const Earnings = React.lazy(() => import('./Earnings/Earnings'));
const Performance = React.lazy(() => import('./Performance/Performance'));
const Vehicle = React.lazy(() => import('./Vehicle/Vehicle'));
const Profile = React.lazy(() => import('./Profile/Profile'));
const Reports = React.lazy(() => import('./Reports/Reports'));
const AvailableDeliveries = React.lazy(() => import('./AvailableDeliveries/AvailableDeliveries'));
const Notification = React.lazy(() => import('./Notification/Notification'));

// Import CSS
import './DeliveryPanel.css';

// Create a Loading component
const LoadingFallback = () => (
  <div className="dp-panel-loading-container">
    <div className="dp-panel-spinner"></div>
    <p className="dp-panel-loading-text">Loading delivery panel...</p>
  </div>
);

// Wrapper component for all delivery context providers
const DeliveryProviders = ({ children }) => (
  <DeliveryPersonProvider> {/* ADD THIS FIRST - Header needs it */}
    <NotificationProvider> {/* ADD THIS SECOND - Header needs it */}
      <DeliveryDashboardProvider>
        <ActiveDeliveriesProvider>
          <PendingPickupsProvider>
            <CompletedDeliveriesProvider>
              <EarningsProvider>
                <PerformanceProvider>
                  <ScheduleProvider>
                    <VehicleProvider>
                      <DeliveryProfileProvider>
                        <DeliveryReportsProvider>
                          <AvailableDeliveriesProvider>
                            {children}
                          </AvailableDeliveriesProvider>
                        </DeliveryReportsProvider>
                      </DeliveryProfileProvider>
                    </VehicleProvider>
                  </ScheduleProvider>
                </PerformanceProvider>
              </EarningsProvider>
            </CompletedDeliveriesProvider>
          </PendingPickupsProvider>
        </ActiveDeliveriesProvider>
      </DeliveryDashboardProvider>
    </NotificationProvider>
  </DeliveryPersonProvider>
);

// Main DeliveryPanel Component
const DeliveryPanel = () => {
  return (
    <DeliveryProviders>
      <DeliveryErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Default route - redirect to dashboard */}
            <Route path="/" element={<Navigate to="/delivery/dashboard" replace />} />

            {/* Dashboard */}
            <Route path="dashboard" element={<DeliveryDashboard />} />

            {/* Active Deliveries */}
            <Route path="active-deliveries" element={<ActiveDeliveries />} />

            {/* Available Deliveries */}
            <Route path="available-deliveries" element={<AvailableDeliveries />} />

            {/* Pending Pickups */}
            <Route path="pending-pickup" element={<PendingPickups />} />

            {/* Completed Deliveries */}
            <Route path="completed" element={<CompletedDeliveries />} />

            {/* Earnings Page */}
            <Route path="earnings" element={<Earnings />} />

            {/* Performance Page */}
            <Route path="performance" element={<Performance />} />


            {/* Vehicle Page */}
            <Route path="vehicle" element={<Vehicle />} />

            {/* Profile Page */}
            <Route path="profile" element={<Profile />} />

            {/* Reports Page */}
            <Route path="reports" element={<Reports />} />

            <Route path="notifications" element={<Notification />} />

            {/* Catch-all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/delivery/dashboard" replace />} />
          </Routes>
        </Suspense>
      </DeliveryErrorBoundary>
    </DeliveryProviders>
  );
};

export default DeliveryPanel;
