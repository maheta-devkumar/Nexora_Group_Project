import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const PurchaseForm = ({ initialData, onSuccess }) => {
  const {
    suppliers,
    currentPurchase,
    fetchPurchaseById,
    createPurchase,
    fetchSuppliers,
    clearError
  } = useInventoryContext();

  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    total_amount: '',
    notes: '',
    items: '[{"variant_id": 1, "quantity": 10, "unit_price": 100, "total_price": 1000}]'
  });
  const [purchaseId, setPurchaseId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        supplier_id: initialData.supplier_id || '',
        purchase_date: initialData.purchase_date ? new Date(initialData.purchase_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        total_amount: initialData.total_amount || '',
        notes: initialData.notes || '',
        items: typeof initialData.items === 'string' ? initialData.items : JSON.stringify(initialData.items || [])
      });
      setPurchaseId(initialData.purchase_id);
      setIsEditing(true);
    }
  }, [initialData]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      await fetchSuppliers();
    } catch (err) {
      toast.error('Failed to load suppliers');
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
      if (isEditing && purchaseId) {
        // NOTE: updatePurchase is not available in context, only updatePurchaseStatus.
        // Assuming for now we can't update details, or we treat this as "Copy/Clone" if ID is removed?
        // Or we just show a message.
        toast.info('Updating purchase details is not supported via this form. Use "Update Status" to change status.');
      } else {
        const result = await createPurchase(formData);
        if (result.success) {
          toast.success('Purchase created successfully!');
          if (onSuccess) onSuccess();
          resetForm();
        }
      }
    } catch (err) {
      toast.error('Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = async () => {
    if (!purchaseId) {
      toast.warning('Please enter a purchase ID');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchPurchaseById(purchaseId);
      if (result.success && result.data) {
        setFormData({
          supplier_id: result.data.supplier_id || '',
          purchase_date: result.data.purchase_date || new Date().toISOString().split('T')[0],
          total_amount: result.data.total_amount || '',
          notes: result.data.notes || '',
          items: JSON.stringify(result.data.items || [])
        });
        setIsEditing(true);
        toast.success('Purchase loaded for editing');
      } else {
        toast.error('Purchase not found');
      }
    } catch (err) {
      toast.error('Failed to fetch purchase');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      total_amount: '',
      notes: '',
      items: '[{"variant_id": 1, "quantity": 10, "unit_price": 100, "total_price": 1000}]'
    });
    setPurchaseId('');
    setIsEditing(false);
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{isEditing ? 'Edit Purchase' : 'Create New Purchase'}</h2>
        {isEditing && (
          <button className="btn-cancel" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </div>

      <div className="form-section">
        <div className="fetch-section">
          <h3>Load Existing Purchase (Optional)</h3>
          <div className="fetch-form">
            <input
              type="text"
              placeholder="Enter Purchase ID"
              value={purchaseId}
              onChange={(e) => setPurchaseId(e.target.value)}
              className="fetch-input"
            />
            <button
              type="button"
              className="btn-fetch"
              onClick={handleFetch}
              disabled={loading}
            >
              Load Purchase
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Supplier *</label>
            <select
              name="supplier_id"
              value={formData.supplier_id}
              onChange={handleInputChange}
              className="form-select"
              required
              disabled={loading}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.supplier_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Purchase Date</label>
            <input
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Total Amount</label>
            <input
              type="number"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleInputChange}
              className="form-input"
              step="0.01"
              min="0"
              disabled={loading}
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
              placeholder='[{"variant_id": 1, "quantity": 10, "unit_price": 100, "total_price": 1000}]'
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

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Purchase' : 'Create Purchase')}
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

export default PurchaseForm;