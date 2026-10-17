// frontend/src/api/reports.js
import api from './api'; // Use the centralized axios instance

const API_URL = '/admin/reports'; // Update this to match your backend route

export const fetchOverviewStats = async () => {
  const response = await api.get(`${API_URL}/overview`);
  return response.data;
};

export const fetchSalesAnalytics = async () => {
  const response = await api.get(`${API_URL}/sales`);
  return response.data;
};

export const fetchProductPerformance = async () => {
  const response = await api.get(`${API_URL}/products`);
  return response.data;
};

export const fetchCategoryPerformance = async () => {
  const response = await api.get(`${API_URL}/categories`);
  return response.data;
};

export const fetchCustomerInsights = async () => {
  const response = await api.get(`${API_URL}/customers`);
  return response.data;
};

export const fetchPaymentAnalytics = async () => {
  const response = await api.get(`${API_URL}/payments`);
  return response.data;
};

export const fetchDeliveryAnalytics = async () => {
  const response = await api.get(`${API_URL}/delivery`);
  return response.data;
};