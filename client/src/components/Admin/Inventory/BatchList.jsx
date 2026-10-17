import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';
import './BatchList.css';

const BatchList = ({ onEdit }) => {
  const {
    batches,
    loading,
    error,
    clearError,
    fetchBatches
  } = useInventoryContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const result = await fetchBatches();
      if (result.success) {
        // toast.success('Batches loaded successfully');
      }
    } catch (err) {
      toast.error('Failed to load batches');
    }
  };

  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
  };

  const closeViewModal = () => {
    setSelectedBatch(null);
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch =
      batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.variant_id?.toString().includes(searchTerm);

    let matchesFilter = true;
    if (statusFilter === 'expired') {
      matchesFilter = batch.expiry_date && new Date(batch.expiry_date) < new Date();
    } else if (statusFilter === 'expiring') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      matchesFilter = batch.expiry_date &&
        new Date(batch.expiry_date) > new Date() &&
        new Date(batch.expiry_date) <= thirtyDaysFromNow;
    } else if (statusFilter === 'active') {
      matchesFilter = !batch.expiry_date || new Date(batch.expiry_date) > new Date();
    }

    return matchesSearch && matchesFilter;
  });

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { class: 'no-expiry', label: 'No Expiry' };

    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { class: 'expired', label: 'Expired' };
    if (diffDays <= 30) return { class: 'expiring', label: `Expires in ${diffDays} days` };
    return { class: 'active', label: 'Active' };
  };

  if (loading) return <div className="loading">Loading batches...</div>;
  if (error) {
    toast.error(error);
    clearError();
  }

  return (
    <div className="admin-card">
      {/* Batch Details Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeViewModal}>
          <div className="bg-[var(--admin-bg-card)] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-[var(--admin-border)]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[var(--admin-border)] flex justify-between items-center bg-[var(--admin-bg-hover)]">
              <h3 className="font-bold text-lg text-[var(--admin-text-primary)]">Batch Details</h3>
              <button className="text-[var(--admin-text-secondary)] hover:text-[var(--admin-danger)] text-xl leading-none" onClick={closeViewModal}>&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--admin-text-muted)] uppercase font-bold">Batch Number</label>
                  <p className="font-mono bg-[var(--admin-bg-main)] p-2 rounded text-[var(--admin-text-primary)]">{selectedBatch.batch_number}</p>
                </div>
                <div>
                  <label className="text-xs text-[var(--admin-text-muted)] uppercase font-bold">Quantity</label>
                  <p className="font-mono bg-[var(--admin-bg-main)] p-2 rounded text-[var(--admin-text-primary)]">{selectedBatch.quantity}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--admin-text-muted)] uppercase font-bold">Mfg. Date</label>
                  <p className="text-[var(--admin-text-primary)] mt-1">{selectedBatch.manufacturing_date ? new Date(selectedBatch.manufacturing_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-[var(--admin-text-muted)] uppercase font-bold">Exp. Date</label>
                  <p className="text-[var(--admin-text-primary)] mt-1">{selectedBatch.expiry_date ? new Date(selectedBatch.expiry_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--admin-text-muted)] uppercase font-bold">Status</label>
                <div className="mt-1">
                  <span className={`admin-badge ${getExpiryStatus(selectedBatch.expiry_date).class === 'active' ? 'success' : 'error'}`}>
                    {getExpiryStatus(selectedBatch.expiry_date).label}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--admin-border)] flex justify-end">
              <button className="admin-btn admin-btn-secondary" onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">Batch List</h2>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input w-full md:w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select"
          >
            <option value="all">All Batches</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          <button className="admin-btn admin-btn-primary" onClick={loadBatches}>
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Batch Number</th>
              <th>Variant ID</th>
              <th>Manufacturing Date</th>
              <th>Expiry Date</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-[var(--admin-text-muted)]">No batches found</td>
              </tr>
            ) : (
              filteredBatches.map(batch => {
                const expiryStatus = getExpiryStatus(batch.expiry_date);
                // Map local status to global badge classes
                let badgeClass = 'info';
                if (expiryStatus.class === 'expired') badgeClass = 'error';
                if (expiryStatus.class === 'expiring') badgeClass = 'warning';
                if (expiryStatus.class === 'active') badgeClass = 'success';

                return (
                  <tr key={batch.batch_id}>
                    <td>{batch.batch_id}</td>
                    <td className="font-mono text-[var(--admin-primary)] font-semibold">{batch.batch_number}</td>
                    <td>{batch.variant_id}</td>
                    <td>{batch.manufacturing_date ? new Date(batch.manufacturing_date).toLocaleDateString() : '-'}</td>
                    <td>{batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : '-'}</td>
                    <td className="font-bold">{batch.quantity}</td>
                    <td>
                      <span className={`admin-badge ${badgeClass}`}>
                        {expiryStatus.label}
                      </span>
                    </td>
                    <td className="flex gap-2">
                      <button
                        className="admin-btn admin-btn-secondary py-1 px-3 text-xs"
                        onClick={() => onEdit && onEdit(batch)}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-btn admin-btn-secondary py-1 px-3 text-xs"
                        onClick={() => handleViewBatch(batch)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col md:flex-row justify-between items-center text-sm">
        <p className="text-[var(--admin-text-secondary)]">Showing {filteredBatches.length} of {batches.length} batches</p>
        <div className="flex gap-4 mt-2 md:mt-0 font-medium">
          <span className="text-[var(--admin-success)]">Active: {batches.filter(b => getExpiryStatus(b.expiry_date).class === 'active').length}</span>
          <span className="text-[var(--admin-warning)]">Expiring: {batches.filter(b => getExpiryStatus(b.expiry_date).class === 'expiring').length}</span>
          <span className="text-[var(--admin-danger)]">Expired: {batches.filter(b => getExpiryStatus(b.expiry_date).class === 'expired').length}</span>
        </div>
      </div>
    </div>
  );
};

export default BatchList;