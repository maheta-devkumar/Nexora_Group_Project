import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const BatchForm = ({ initialData, onSuccess }) => {
  const {
    currentBatch,
    fetchBatchById,
    createBatch,
    updateBatch,
    clearError
  } = useInventoryContext();

  const [formData, setFormData] = useState({
    variant_id: '',
    batch_number: '',
    manufacturing_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    quantity: '',
    notes: ''
  });
  const [batchId, setBatchId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle Initial Data
  useEffect(() => {
    if (initialData) {
      setFormData({
        variant_id: initialData.variant_id || '',
        batch_number: initialData.batch_number || '',
        manufacturing_date: initialData.manufacturing_date ? new Date(initialData.manufacturing_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expiry_date: initialData.expiry_date ? new Date(initialData.expiry_date).toISOString().split('T')[0] : '',
        quantity: initialData.quantity || '',
        notes: initialData.notes || ''
      });
      setBatchId(initialData.batch_id);
      setIsEditing(true);
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && batchId) {
        const result = await updateBatch(batchId, formData);
        if (result.success) {
          toast.success('Batch updated successfully!');
          if (onSuccess) onSuccess();
          resetForm();
        }
      } else {
        const result = await createBatch(formData);
        if (result.success) {
          toast.success('Batch created successfully!');
          if (onSuccess) onSuccess();
          resetForm();
        }
      }
    } catch (err) {
      toast.error('Failed to save batch');
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = async () => {
    if (!batchId) {
      toast.warning('Please enter a batch ID');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchBatchById(batchId);
      if (result.success && result.data) {
        setFormData({
          variant_id: result.data.variant_id || '',
          batch_number: result.data.batch_number || '',
          manufacturing_date: result.data.manufacturing_date ? new Date(result.data.manufacturing_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          expiry_date: result.data.expiry_date ? new Date(result.data.expiry_date).toISOString().split('T')[0] : '',
          quantity: result.data.quantity || '',
          notes: result.data.notes || ''
        });
        setIsEditing(true);
        toast.success('Batch loaded for editing');
      } else {
        toast.error('Batch not found');
      }
    } catch (err) {
      toast.error('Failed to fetch batch');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      variant_id: '',
      batch_number: '',
      manufacturing_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      quantity: '',
      notes: ''
    });
    setBatchId('');
    setIsEditing(false);
  };

  const generateBatchNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const batchNum = `BATCH-${year}${month}${day}-${random}`;

    setFormData(prev => ({ ...prev, batch_number: batchNum }));
    toast.info('Generated batch number');
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{isEditing ? 'Edit Batch' : 'Create New Batch'}</h2>
        {isEditing && (
          <button className="btn-cancel" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </div>

      <div className="form-section">
        <div className="fetch-section">
          <h3>Load Existing Batch (Optional)</h3>
          <div className="fetch-form">
            <input
              type="text"
              placeholder="Enter Batch ID"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="fetch-input"
            />
            <button
              type="button"
              className="btn-fetch"
              onClick={handleFetch}
              disabled={loading}
            >
              Load Batch
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Variant ID *</label>
            <input
              type="number"
              name="variant_id"
              value={formData.variant_id}
              onChange={handleInputChange}
              className="form-input"
              required
              disabled={loading}
              placeholder="Enter variant ID"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Batch Number *</label>
            <div className="batch-number-input">
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleInputChange}
                className="form-input"
                required
                disabled={loading}
                placeholder="e.g., BATCH-20240101-001"
              />
              <button
                type="button"
                className="btn-generate"
                onClick={generateBatchNumber}
                disabled={loading || isEditing}
              >
                Generate
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Manufacturing Date</label>
            <input
              type="date"
              name="manufacturing_date"
              value={formData.manufacturing_date}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expiry Date (Optional)</label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="form-input"
              required
              min="1"
              disabled={loading}
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

          {formData.expiry_date && (
            <div className="expiry-warning">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">
                This batch will expire on {new Date(formData.expiry_date).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Batch' : 'Create Batch')}
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

export default BatchForm;