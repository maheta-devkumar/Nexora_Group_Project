import React, { useEffect, useMemo, useState } from 'react';
import { useAnalyticsContext } from '../../../context/AnalyticsContext';
import DashboardSummary from '../../../components/Admin/Analytics/Dashboard/DashboardSummary';
import SalesOverview from '../../../components/Admin/Analytics/Sales/SalesOverview';
import TopProductsTable from '../../../components/Admin/Analytics/Products/TopProductsTable';
import CustomerInsights from '../../../components/Admin/Analytics/Customers/CustomerInsights';
import InventoryAlerts from '../../../components/Admin/Analytics/Inventory/InventoryAlerts';
import SearchAnalytics from '../../../components/Admin/Analytics/Behavior/SearchAnalytics';
import ActivityLogTable from '../../../components/Admin/Analytics/Activity/ActivityLogTable';
import LoadingSkeleton from '../../../components/Admin/Analytics/Shared/LoadingSkeleton';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout';

// New Features (AI)
import AiInsights from '../../../components/Admin/Dashboard/AiInsights';

// Charts
import SalesChart from '../../../components/Admin/Charts/SalesChart';
import RevenueChart from '../../../components/Admin/Charts/RevenueChart';
import OrdersChart from '../../../components/Admin/Charts/OrdersChart';
import TrafficChart from '../../../components/Admin/Charts/TrafficChart';
import InventoryPieChart from '../../../components/Admin/Charts/InventoryPieChart';

import './Dashboard.css';

