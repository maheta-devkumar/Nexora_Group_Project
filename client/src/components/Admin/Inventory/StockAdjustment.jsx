import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const StockAdjustment = () => {
  const {
    stockSummary,
    variantMovements,
    loading,
    error,
    clearError,
    adjustStock,
    fetchVariantMovements,
    fetchStockSummary
  } = useInventoryContext();

  const [formData, setFormData] = useState({
    variant_id: '',
    adjustment_quantity: '',
    adjustment_type: 'add',
    reason: '',
    notes: ''
  });
  const [variantId, setVariantId] = useState('');
  const [showMovements, setShowMovements] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    loadStockSummary();
  }, []);

  const loadStockSummary = async () => {
    try {
      await fetchStockSummary();
    } catch (err) {
      toast.error('Failed to load stock summary');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.variant_id) {
      toast.warning('Please enter a variant ID');
      return;
    }
    
    if (!formData.adjustment_quantity || Number(formData.adjustment_quantity) <= 0) {
      toast.warning('Please enter a valid quantity');
      return;
    }
    
    if (!formData.reason) {
      toast.warning('Please enter a reason for adjustment');
      return;
    }

    setIsAdjusting(true);
    try {
      const userId = 1; // In real app, get from auth context
      const result = await adjustStock(formData, userId);
      if (result.success) {
        toast.success('Stock adjusted successfully!');
        resetForm();
        // Reload stock summary
        await fetchStockSummary();
      }
    } catch (err) {
      toast.error('Failed to adjust stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleViewMovements = async () => {
    if (!variantId) {
      toast.warning('Please enter a variant ID');
      return;
    }
    
    try {
      await fetchVariantMovements(variantId);
      setShowMovements(true);
      toast.success(`Loaded movements for variant ${variantId}`);
    } catch (err) {
      toast.error('Failed to load variant movements');
    }
  };

  const handleSelectVariant = (variant) => {
    setFormData(prev => ({ ...prev, variant_id: variant.variant_id }));
    setVariantId(variant.variant_id);
  };

  const resetForm = () => {
    setFormData({
      variant_id: '',
      adjustment_quantity: '',
      adjustment_type: 'add',
      reason: '',
      notes: ''
    });
    setVariantId('');
    setShowMovements(false);
  };

  const getCurrentStock = () => {
    if (!formData.variant_id) return null;
    const variant = stockSummary.find(item => item.variant_id == formData.variant_id);
    return variant?.current_stock || 0;
  };

  const calculateNewStock = () => {
    const current = getCurrentStock();
    if (current === null) return null;
    
    const quantity = Number(formData.adjustment_quantity) || 0;
    switch(formData.adjustment_type) {
      case 'add': return current + quantity;
      case 'remove': return current - quantity;
      case 'set': return quantity;
      default: return current;
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) {
    toast.error(error);
    clearError();
  }

  return (
    <div className="adjustment-container">
      <div className="adjustment-header">
        <h2>Stock Adjustment</h2>
        <button className="btn-primary" onClick={loadStockSummary}>
          Refresh Stock
        </button>
      </div>

      <div className="adjustment-content">
        <div className="adjustment-form-section">
          <div className="form-section">
            <h3>Adjust Stock</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Variant ID *</label>
                <div className="variant-select">
                  <input
                    type="number"
                    name="variant_id"
                    value={formData.variant_id}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Enter variant ID"
                    disabled={isAdjusting}
                  />
                  <button 
                    type="button" 
                    className="btn-find"
                    onClick={() => {
                      if (formData.variant_id) {
                        handleSelectVariant({ variant_id: formData.variant_id });
                      }
                    }}
                    disabled={isAdjusting}
                  >
                    Find
                  </button>
                </div>
                {formData.variant_id && (
                  <div className="variant-info">
                    <span className="info-label">Current Stock:</span>
                    <span className="info-value">{getCurrentStock()}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Adjustment Type</label>
                <select
                  name="adjustment_type"
                  value={formData.adjustment_type}
                  onChange={handleInputChange}
                  className="form-select"
                  disabled={isAdjusting}
                >
                  <option value="add">Add Stock (+)</option>
                  <option value="remove">Remove Stock (-)</option>
                  <option value="set">Set Stock (=)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  name="adjustment_quantity"
                  value={formData.adjustment_quantity}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  min="1"
                  disabled={isAdjusting}
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
                  placeholder="e.g., Damaged, Found, Count error, etc."
                  disabled={isAdjusting}
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
                  disabled={isAdjusting}
                />
              </div>

              {formData.variant_id && formData.adjustment_quantity && (
                <div className="preview-section">
                  <h4>Preview:</h4>
                  <div className="preview-details">
                    <span className="preview-item">Current: {getCurrentStock()}</span>
                    <span className="preview-item">
                      Adjustment: {formData.adjustment_type === 'add' ? '+' : formData.adjustment_type === 'remove' ? '-' : '='}{formData.adjustment_quantity}
                    </span>
                    <span className="preview-item result">
                      New Stock: {calculateNewStock()}
                    </span>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={isAdjusting}
                >
                  {isAdjusting ? 'Adjusting...' : 'Adjust Stock'}
                </button>
                <button 
                  type="button" 
                  className="btn-reset"
                  onClick={resetForm}
                  disabled={isAdjusting}
                >
                  Reset Form
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="variant-section">
          <div className="search-section">
            <h3>View Variant Movements</h3>
            <div className="search-form">
              <input
                type="text"
                placeholder="Enter Variant ID"
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                className="search-input"
              />
              <button 
                className="btn-search"
                onClick={handleViewMovements}
                disabled={!variantId}
              >
                View Movements
              </button>
            </div>
          </div>

          {showMovements && variantMovements.length > 0 && (
            <div className="movements-section">
              <h3>Recent Movements for Variant {variantId}</h3>
              <div className="movements-list">
                {variantMovements.slice(0, 10).map(movement => (
                  <div key={movement.movement_id} className="movement-item">
                    <div className="movement-date">
                      {new Date(movement.created_at).toLocaleDateString()}
                    </div>
                    <div className="movement-details">
                      <span className={`movement-type ${movement.movement_type}`}>
                        {movement.movement_type}
                      </span>
                      <span className={`movement-quantity ${movement.quantity_change > 0 ? 'positive' : 'negative'}`}>
                        {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                      </span>
                    </div>
                    <div className="movement-reason">
                      {movement.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="quick-variants">
            <h3>Quick Select</h3>
            <div className="variant-items">
              {stockSummary.slice(0, 5).map(item => (
                <div 
                  key={item.variant_id} 
                  className={`variant-item ${formData.variant_id == item.variant_id ? 'selected' : ''}`}
                  onClick={() => handleSelectVariant(item)}
                >
                  <div className="variant-name">
                    {item.variant_name || `Variant ${item.variant_id}`}
                  </div>
                  <div className="variant-stock">
                    Stock: {item.current_stock}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustment;