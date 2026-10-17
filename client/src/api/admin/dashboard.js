import api from "../api";

const BASE = "/api/v1/admin/dashboard";

export const dashboardAPI = {
  getOverview: () => api.get(`${BASE}/overview`),

  // Charts
  getSales: (period = "month") =>
    api.get(`${BASE}/sales`, { params: { period } }),

  getRevenue: (days = 30) =>
    api.get(`${BASE}/revenue`, { params: { days } }),

  // Lists / widgets
  getRecentOrders: (limit = 10) =>
    api.get(`${BASE}/recent-orders`, { params: { limit } }),

  getTopProducts: (limit = 10) =>
    api.get(`${BASE}/top-products`, { params: { limit } }),

  getLowStock: (threshold = 10) =>
    api.get(`${BASE}/low-stock`, { params: { threshold } }),

  getSystemAlerts: (limit = 20) =>
    api.get(`${BASE}/system-alerts`, { params: { limit } }),

  // Advanced analytics
  getCategoryPerformance: () =>
    api.get(`${BASE}/category-performance`),

  getOrderStatusDistribution: () =>
    api.get(`${BASE}/order-status`),

  getCustomerStats: () =>
    api.get(`${BASE}/customers`),

  getStockAlerts: () =>
    api.get(`${BASE}/stock-alerts`),

  getTraffic: () =>
    api.get(`${BASE}/traffic`),

  getReturnRate: (period = "month") =>
    api.get(`${BASE}/returns`, { params: { period } }),
};