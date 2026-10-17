// frontend/src/context/ReportsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  fetchOverviewStats,
  fetchSalesAnalytics,
  fetchProductPerformance,
  fetchCategoryPerformance,
  fetchCustomerInsights,
  fetchPaymentAnalytics,
  fetchDeliveryAnalytics
} from '../api/reports';

const ReportsContext = createContext();

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};

export const ReportsProvider = ({ children }) => {
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [delivery, setDelivery] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAllReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const [
        overviewData,
        salesData,
        productsData,
        categoriesData,
        customersData,
        paymentsData,
        deliveryData
      ] = await Promise.all([
        fetchOverviewStats(),
        fetchSalesAnalytics(),
        fetchProductPerformance(),
        fetchCategoryPerformance(),
        fetchCustomerInsights(),
        fetchPaymentAnalytics(),
        fetchDeliveryAnalytics()
      ]);

      // Set state directly since API returns data directly (not wrapped)
      setOverview(overviewData);
      setSales(Array.isArray(salesData) ? salesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setDelivery(Array.isArray(deliveryData) ? deliveryData : []);

    } catch (err) {
      // Extract error message from axios response
      let errorMessage = "Failed to load report data";
      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.detail || 
                      err.response.data?.message || 
                      `Server error: ${err.response.status}`;
      } else if (err.request) {
        // Request made but no response
        errorMessage = "No response from server. Please check your connection.";
      } else {
        // Something else happened
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load reports on mount
  useEffect(() => {
    loadAllReports();
  }, []);

  const refreshReports = () => {
    loadAllReports();
  };

  const value = {
    // Data states
    overview,
    sales,
    products,
    categories,
    customers,
    payments,
    delivery,
    
    // Loading states
    loading,
    error,
    
    // Actions
    refreshReports,
    
    // Helper functions
    hasData: () => {
      return !loading && !error && (
        overview !== null || 
        sales.length > 0 || 
        products.length > 0 || 
        categories.length > 0 || 
        customers.length > 0 || 
        payments.length > 0 || 
        delivery.length > 0
      );
    }
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
};