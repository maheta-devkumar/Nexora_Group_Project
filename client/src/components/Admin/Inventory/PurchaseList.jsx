import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const PurchaseList = ({ onEdit, onUpdateStatus }) => {
  const {
    purchases,
    loading,
    error,
    clearError,
    fetchPurchases
  } = useInventoryContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const result = await fetchPurchases();
      if (result.success) {
        toast.success('Purchases loaded successfully');
      }
    } catch (err) {
      toast.error('Failed to load purchases');
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch =
      purchase.purchase_id?.toString().includes(searchTerm) ||
      purchase.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-badge pending';
      case 'completed': return 'status-badge completed';
      case 'cancelled': return 'status-badge cancelled';
      default: return 'status-badge';
    }
  };

  if (loading) return <div className="loading">Loading purchases...</div>;
  if (error) {
    toast.error(error);
    clearError();
  }

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>Purchase List</h2>
        <div className="header-actions">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button className="btn-primary" onClick={loadPurchases}>
            Refresh
          </button>
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Supplier</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No purchases found</td>
              </tr>
            ) : (
              filteredPurchases.map(purchase => (
                <tr key={purchase.purchase_id}>
                  <td>{purchase.purchase_id}</td>
                  <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                  <td>{purchase.supplier_name || 'N/A'}</td>
                  <td>${purchase.total_amount || 0}</td>
                  <td>
                    <span className={getStatusBadgeClass(purchase.status)}>
                      {purchase.status || 'pending'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-view"
                      onClick={() => onUpdateStatus && onUpdateStatus(purchase)}
                    >
                      Update
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => onEdit && onEdit(purchase)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="list-footer">
        <p>Showing {filteredPurchases.length} of {purchases.length} purchases</p>
        <div className="status-summary">
          <span className="status-item pending">Pending: {purchases.filter(p => p.status === 'pending').length}</span>
          <span className="status-item completed">Completed: {purchases.filter(p => p.status === 'completed').length}</span>
          <span className="status-item cancelled">Cancelled: {purchases.filter(p => p.status === 'cancelled').length}</span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseList;