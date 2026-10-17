import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const ReturnForm = ({ initialData, onSuccess }) => {
  const {
    purchases,
    currentPurchaseReturn,
    fetchPurchaseReturnById,
    createPurchaseReturn,
    updatePurchaseReturnStatus,
    fetchPurchases,
    clearError
  } = useInventoryContext();

  const [formData, setFormData] = useState({
    purchase_id: '',
    return_date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
    items: '[{"purchase_item_id": 1, "quantity_returned": 2, "reason": "Damaged"}]',
    status: 'pending'
  });
  const [returnId, setReturnId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        purchase_id: initialData.purchase_id || '',
        return_date: initialData.return_date ? new Date(initialData.return_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        reason: initialData.reason || '',
        notes: initialData.notes || '',
        items: typeof initialData.items === 'string' ? initialData.items : JSON.stringify(initialData.items || []),
        status: initialData.status || 'pending'
      });
      setReturnId(initialData.return_id);
      setIsEditing(true);
    }
  }, [initialData]);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      await fetchPurchases();
    } catch (err) {
      toast.error('Failed to load purchases');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && returnId) {
        // For editing, we update status only based on the available context method
        const result = await updatePurchaseReturnStatus(returnId, formData.status);
        if (result.success) {
          toast.success('Return status updated successfully!');
          if (onSuccess) onSuccess();
          resetForm();
        }
      } else {
        const result = await createPurchaseReturn(formData);
        if (result.success) {
          toast.success('Return created successfully!');
          if (onSuccess) onSuccess();
          resetForm();
        }
      }
    } catch (err) {
      toast.error('Failed to save return');
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = async () => {
    if (!returnId) {
      toast.warning('Please enter a return ID');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchPurchaseReturnById(returnId);
      if (result.success && result.data) {
        setFormData({
          purchase_id: result.data.purchase_id || '',
          return_date: result.data.return_date || new Date().toISOString().split('T')[0],
          reason: result.data.reason || '',
          notes: result.data.notes || '',
          items: JSON.stringify(result.data.items || []),
          status: result.data.status || 'pending'
        });
        setIsEditing(true);
        toast.success('Return loaded for editing');
      } else {
        toast.error('Return not found');
      }
    } catch (err) {
      toast.error('Failed to fetch return');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      purchase_id: '',
      return_date: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
      items: '[{"purchase_item_id": 1, "quantity_returned": 2, "reason": "Damaged"}]',
      status: 'pending'
    });
    setReturnId('');
    setIsEditing(false);
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{isEditing ? 'Edit Purchase Return' : 'Create New Return'}</h2>
        {isEditing && (
          <button className="btn-cancel" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </div>

      <div className="form-section">
        <div className="fetch-section">
          <h3>Load Existing Return (Optional)</h3>
          <div className="fetch-form">
            <input
              type="text"
              placeholder="Enter Return ID"
              value={returnId}
              onChange={(e) => setReturnId(e.target.value)}
              className="fetch-input"
            />
            <button
              type="button"
              className="btn-fetch"
              onClick={handleFetch}
              disabled={loading}
            >
              Load Return
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Purchase ID *</label>
            <select
              name="purchase_id"
              value={formData.purchase_id}
              onChange={handleInputChange}
              className="form-select"
              required
              disabled={loading || isEditing}
            >
              <option value="">Select Purchase</option>
              {purchases.map(purchase => (
                <option key={purchase.purchase_id} value={purchase.purchase_id}>
                  Purchase #{purchase.purchase_id} - ${purchase.total_amount || 0}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Return Date</label>
            <input
              type="date"
              name="return_date"
              value={formData.return_date}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason *</label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="form-input"
              required
              disabled={loading}
              placeholder="e.g., Damaged goods, Wrong item, etc."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Items (JSON)</label>
            <textarea
              name="items"
              value={formData.items}
              onChange={handleInputChange}
              className="form-textarea"
              rows="4"
              disabled={loading}
              placeholder='[{"purchase_item_id": 1, "quantity_returned": 2, "reason": "Damaged"}]'
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="form-textarea"
              rows="3"
              disabled={loading}
            />
          </div>

          {isEditing && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-select"
                disabled={loading}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Return' : 'Create Return')}
            </button>
            <button
              type="button"
              className="btn-reset"
              onClick={resetForm}
              disabled={loading}
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnForm;