import React, { useState, useEffect } from 'react';
import { useReportsContext } from '../../../../context/ReportsContext';
import ReportChart from '../Common/ReportChart';
import ReportTable from '../Common/ReportTable';
import FilterPanel from '../Common/FilterPanel';
import ExportControls from '../Common/ExportControls';
import { 
  FaTag, 
  FaBullhorn, 
  FaChartLine, 
  FaUsers,
  FaDollarSign,
  FaPercentage,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaExclamationTriangle
} from 'react-icons/fa';

import {
  safeToLocaleString,
  safeFormatDollar,
  safeFormatPercent,
  safeArray
} from '../../../../utils/safeRender';
import './MarketingDashboard.css';

const MarketingDashboard = () => {
  const {
    marketingReports,
    loading,
    error: contextError,
    getCouponUsageReport,
    getOfferPerformanceReport,
    getPromotionalSummary,
    exportReport
  } = useReportsContext();

  const [activeTab, setActiveTab] = useState('coupons');
  const [filters, setFilters] = useState({});
  const [localDateRange, setLocalDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date()
  });
  const [exportStatus, setExportStatus] = useState({ type: null, message: '' });
  const [dataLoadError, setDataLoadError] = useState(null);

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadMarketingData = async () => {
      if (!isMounted) return;
      
      try {
        setDataLoadError(null);
        const formattedStartDate = formatDateForAPI(localDateRange.startDate);
        const formattedEndDate = formatDateForAPI(localDateRange.endDate);

        switch (activeTab) {
          case 'coupons':
            await getCouponUsageReport(formattedStartDate, formattedEndDate);
            break;
          case 'offers':
            await getOfferPerformanceReport(formattedStartDate, formattedEndDate);
            break;
          case 'summary':
            await getPromotionalSummary(formattedStartDate, formattedEndDate);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Marketing ${activeTab} load error:`, error);
        if (isMounted) {
          setDataLoadError(`Failed to load ${activeTab} data: ${error.message || 'Unknown error'}`);
        }
      }
    };

    loadMarketingData();

    return () => {
      isMounted = false;
    };
  }, [activeTab, localDateRange, getCouponUsageReport, getOfferPerformanceReport, getPromotionalSummary]);

  const tabs = [
    { id: 'coupons', label: 'Coupons', icon: <FaTag /> },
    { id: 'offers', label: 'Offers', icon: <FaBullhorn /> },
    { id: 'summary', label: 'Summary', icon: <FaChartLine /> }
  ];

  const marketingFilters = [
    { key: 'type', label: 'Campaign Type', type: 'select', options: [
      { value: 'coupon', label: 'Coupon' },
      { value: 'discount', label: 'Discount' },
      { value: 'bundle', label: 'Bundle Offer' },
      { value: 'flash_sale', label: 'Flash Sale' }
    ]},
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' },
      { value: 'expired', label: 'Expired' },
      { value: 'scheduled', label: 'Scheduled' }
    ]},
    { key: 'minDiscount', label: 'Min Discount', type: 'number', placeholder: '0' },
    { key: 'maxDiscount', label: 'Max Discount', type: 'number', placeholder: '100' }
  ];

  const couponColumns = [
    { field: 'coupon_code', header: 'Coupon Code', width: '15%' },
    { field: 'description', header: 'Description', width: '25%' },
    { field: 'discount_type', header: 'Type', render: (value) => (
      <span className="coupon-type">
        {value || '-'}
      </span>
    )},
    { field: 'discount_value', header: 'Value', render: (value, row) => (
      <span className="coupon-value">
        {row.discount_type === 'percentage' ? `${value || 0}%` : safeFormatDollar(value || 0)}
      </span>
    )},
    { field: 'usage_count', header: 'Usage', render: (value) => 
      safeToLocaleString(value)
    },
    { field: 'total_discount', header: 'Total Discount', render: (value) => 
      safeFormatDollar(value)
    },
    { field: 'redemption_rate', header: 'Redemption Rate', render: (value) => (
      <span className={`redemption-rate ${
        (value || 0) >= 20 ? 'high' :
        (value || 0) >= 10 ? 'medium' :
        'low'
      }`}>
        {safeFormatPercent(value || 0)}
      </span>
    )}
  ];

  const handleExport = async (format) => {
    const reportTypeMap = {
      coupons: 'marketing',
      offers: 'marketing',
      summary: 'marketing'
    };

    const reportType = reportTypeMap[activeTab] || 'marketing';
    const formattedStartDate = formatDateForAPI(localDateRange.startDate);
    const formattedEndDate = formatDateForAPI(localDateRange.endDate);

    setExportStatus({ type: 'loading', message: 'Preparing export...' });
    
    try {
      const result = await exportReport(
        reportType,
        format,
        formattedStartDate,
        formattedEndDate
      );

      if (result?.success) {
        setExportStatus({ 
          type: 'success', 
          message: `Export completed! File: ${result.filename || 'report'}` 
        });
        setTimeout(() => setExportStatus({ type: null, message: '' }), 5000);
        return { success: true };
      } else {
        setExportStatus({ 
          type: 'error', 
          message: result?.message || 'Export failed' 
        });
        setTimeout(() => setExportStatus({ type: null, message: '' }), 5000);
        return { success: false, message: result?.message };
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ 
        type: 'error', 
        message: error.message || 'Export failed due to an unknown error' 
      });
      setTimeout(() => setExportStatus({ type: null, message: '' }), 5000);
      return { success: false, message: error.message };
    }
  };

  const renderExportStatus = () => {
    if (!exportStatus.type) return null;

    const statusConfig = {
      loading: {
        icon: <FaSpinner className="spinner-icon" />,
        className: 'export-status loading'
      },
      success: {
        icon: <FaCheck className="success-icon" />,
        className: 'export-status success'
      },
      error: {
        icon: <FaTimes className="error-icon" />,
        className: 'export-status error'
      }
    };

    const config = statusConfig[exportStatus.type];

    return (
      <div className={config.className}>
        {config.icon}
        <span className="status-message">{exportStatus.message}</span>
      </div>
    );
  };

  const renderErrorState = () => {
    const errorMessage = contextError || dataLoadError;
    
    if (!errorMessage) return null;

    return (
      <div className="error-state">
        <div className="error-content">
          <FaExclamationTriangle className="error-icon" />
          <div>
            <h3 className="error-title">Error Loading Data</h3>
            <p className="error-message">{errorMessage}</p>
            <div className="error-tips">
              <p className="tips-title">Troubleshooting Tips:</p>
              <ul className="tips-list">
                <li>Check if the backend server is running on port 8000</li>
                <li>Verify your internet connection</li>
                <li>Try reducing the date range to 1-3 days</li>
                <li>Clear browser cache and reload the page</li>
                <li>Check browser console (F12) for detailed error logs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLoadingState = () => {
    if (!loading) return null;

    return (
      <div className="loading-state-container">
        <div className="loading-content">
          <FaSpinner className="loading-spinner" />
          <div>
            <p className="loading-message">Loading {activeTab} data...</p>
            <p className="loading-details">
              Date Range: {formatDateForAPI(localDateRange.startDate)} to {formatDateForAPI(localDateRange.endDate)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderCoupons = () => {
    const couponData = safeArray(marketingReports.couponUsage);
    const totalDiscount = couponData.reduce((sum, coupon) => sum + (coupon.total_discount || 0), 0);
    const totalUsage = couponData.reduce((sum, coupon) => sum + (coupon.usage_count || 0), 0);
    const avgRedemption = couponData.length > 0 
      ? couponData.reduce((sum, coupon) => sum + (coupon.redemption_rate || 0), 0) / couponData.length
      : 0;

    return (
      <div className="dashboard-coupons">
        <div className="coupon-metrics">
          <div className="metric-card discount">
            <div className="metric-content">
              <p className="metric-label">Total Discount Given</p>
              <p className="metric-value">
                {safeFormatDollar(totalDiscount)}
              </p>
              <p className="metric-detail">
                Across all coupons
              </p>
            </div>
            <div className="metric-icon">
              <FaDollarSign />
            </div>
          </div>
          
          <div className="metric-card usage">
            <div className="metric-content">
              <p className="metric-label">Total Coupon Usage</p>
              <p className="metric-value">
                {safeToLocaleString(totalUsage)}
              </p>
              <p className="metric-detail">
                {couponData.length} active coupons
              </p>
            </div>
            <div className="metric-icon">
              <FaTag />
            </div>
          </div>
          
          <div className="metric-card redemption">
            <div className="metric-content">
              <p className="metric-label">Avg. Redemption Rate</p>
              <p className="metric-value">
                {avgRedemption.toFixed(1)}%
              </p>
              <p className="metric-detail">
                Industry avg: 15%
              </p>
            </div>
            <div className="metric-icon">
              <FaPercentage />
            </div>
          </div>
        </div>

        <div className="coupon-charts">
          <ReportChart
            title="Top Performing Coupons"
            data={couponData.slice(0, 8)}
            xAxisKey="coupon_code"
            yAxisKey="usage_count"
            type="bar"
            height={300}
            loading={loading}
            emptyMessage="No coupon data available"
          />
          
          <ReportChart
            title="Discount Distribution"
            data={couponData.map(coupon => ({
              label: coupon.coupon_code || 'Unknown',
              value: coupon.total_discount || 0
            }))}
            type="pie"
            height={300}
            loading={loading}
            emptyMessage="No discount distribution data"
          />
        </div>

        <ReportTable
          title="Coupon Performance"
          data={couponData}
          columns={couponColumns}
          loading={loading}
          emptyMessage="No coupon data available"
        />
      </div>
    );
  };

  const renderOffers = () => {
    const offerData = safeArray(marketingReports.offerPerformance);
    const totalRevenue = offerData.reduce((sum, offer) => sum + (offer.revenue_generated || 0), 0);
    const totalConversions = offerData.reduce((sum, offer) => sum + (offer.conversions || 0), 0);

    return (
      <div className="dashboard-offers">
        <div className="offer-metrics">
          <div className="metric-card campaigns">
            <h4 className="metric-title">Total Campaigns</h4>
            <p className="metric-value">
              {safeToLocaleString(offerData.length)}
            </p>
          </div>
          
          <div className="metric-card revenue">
            <h4 className="metric-title">Revenue Generated</h4>
            <p className="metric-value">
              {safeFormatDollar(totalRevenue)}
            </p>
          </div>
          
          <div className="metric-card conversions">
            <h4 className="metric-title">Total Conversions</h4>
            <p className="metric-value">
              {safeToLocaleString(totalConversions)}
            </p>
          </div>
        </div>

        <ReportChart
          title="Offer Performance"
          data={offerData}
          xAxisKey="offer_name"
          yAxisKey="revenue_generated"
          datasets={[
            { key: 'revenue_generated', label: 'Revenue' },
            { key: 'conversions', label: 'Conversions' },
            { key: 'roi', label: 'ROI (%)' }
          ]}
          type="bar"
          height={400}
          loading={loading}
          emptyMessage="No offer data available"
        />

        <ReportTable
          title="Campaign Performance"
          data={offerData}
          columns={[
            { field: 'offer_name', header: 'Campaign', width: '25%' },
            { field: 'type', header: 'Type' },
            { field: 'start_date', header: 'Start Date' },
            { field: 'end_date', header: 'End Date' },
            { field: 'budget', header: 'Budget', render: (value) => 
              safeFormatDollar(value)
            },
            { field: 'revenue_generated', header: 'Revenue', render: (value) => 
              safeFormatDollar(value)
            },
            { field: 'roi', header: 'ROI', render: (value) => (
              <span className={`roi-value ${
                (value || 0) >= 200 ? 'high' :
                (value || 0) >= 100 ? 'medium' :
                'low'
              }`}>
                {safeFormatPercent(value || 0)}
              </span>
            )},
            { field: 'conversion_rate', header: 'Conv. Rate', render: (value) => 
              safeFormatPercent(value || 0)
            }
          ]}
          loading={loading}
          emptyMessage="No offer data available"
        />
      </div>
    );
  };

  const renderSummary = () => {
    const summary = marketingReports.promotionalSummary || {};
    const campaignPerformance = safeArray(summary.campaign_performance);
    
    return (
      <div className="dashboard-summary">
        <div className="summary-metrics">
          <div className="metric-card revenue">
            <div className="metric-content">
              <p className="metric-label">Total Promo Revenue</p>
              <p className="metric-value">
                {safeFormatDollar(summary.total_promo_revenue || 0)}
              </p>
              <p className="metric-detail">
                {safeToLocaleString(summary.promo_orders || 0)} orders
              </p>
            </div>
            <div className="metric-icon">
              <FaDollarSign />
            </div>
          </div>
          
          <div className="metric-card order-value">
            <div className="metric-content">
              <p className="metric-label">Avg. Order Value</p>
              <p className="metric-value">
                ${(summary.avg_promo_order_value || 0).toFixed(2)}
              </p>
              <p className="metric-detail">
                With promotions
              </p>
            </div>
            <div className="metric-icon">
              <FaChartLine />
            </div>
          </div>
          
          <div className="metric-card acquisition">
            <div className="metric-content">
              <p className="metric-label">Customer Acquisition</p>
              <p className="metric-value">
                {safeToLocaleString(summary.new_customers_from_promo || 0)}
              </p>
              <p className="metric-detail">
                From promotions
              </p>
            </div>
            <div className="metric-icon">
              <FaUsers />
            </div>
          </div>
          
          <div className="metric-card lift">
            <div className="metric-content">
              <p className="metric-label">Promo Lift</p>
              <p className="metric-value">
                {safeFormatPercent(summary.promo_lift || 0)}
              </p>
              <p className="metric-detail">
                Revenue increase
              </p>
            </div>
            <div className="metric-icon">
              <FaPercentage />
            </div>
          </div>
        </div>

        {campaignPerformance.length > 0 && (
          <ReportChart
            title="Campaign Performance Over Time"
            data={campaignPerformance}
            xAxisKey="period"
            yAxisKey="revenue"
            datasets={[
              { key: 'revenue', label: 'Revenue' },
              { key: 'orders', label: 'Orders' },
              { key: 'customers', label: 'New Customers' }
            ]}
            type="line"
            height={350}
            loading={loading}
          />
        )}

        <div className="summary-content">
          <div className="effectiveness-summary">
            <h3 className="section-title">Promotion Effectiveness</h3>
            <div className="effectiveness-stats">
              <div className="stat-item">
                <p className="stat-label">Best Performing Channel</p>
                <p className="stat-value">
                  {summary.best_channel || 'N/A'}
                </p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Most Effective Offer Type</p>
                <p className="stat-value">
                  {summary.most_effective_offer || 'N/A'}
                </p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Customer Retention Rate</p>
                <p className="stat-value retention">
                  {safeFormatPercent(summary.promo_customer_retention || 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="cost-analysis">
            <h3 className="section-title">Cost Analysis</h3>
            <div className="cost-stats">
              <div className="stat-item">
                <span className="stat-label">Total Marketing Spend</span>
                <span className="stat-value">
                  {safeFormatDollar(summary.total_marketing_spend || 0)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Cost per Acquisition</span>
                <span className="stat-value">
                  ${(summary.cost_per_acquisition || 0).toFixed(2)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Overall ROI</span>
                <span className={`stat-value ${
                  (summary.overall_roi || 0) >= 200 ? 'high' :
                  (summary.overall_roi || 0) >= 100 ? 'medium' :
                  'low'
                }`}>
                  {safeFormatPercent(summary.overall_roi || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'coupons':
        return renderCoupons();
      case 'offers':
        return renderOffers();
      case 'summary':
        return renderSummary();
      default:
        return (
          <div className="no-tab-selected">
            <p className="no-tab-message">Select a tab to view data</p>
          </div>
        );
    }
  };

  return (
    <div className="marketing-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="dashboard-title">Marketing Reports</h2>
          <p className="dashboard-subtitle">Analyze marketing campaigns and promotions</p>
        </div>
        <ExportControls
          onExport={handleExport}
          formats={['csv', 'excel']}
          fileName={`${activeTab}_report_${formatDateForAPI(localDateRange.startDate)}_to_${formatDateForAPI(localDateRange.endDate)}`}
          disabled={loading || exportStatus.type === 'loading'}
          loading={loading || exportStatus.type === 'loading'}
        />
      </div>

      {renderExportStatus()}
      {renderErrorState()}
      {renderLoadingState()}

      <div className="date-range-selector">
        <div className="date-range-content">
          <div className="date-range-info">
            <h3 className="date-range-title">Date Range</h3>
            <p className="date-range-subtitle">Select date range for reports</p>
          </div>
          <div className="date-range-controls">
            <div className="date-input-group">
              <label className="date-label">Start Date</label>
              <input
                type="date"
                value={formatDateForAPI(localDateRange.startDate)}
                onChange={(e) => setLocalDateRange(prev => ({
                  ...prev,
                  startDate: e.target.value ? new Date(e.target.value) : prev.startDate
                }))}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label className="date-label">End Date</label>
              <input
                type="date"
                value={formatDateForAPI(localDateRange.endDate)}
                onChange={(e) => setLocalDateRange(prev => ({
                  ...prev,
                  endDate: e.target.value ? new Date(e.target.value) : prev.endDate
                }))}
                className="date-input"
              />
            </div>
            <div className="quick-date-buttons">
              <button
                onClick={() => setLocalDateRange({
                  startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
                  endDate: new Date()
                })}
                className="quick-date-button"
                title="1 day - Fastest loading"
              >
                1 Day
              </button>
              <button
                onClick={() => setLocalDateRange({
                  startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
                  endDate: new Date()
                })}
                className="quick-date-button primary"
                title="7 days - Recommended"
              >
                7 Days
              </button>
              <button
                onClick={() => setLocalDateRange({
                  startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
                  endDate: new Date()
                })}
                className="quick-date-button"
                title="30 days - May be slow"
              >
                30 Days
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <FilterPanel
        filters={marketingFilters}
        onFilterChange={setFilters}
        onApply={() => console.log('Marketing filters applied:', filters)}
        onReset={() => setFilters({})}
        loading={loading}
      />

      {loading && !marketingReports[activeTab] ? (
        <div className="data-loading">
          <FaSpinner className="loading-spinner" />
          <p className="loading-message">Loading {activeTab} data...</p>
          <p className="loading-note">
            This may take a moment for larger date ranges
          </p>
        </div>
      ) : (
        <div className="dashboard-content">
          {renderTabContent()}
        </div>
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <p className="debug-title">Debug Information:</p>
          <div className="debug-grid">
            <div>
              <p>Active Tab: <span>{activeTab}</span></p>
              <p>Date Range: <span>{formatDateForAPI(localDateRange.startDate)} to {formatDateForAPI(localDateRange.endDate)}</span></p>
              <p>Loading: <span className={loading ? 'loading' : 'loaded'}>{loading ? 'Yes' : 'No'}</span></p>
            </div>
            <div>
              <p>Export Status: <span className={`export-status-${exportStatus.type || 'none'}`}>{exportStatus.type || 'None'}</span></p>
              <p>Data Available: <span className={marketingReports[activeTab] ? 'available' : 'unavailable'}>{marketingReports[activeTab] ? 'Yes' : 'No'}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingDashboard;