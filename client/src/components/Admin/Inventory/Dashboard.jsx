import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const Dashboard = () => {
  const {
    companies,
    purchases,
    purchaseReturns,
    stockSummary,
    suppliers,
    batches,
    loading,
    error,
    clearError,
    fetchCompanies,
    fetchPurchases,
    fetchPurchaseReturns,
    fetchStockSummary,
    fetchSuppliers,
    fetchBatches
  } = useInventoryContext();

  const [stats, setStats] = useState({
    totalStockItems: 0,
    totalCompanies: 0,
    totalSuppliers: 0,
    activePurchases: 0,
    totalBatches: 0,
    pendingReturns: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      await Promise.all([
        fetchCompanies(),
        fetchPurchases(),
        fetchPurchaseReturns(),
        fetchStockSummary(),
        fetchSuppliers(),
        fetchBatches()
      ]);
      toast.success('Dashboard data loaded');
    } catch (err) {
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    if (stockSummary.length > 0) {
      setStats({
        totalStockItems: stockSummary.length,
        totalCompanies: companies.length,
        totalSuppliers: suppliers.length,
        activePurchases: purchases.filter(p => p.status === 'pending').length,
        totalBatches: batches.length,
        pendingReturns: purchaseReturns.filter(r => r.status === 'pending').length,
        lowStockItems: stockSummary.filter(item => item.current_stock < 10).length
      });
    }
  }, [companies, purchases, purchaseReturns, stockSummary, suppliers, batches]);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) {
    toast.error(error);
    clearError();
  }

  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalStockItems}</div>
            <div className="stat-label">Stock Items</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏭</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalCompanies}</div>
            <div className="stat-label">Companies</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSuppliers}</div>
            <div className="stat-label">Suppliers</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activePurchases}</div>
            <div className="stat-label">Active Purchases</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalBatches}</div>
            <div className="stat-label">Batches</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingReturns}</div>
            <div className="stat-label">Pending Returns</div>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.lowStockItems}</div>
            <div className="stat-label">Low Stock</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Recent Purchases</h3>
          </div>
          <div className="section-content">
            {purchases.slice(0, 5).map(purchase => (
              <div key={purchase.purchase_id} className="list-item">
                <div className="item-info">
                  <div className="item-title">Purchase #{purchase.purchase_id}</div>
                  <div className="item-subtitle">${purchase.total_amount || 0}</div>
                </div>
                <span className={`status-badge ${purchase.status}`}>
                  {purchase.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h3>Low Stock Alert</h3>
          </div>
          <div className="section-content">
            {stockSummary
              .filter(item => item.current_stock < 10)
              .slice(0, 5)
              .map(item => (
                <div key={item.variant_id} className="list-item">
                  <div className="item-info">
                    <div className="item-title">{item.variant_name || `Variant ${item.variant_id}`}</div>
                    <div className="item-subtitle">Stock: {item.current_stock}</div>
                  </div>
                  <span className="status-badge low">Low</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;