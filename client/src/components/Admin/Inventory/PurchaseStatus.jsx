import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const PurchaseStatus = ({ purchase, onSuccess }) => {
  const {
    purchases,
    fetchPurchases,
    fetchPurchaseById,
    updatePurchaseStatus,
    loading,
    error,
    clearError
  } = useInventoryContext();

  const [purchaseId, setPurchaseId] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [status, setStatus] = useState('RECEIVED');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (purchase) {
      setSelectedPurchase(purchase);
      setPurchaseId(purchase.purchase_id);
      setStatus(purchase.status || 'PENDING');
    } else {
      // Helper to load purchases if not provided
      loadPurchases();
    }
  }, [purchase]);

  const loadPurchases = async () => {
    try {
      const result = await fetchPurchases();
      if (result.success) {
        // toast.success('Purchases loaded');
      }
    } catch (err) {
      toast.error('Failed to load purchases');
    }
  };

  const handleFetchPurchase = async () => {
    if (!purchaseId) {
      toast.warning('Please enter a purchase ID');
      return;
    }

    try {
      const result = await fetchPurchaseById(purchaseId);
      if (result.success && result.data) {
        setSelectedPurchase(result.data);
        setStatus(result.data.status || 'pending');
        toast.success('Purchase loaded successfully');
      } else {
        toast.error('Purchase not found');
        setSelectedPurchase(null);
      }
    } catch (err) {
      toast.error('Failed to fetch purchase');
      setSelectedPurchase(null);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedPurchase || !purchaseId) {
      toast.warning('No purchase selected');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updatePurchaseStatus(purchaseId, status);
      if (result.success) {
        toast.success(`Purchase status updated to ${status}`);
        setSelectedPurchase({ ...selectedPurchase, status });
        if (onSuccess) onSuccess();
        // Refresh the list if generic usage
        else await fetchPurchases();
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#f39c12';
      case 'RECEIVED': return '#27ae60';
      case 'CANCELLED': return '#e74c3c';
      case 'RETURNED': return '#8e44ad';
      default: return '#7f8c8d';
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) {
    toast.error(error);
    clearError();
  }

  return (
    <div className="status-container">
      <div className="status-header">
        <h2>Update Purchase Status</h2>
        <button className="btn-primary" onClick={loadPurchases}>
          Refresh List
        </button>
      </div>

      <div className="status-content">
        <div className="search-section">
          <h3>Find Purchase</h3>
          <div className="search-form">
            <input
              type="text"
              placeholder="Enter Purchase ID"
              value={purchaseId}
              onChange={(e) => setPurchaseId(e.target.value)}
              className="search-input"
            />
            <button
              className="btn-search"
              onClick={handleFetchPurchase}
              disabled={!purchaseId}
            >
              Search Purchase
            </button>
          </div>

          <div className="purchase-list">
            <h4>Recent Purchases</h4>
            <div className="purchase-items">
              {purchases.slice(0, 5).map(purchase => (
                <div
                  key={purchase.purchase_id}
                  className={`purchase-item ${selectedPurchase?.purchase_id === purchase.purchase_id ? 'selected' : ''}`}
                  onClick={() => {
                    setPurchaseId(purchase.purchase_id);
                    setSelectedPurchase(purchase);
                    setStatus(purchase.status || 'pending');
                  }}
                >
                  <div className="purchase-info">
                    <strong>Purchase #{purchase.purchase_id}</strong>
                    <span>Supplier: {purchase.supplier_name || 'N/A'}</span>
                  </div>
                  <span
                    className="current-status"
                    style={{ backgroundColor: getStatusColor(purchase.status) }}
                  >
                    {purchase.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedPurchase && (
          <div className="update-section">
            <h3>Update Status</h3>
            <div className="purchase-details">
              <div className="detail-row">
                <span className="detail-label">Purchase ID:</span>
                <span className="detail-value">{selectedPurchase.purchase_id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Supplier:</span>
                <span className="detail-value">{selectedPurchase.supplier_name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">${selectedPurchase.total_amount || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Current Status:</span>
                <span
                  className="current-status-badge"
                  style={{ backgroundColor: getStatusColor(selectedPurchase.status) }}
                >
                  {selectedPurchase.status || 'pending'}
                </span>
              </div>
            </div>

            <div className="status-form">
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="status-select"
                  disabled={isUpdating}
                >
                  <option value="PENDING">Pending</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <button
                className="btn-update"
                onClick={handleStatusUpdate}
                disabled={isUpdating || status === selectedPurchase.status}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseStatus;