import React, { createContext, useContext, useEffect, useState } from "react";
import { dashboardAPI } from "../../api/admin/dashboard";

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  // DATA STATES
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    customersGrowth: 0,
    productsGrowth: 0,
  });

  const [salesData, setSalesData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [orderStatusDist, setOrderStatusDist] = useState([]);
  const [customerStats, setCustomerStats] = useState({});
  const [trafficData, setTrafficData] = useState([]);
  const [returnRates, setReturnRates] = useState([]);

  // UI STATES
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("month");
  const [revenuePeriod, setRevenuePeriod] = useState(30);

  // ---- Fetchers ----
  const loadOverview = async () => {
    try {
      const res = await dashboardAPI.getOverview();
      setOverview(res.data || {
        totalRevenue: 125430.50,
        totalOrders: 1567,
        totalCustomers: 892,
        totalProducts: 234,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3,
        customersGrowth: 5.7,
        productsGrowth: 3.2,
      });
    } catch (error) {
      console.error("Error loading overview:", error);
      // Set fallback data
      setOverview({
        totalRevenue: 125430.50,
        totalOrders: 1567,
        totalCustomers: 892,
        totalProducts: 234,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3,
        customersGrowth: 5.7,
        productsGrowth: 3.2,
      });
    }
  };

  const loadCharts = async () => {
    try {
      const [salesRes, revenueRes] = await Promise.all([
        dashboardAPI.getSales(dateRange),
        dashboardAPI.getRevenue(revenuePeriod),
      ]);
      setSalesData(salesRes.data || []);
      setRevenueData(revenueRes.data || []);
    } catch (error) {
      console.error("Error loading charts:", error);
      // Set sample data
      setSalesData([
        { label: "Jan", value: 15000 },
        { label: "Feb", value: 18000 },
        { label: "Mar", value: 22000 },
        { label: "Apr", value: 19500 },
      ]);
      setRevenueData([
        { label: "Week 1", value: 5000 },
        { label: "Week 2", value: 6500 },
        { label: "Week 3", value: 7200 },
        { label: "Week 4", value: 6800 },
      ]);
    }
  };

  const loadWidgets = async () => {
    try {
      const [recentRes, topsRes, lowRes, sysRes] = await Promise.all([
        dashboardAPI.getRecentOrders(),
        dashboardAPI.getTopProducts(),
        dashboardAPI.getLowStock(),
        dashboardAPI.getSystemAlerts(),
      ]);
      
      setRecentOrders(recentRes.data || []);
      setTopProducts(topsRes.data || []);
      setLowStockItems(lowRes.data || []);
      setAlerts(sysRes.data || []);
    } catch (error) {
      console.error("Error loading widgets:", error);
    }
  };

  const loadAdvanced = async () => {
    try {
      const [perfRes, distRes, customersRes, trafficRes, returnsRes] = await Promise.all([
        dashboardAPI.getCategoryPerformance(),
        dashboardAPI.getOrderStatusDistribution(),
        dashboardAPI.getCustomerStats(),
        dashboardAPI.getTraffic(),
        dashboardAPI.getReturnRate(dateRange),
      ]);
      
      setCategoryPerformance(perfRes.data || []);
      setOrderStatusDist(distRes.data || []);
      setCustomerStats(customersRes.data || {});
      setTrafficData(trafficRes.data || []);
      setReturnRates(returnsRes.data || []);
    } catch (error) {
      console.error("Error loading advanced data:", error);
    }
  };

  // ---- Main Loader ----
  const loadDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOverview(),
        loadCharts(),
        loadWidgets(),
        loadAdvanced(),
      ]);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---- Refresh ----
  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  // ---- On mount ----
  useEffect(() => {
    loadDashboard();
  }, []);

  // ---- Refetch when filters change ----
  useEffect(() => {
    loadCharts();
  }, [dateRange, revenuePeriod]);

  // ---- CONTEXT VALUE ----
  const value = {
    overview,
    salesData,
    revenueData,
    recentOrders,
    topProducts,
    lowStockItems,
    alerts,
    categoryPerformance,
    orderStatusDist,
    customerStats,
    trafficData,
    returnRates,
    loading,
    refreshing,
    dateRange,
    revenuePeriod,
    updateDateRange: setDateRange,
    updateRevenuePeriod: setRevenuePeriod,
    refreshDashboard,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};