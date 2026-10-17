import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const ReturnList = ({ onEdit }) => {
  const {
    purchaseReturns,
    loading,
    error,
    clearError,
    fetchPurchaseReturns
  } = useInventoryContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      const result = await fetchPurchaseReturns();
      if (result.success) {
        toast.success('Returns loaded successfully');
      }
    } catch (err) {
      toast.error('Failed to load returns');
    }
  };

  const filteredReturns = purchaseReturns.filter(returnItem => {
    const matchesSearch =
      returnItem.return_id?.toString().includes(searchTerm) ||
      returnItem.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || returnItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-badge pending';
      case 'completed': return 'status-badge completed';
      case 'rejected': return 'status-badge rejected';
      default: return 'status-badge';
    }
  };

  if (loading) return <div className="loading">Loading returns...</div>;
  if (error) {
    toast.error(error);
    clearError();
  }

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>Purchase Return List</h2>
        <div className="header-actions">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search returns..."
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
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button className="btn-primary" onClick={loadReturns}>
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
              <th>Purchase ID</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No returns found</td>
              </tr>
            ) : (
              filteredReturns.map(returnItem => (
                <tr key={returnItem.return_id}>
                  <td>{returnItem.return_id}</td>
                  <td>{new Date(returnItem.return_date).toLocaleDateString()}</td>
                  <td>{returnItem.purchase_id}</td>
                  <td>{returnItem.reason || 'No reason provided'}</td>
                  <td>
                    <span className={getStatusBadgeClass(returnItem.status)}>
                      {returnItem.status || 'pending'}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-view">
                      View
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => onEdit && onEdit(returnItem)}
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
        <p>Showing {filteredReturns.length} of {purchaseReturns.length} returns</p>
        <div className="status-summary">
          <span className="status-item pending">Pending: {purchaseReturns.filter(r => r.status === 'pending').length}</span>
          <span className="status-item completed">Completed: {purchaseReturns.filter(r => r.status === 'completed').length}</span>
          <span className="status-item rejected">Rejected: {purchaseReturns.filter(r => r.status === 'rejected').length}</span>
        </div>
      </div>
    </div>
  );
};

export default ReturnList;