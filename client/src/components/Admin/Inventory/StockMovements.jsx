import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const StockMovements = () => {
  const {
    stockMovements,
    loading,
    error,
    clearError,
    fetchStockMovements
  } = useInventoryContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      const result = await fetchStockMovements();
      if (result.success) {
        toast.success('Stock movements loaded');
      }
    } catch (err) {
      toast.error('Failed to load stock movements');
    }
  };

  const filteredMovements = stockMovements.filter(movement => {
    const matchesSearch = 
      movement.variant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.movement_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || movement.movement_type === typeFilter;
    
    let matchesDate = true;
    if (dateRange.start && movement.created_at) {
      matchesDate = matchesDate && new Date(movement.created_at) >= new Date(dateRange.start);
    }
    if (dateRange.end && movement.created_at) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(movement.created_at) <= endDate;
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getMovementTypeClass = (type) => {
    switch(type?.toLowerCase()) {
      case 'purchase': return 'movement-type purchase';
      case 'return': return 'movement-type return';
      case 'adjustment': return 'movement-type adjustment';
      case 'sale': return 'movement-type sale';
      default: return 'movement-type';
    }
  };

  const getQuantityClass = (quantity) => {
    if (quantity > 0) return 'quantity positive';
    if (quantity < 0) return 'quantity negative';
    return 'quantity';
  };

  if (loading) return <div className="loading">Loading stock movements...</div>;
  if (error) {
    toast.error(error);
    clearError();
  }

  return (
    <div className="movements-container">
      <div className="movements-header">
        <h2>Stock Movements</h2>
        <div className="header-actions">
          <button className="btn-primary" onClick={loadMovements}>
            Refresh
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search movements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="return">Return</option>
            <option value="adjustment">Adjustment</option>
            <option value="sale">Sale</option>
          </select>
        </div>
        <div className="filter-group">
          <input
            type="date"
            placeholder="Start Date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="date-input"
          />
          <input
            type="date"
            placeholder="End Date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="date-input"
          />
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Variant</th>
              <th>Quantity Change</th>
              <th>New Stock</th>
              <th>Reason</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No movements found</td>
              </tr>
            ) : (
              filteredMovements.map(movement => (
                <tr key={movement.movement_id}>
                  <td>{new Date(movement.created_at).toLocaleString()}</td>
                  <td>
                    <span className={getMovementTypeClass(movement.movement_type)}>
                      {movement.movement_type}
                    </span>
                  </td>
                  <td>
                    {movement.variant_name || `Variant ${movement.variant_id}`}
                    {movement.variant_id && <small> (ID: {movement.variant_id})</small>}
                  </td>
                  <td className={getQuantityClass(movement.quantity_change)}>
                    {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                  </td>
                  <td>{movement.new_stock_level}</td>
                  <td>{movement.reason || '-'}</td>
                  <td>
                    {movement.reference_type && movement.reference_id ? 
                      `${movement.reference_type}: ${movement.reference_id}` : 
                      '-'
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="movements-footer">
        <p>Showing {filteredMovements.length} of {stockMovements.length} movements</p>
        <div className="movement-summary">
          <span className="summary-item">Purchases: {stockMovements.filter(m => m.movement_type === 'purchase').length}</span>
          <span className="summary-item">Returns: {stockMovements.filter(m => m.movement_type === 'return').length}</span>
          <span className="summary-item">Adjustments: {stockMovements.filter(m => m.movement_type === 'adjustment').length}</span>
        </div>
      </div>
    </div>
  );
};

export default StockMovements;