const Dashboard = () => {
    const {
        fetchAllAnalyticsData,
        loading,
        error,
        dashboardSummary,
        salesReport,
        topSellingProducts,
        customerInsights,
        inventoryStatus,
        searchAnalytics,
        adminActivityLogs
    } = useAnalyticsContext();

    const [selectedChart, setSelectedChart] = useState('revenue');

    useEffect(() => {
        fetchAllAnalyticsData();
    }, [fetchAllAnalyticsData]);

    const handleRefresh = () => {
        fetchAllAnalyticsData();
    };

    // --- Data Preparation for Visualizations ---

    // 1. Performance Trends
    const chartData = useMemo(() => {
        if (!salesReport || !salesReport.trends) return [];
        return salesReport.trends.map(trend => ({
            label: trend.period,
            value: trend.revenue,
            orders: trend.orders
        }));
    }, [salesReport]);

    // 2. Inventory Distribution
    const inventoryPieData = useMemo(() => {
        if (!inventoryStatus || inventoryStatus.length === 0) {
            return [
                { name: 'In Stock', value: 85, fill: '#4ade80' },
                { name: 'Low Stock', value: 10, fill: '#facc15' },
                { name: 'Out of Stock', value: 5, fill: '#f87171' }
            ];
        }
        const low = inventoryStatus.filter(i => i.status === 'LOW_STOCK').length;
        const out = inventoryStatus.filter(i => i.status === 'OUT_OF_STOCK').length;
        const active = Math.max(0, 50 - low - out); // Mock total for visual balance if unknown
        return [
            { name: 'In Stock', value: active, fill: '#4ade80' },
            { name: 'Low Stock', value: low, fill: '#facc15' },
            { name: 'Out of Stock', value: out, fill: '#f87171' }
        ];
    }, [inventoryStatus]);

    // 3. Category/Traffic Mock
    const trafficData = useMemo(() => [
        { label: 'Direct', value: 450 }, { label: 'Social', value: 320 },
        { label: 'Organic', value: 280 }, { label: 'Referral', value: 150 }
    ], []);

    // --- AI Insights Generation ---
    const aiData = useMemo(() => {
        const alerts = [];
        const recommendations = [];
        let summary = "Store performance is navigating normal ranges.";

        if (salesReport?.summary) {
            const growth = salesReport.summary.revenue_growth || 0;
            summary = growth >= 0
                ? `Revenue is trending up by ${growth}%. Strong performance in sales.`
                : `Revenue is down by ${Math.abs(growth)}%. Attention needed in marketing.`;
        }

        if (inventoryStatus.length > 0) {
            alerts.push({ id: 1, type: 'critical', message: `${inventoryStatus.length} products require restocking attention.` });
            recommendations.push({ id: 1, message: "Prioritize restocking critical low-stock items." });
        }

        if (customerInsights && customerInsights.new_customers > 0) {
            summary += ` We gained ${customerInsights.new_customers} new customers recently!`;
        }

        return {
            summary,
            alerts: alerts.length > 0 ? alerts : [{ id: 0, type: 'info', message: 'No critical/urgent alerts.' }],
            recommendations: recommendations.length > 0 ? recommendations : [{ id: 0, message: 'Analyze top products for promotion opportunities.' }]
        };
    }, [salesReport, inventoryStatus, customerInsights]);


    if (loading && !dashboardSummary) {
        return (
            <AdminLayout>
                <div className="admin-loading-skeleton"></div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="admin-dashboard-page">
                    <div className="admin-empty-state" style={{ borderColor: '#ef4444', color: '#b91c1c' }}>
                        <h3>⚠️ Error Loading Dashboard</h3>
                        <p>{error}</p>
                        <button onClick={handleRefresh} className="admin-refresh-btn" style={{ margin: '10px auto' }}>Retry Connection</button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-dashboard-page p-6 lg:p-8 animate-fade-in">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* --- HEADER --- */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
                        <div>
                            <h1 className="admin-dashboard-title">Analytics Dashboard</h1>
                            <p className="text-subtle mt-2 font-medium">Comprehensive store performance overview</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="px-4 py-2 bg-white text-slate-600 font-semibold rounded-xl border border-slate-200 shadow-sm text-sm">
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>

                        </div>
                    </div>

                    {/* --- 1. KEY METRICS SUMMARY --- */}
                    {dashboardSummary && (
                        <section>
                            <DashboardSummary data={dashboardSummary} />
                        </section>
                    )}

                    {/* --- 2. AI INSIGHTS --- */}
                    <section>
                        <AiInsights data={aiData} />
                    </section>

                    {/* --- 3. MAIN CHARTS & TRENDS --- */}
                    <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Main Chart */}
                        <div className="xl:col-span-2 admin-dashboard-card p-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="admin-dashboard-section-header mb-0">
                                    <span>📈</span> Performance Trends
                                </h2>
                                <div className="ad-chart-controls">
                                    {['revenue', 'orders', 'traffic'].map(chart => (
                                        <button
                                            key={chart}
                                            className={`ad-chart-btn ${selectedChart === chart ? 'active' : ''}`}
                                            onClick={() => setSelectedChart(chart)}
                                        >
                                            {chart}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[380px] w-full">
                                {selectedChart === 'revenue' && <RevenueChart data={chartData} height={380} />}
                                {selectedChart === 'orders' && <OrdersChart data={chartData} height={380} />}
                                {selectedChart === 'traffic' && <TrafficChart data={trafficData} height={380} />}
                            </div>
                        </div>

                        {/* Secondary Charts Stack */}
                        <div className="flex flex-col">
                            <div className="admin-dashboard-card p-6 h-full flex flex-col">
                                <h2 className="admin-dashboard-section-header mb-6">
                                    <span>📦</span> Inventory Status
                                </h2>
                                <div className="flex-1 flex items-center justify-center">
                                    <InventoryPieChart data={inventoryPieData} height={300} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* --- 4. DETAILED ANALYTICS GRID --- */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                        {/* LEFT COLUMN */}
                        <div className="space-y-8">
                            {/* Sales Detail */}
                            <section className="admin-dashboard-card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="admin-dashboard-section-header mb-0">Sales Overview</h3>
                                </div>
                                {salesReport && <SalesOverview data={salesReport} />}
                            </section>

                            {/* Products Detail */}
                            <section className="admin-dashboard-card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="admin-dashboard-section-header mb-0">Top Performers</h3>
                                </div>
                                {topSellingProducts.length > 0 ? (
                                    <TopProductsTable products={topSellingProducts} />
                                ) : (
                                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium">No product data available</div>
                                )}
                            </section>

                            {/* Activity Logs */}
                            <section className="admin-dashboard-card p-6">
                                <h3 className="admin-dashboard-section-header mb-6">Recent System Activity</h3>
                                {adminActivityLogs.length > 0 && <ActivityLogTable logs={adminActivityLogs} />}
                            </section>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-8">
                            {/* Inventory Alerts */}
                            <section className="admin-dashboard-card p-6">
                                <h3 className="admin-dashboard-section-header mb-6">Stock Attention Required</h3>
                                {inventoryStatus.length > 0 ? (
                                    <InventoryAlerts alerts={inventoryStatus} />
                                ) : (
                                    <div className="bg-emerald-50 text-emerald-700 p-6 rounded-xl border border-emerald-200 font-medium flex items-center gap-3">
                                        <span className="text-xl">✅</span> All systems normal. No low stock alerts.
                                    </div>
                                )}
                            </section>

                            {/* Customers */}
                            <section className="admin-dashboard-card p-6">
                                <h3 className="admin-dashboard-section-header mb-6">Customer Insights</h3>
                                {customerInsights && <CustomerInsights data={customerInsights} />}
                            </section>

                            {/* Search Data */}
                            <section className="admin-dashboard-card p-6">
                                <h3 className="admin-dashboard-section-header mb-6">Search Behavior</h3>
                                {searchAnalytics && <SearchAnalytics data={searchAnalytics} />}
                            </section>
                        </div>

                    </div>

                </div>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;