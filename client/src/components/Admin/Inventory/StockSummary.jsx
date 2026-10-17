import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const StockSummary = () => {
  const {
    stockSummary,
    loading,
    error,
    clearError,
    fetchStockSummary
  } = useInventoryContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    try {
      const result = await fetchStockSummary();
      if (result.success) {
        toast.success('Stock summary loaded');
      }
    } catch (err) {
      toast.error('Failed to load stock summary');
    }
  };

  const filteredStock = stockSummary.filter(item => {
    const matchesSearch =
      item.variant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.variant_id?.toString().includes(searchTerm);

    let matchesFilter = true;
    if (stockFilter === 'low') {
      matchesFilter = item.current_stock < 10;
    } else if (stockFilter === 'out') {
      matchesFilter = item.current_stock <= 0;
    } else if (stockFilter === 'healthy') {
      matchesFilter = item.current_stock >= 10;
    }

    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (stock) => {
    if (stock <= 0) return { class: 'out-of-stock', label: 'Out of Stock' };
    if (stock < 10) return { class: 'low-stock', label: 'Low Stock' };
    return { class: 'in-stock', label: 'In Stock' };
  };

  const stats = {
    total: stockSummary.length,
    lowStock: stockSummary.filter(item => item.current_stock < 10 && item.current_stock > 0).length,
    outOfStock: stockSummary.filter(item => item.current_stock <= 0).length,
    healthy: stockSummary.filter(item => item.current_stock >= 10).length
  };

  if (loading) return <div className="loading">Loading stock summary...</div>;
  if (error) {
    toast.error(error);
    clearError();
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--admin-bg-card)] p-4 rounded-xl border border-[var(--admin-border)] shadow-sm">
        <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">Stock Summary</h2>
        <div className="flex flex-1 w-full md:w-auto gap-4 items-center">
          <div className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input"
            />
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="admin-select w-40"
          >
            <option value="all">All Items</option>
            <option value="low">Low Stock (&lt;10)</option>
            <option value="out">Out of Stock</option>
            <option value="healthy">Healthy Stock (&ge;10)</option>
          </select>
          <button className="admin-btn admin-btn-primary" onClick={loadStock}>
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="admin-card flex flex-col items-center justify-center py-6 mb-0">
          <h3 className="text-sm font-semibold text-[var(--admin-text-secondary)] uppercase">Total Items</h3>
          <p className="text-3xl font-bold text-[var(--admin-text-primary)] mt-2">{stats.total}</p>
        </div>
        <div className="admin-card flex flex-col items-center justify-center py-6 mb-0 border-l-4 border-l-[var(--admin-success)]">
          <h3 className="text-sm font-semibold text-[var(--admin-text-secondary)] uppercase">Healthy Stock</h3>
          <p className="text-3xl font-bold text-[var(--admin-success)] mt-2">{stats.healthy}</p>
        </div>
        <div className="admin-card flex flex-col items-center justify-center py-6 mb-0 border-l-4 border-l-[var(--admin-warning)]">
          <h3 className="text-sm font-semibold text-[var(--admin-text-secondary)] uppercase">Low Stock</h3>
          <p className="text-3xl font-bold text-[var(--admin-warning)] mt-2">{stats.lowStock}</p>
        </div>
        <div className="admin-card flex flex-col items-center justify-center py-6 mb-0 border-l-4 border-l-[var(--admin-danger)]">
          <h3 className="text-sm font-semibold text-[var(--admin-text-secondary)] uppercase">Out of Stock</h3>
          <p className="text-3xl font-bold text-[var(--admin-danger)] mt-2">{stats.outOfStock}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Variant ID</th>
              <th>Name</th>
              <th>Current Stock</th>
              <th>Min Stock</th>
              <th>Status</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-[var(--admin-text-muted)]">No stock items found</td>
              </tr>
            ) : (
              filteredStock.map(item => {
                const status = getStockStatus(item.current_stock);
                let badgeClass = 'info';
                if (status.class === 'out-of-stock') badgeClass = 'error'; // Mapped to our theme 'error' class for badges? Need to check. admin-theme uses 'error' or 'danger'? 'error' in my update.
                if (status.class === 'low-stock') badgeClass = 'warning';
                if (status.class === 'in-stock') badgeClass = 'success';

                return (
                  <tr key={item.variant_id}>
                    <td>{item.variant_id}</td>
                    <td className="font-semibold">{item.variant_name || `Variant ${item.variant_id}`}</td>
                    <td className={`font-bold ${status.class === 'out-of-stock' ? 'text-[var(--admin-danger)]' : ''}`}>
                      {item.current_stock}
                    </td>
                    <td>{item.min_stock_level || 0}</td>
                    <td>
                      <span className={`admin-badge ${badgeClass}`}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      {item.last_updated ?
                        new Date(item.last_updated).toLocaleDateString() :
                        'N/A'
                      }
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Alerts */}
      <div className="flex justify-between items-center text-sm text-[var(--admin-text-secondary)]">
        <p>Showing {filteredStock.length} of {stockSummary.length} items</p>
        <div className="flex gap-4">
          {stats.lowStock > 0 && (
            <div className="text-[var(--admin-warning)] font-bold flex items-center gap-2">
              ⚠️ {stats.lowStock} items low
            </div>
          )}
          {stats.outOfStock > 0 && (
            <div className="text-[var(--admin-danger)] font-bold flex items-center gap-2">
              🔴 {stats.outOfStock} items empty
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockSummary;