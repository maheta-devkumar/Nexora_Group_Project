import React, { useState, useEffect } from 'react';
import { DeliveryProvider, useDeliveryContext } from '../../../context/DeliveryContext';
import { OrderAdminProvider } from '../../../context/OrderAdminContext';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout';
import ErrorBoundary from '../../../components/ErrorBoundary';
import DeliveryOverview from '../../../components/Admin/Delivery/DeliveryOverview';
import DeliveryOrdersTable from '../../../components/Admin/Delivery/DeliveryOrdersTable';
import DeliveryIssuesTable from '../../../components/Admin/Delivery/DeliveryIssuesTable';
import DeliveryEarnings from '../../../components/Admin/Delivery/DeliveryEarnings';
import DeliveryPerformance from '../../../components/Admin/Delivery/DeliveryPerformance';
import './Delivery.css';

// Wrap each component with its own ErrorBoundary
const SafeComponent = ({ component: Component, retryCallback, ...props }) => (
  <ErrorBoundary onRetry={retryCallback}>
    <Component {...props} />
  </ErrorBoundary>
);

const DeliveryContent = () => {
  const { loading, error, clearError } = useDeliveryContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [componentKeys, setComponentKeys] = useState({
    overview: 0,
    orders: 0,
    issues: 0,
    earnings: 0,
    performance: 0
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'orders', label: 'Delivery Orders', icon: '📦' },
    { id: 'issues', label: 'Delivery Issues', icon: '⚠️' },
    { id: 'earnings', label: 'Delivery Earnings', icon: '💰' },
    { id: 'performance', label: 'Performance', icon: '📈' },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    clearError();
  };

  const handleRetry = (tabId) => {
    setComponentKeys(prev => ({
      ...prev,
      [tabId]: prev[tabId] + 1
    }));
    clearError();
  };

  const renderContent = () => {
    const components = {
      overview: DeliveryOverview,
      orders: DeliveryOrdersTable,
      issues: DeliveryIssuesTable,
      earnings: DeliveryEarnings,
      performance: DeliveryPerformance
    };

    const Component = components[activeTab];
    
    return (
      <SafeComponent
        key={`${activeTab}-${componentKeys[activeTab]}`}
        component={Component}
        retryCallback={() => handleRetry(activeTab)}
      />
    );
  };

  return (
    <div className="delivery-admin-page">
      <div className="page-header">
        <h1>Delivery Management</h1>
        <p className="page-subtitle">Manage deliveries, track performance, and handle issues</p>
      </div>

      {/* Global Error Display */}
      {error && (
        <div className="global-error">
          <div className="error-message">
            <span className="error-icon">❌</span>
            <span className="error-text">{error}</span>
          </div>
          <button className="dismiss-btn" onClick={clearError}>✕</button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="delivery-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            disabled={loading}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="delivery-content">
        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading delivery data...</p>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

// Wrap the entire app with ErrorBoundary at the top level
const DeliveryPage = () => {
  return (
    <AdminLayout>
      <ErrorBoundary>
        <DeliveryProvider>
          <OrderAdminProvider>
            <DeliveryContent />
          </OrderAdminProvider>
        </DeliveryProvider>
      </ErrorBoundary>
    </AdminLayout>
  );
};

export default DeliveryPage;