import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const SupplierForm = ({ initialData, onSuccess }) => {
  const {
    currentSupplier,
    fetchSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    clearError,
    fetchCompanies,    // Need to fetch companies for dropdown
    fetchAreas         // Need to fetch areas for dropdown
  } = useInventoryContext();

  const [formData, setFormData] = useState({
    name: '',              // Changed from supplier_name
    email: '',             // Changed from contact_email
    phone: '',
    address_line: '',      // Changed from address
    company_id: '',        // Added
    area_id: '',           // Added
    gst_number: ''         // Added
  });

  const [supplierId, setSupplierId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [areas, setAreas] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);

  // Handle Initial Data for Editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || initialData.supplier_name || '',
        email: initialData.email || initialData.contact_email || '',
        phone: initialData.phone || initialData.contact_phone || '',
        address_line: initialData.address_line || initialData.address || '',
        company_id: initialData.company_id || '',
        area_id: initialData.area_id || '',
        gst_number: initialData.gst_number || ''
      });
      setSupplierId(initialData.supplier_id);
      setIsEditing(true);
    }
  }, [initialData]);

  // Fetch companies and areas on component mount
  useEffect(() => {
    const loadDropdownData = async () => {
      setFetchingData(true);
      try {
        // Fetch companies
        if (fetchCompanies) {
          const companiesResult = await fetchCompanies();
          if (companiesResult.success) {
            setCompanies(companiesResult.data || []);
          }
        }

        // Fetch areas
        if (fetchAreas) {
          const areasResult = await fetchAreas();
          if (areasResult.success) {
            setAreas(areasResult.data || []);
          }
        }
      } catch (err) {
        console.error('Error loading dropdown data:', err);
        toast.error('Failed to load dropdown data');
      } finally {
        setFetchingData(false);
      }
    };

    loadDropdownData();
  }, [fetchCompanies, fetchAreas]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    if (!formData.area_id) {
      toast.error('Area is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        company_id: formData.company_id ? parseInt(formData.company_id, 10) : null,
        area_id: formData.area_id ? parseInt(formData.area_id, 10) : null
      };

      if (isEditing && supplierId) {
        const result = await updateSupplier(supplierId, payload);
        if (result.success) {
          toast.success('Supplier updated successfully!');
          if (onSuccess) onSuccess();
          resetForm();
        } else {
          toast.error(result.message || 'Failed to update supplier');
        }
      } else {
        const result = await createSupplier(payload);
        if (result.success) {
          toast.success('Supplier created successfully!');
          if (onSuccess) onSuccess();
          resetForm();
        } else {
          toast.error(result.message || 'Failed to create supplier');
        }
      }
    } catch (err) {
      toast.error('Failed to save supplier');
      console.error('Save supplier error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplierId || !isEditing) {
      toast.warning('No supplier selected for deletion');
      return;
    }

    if (window.confirm('Are you sure you want to delete this supplier?')) {
      setLoading(true);
      try {
        const result = await deleteSupplier(supplierId);
        if (result.success) {
          toast.success('Supplier deleted successfully!');
          if (onSuccess) onSuccess();
          resetForm();
        } else {
          toast.error(result.message || 'Failed to delete supplier');
        }
      } catch (err) {
        toast.error('Failed to delete supplier');
        console.error('Delete supplier error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFetch = async () => {
    if (!supplierId) {
      toast.warning('Please enter a supplier ID');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchSupplierById(supplierId);
      if (result.success && result.data) {
        // Map backend response to form fields
        setFormData({
          name: result.data.name || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          address_line: result.data.address_line || '',
          company_id: result.data.company_id || '',
          area_id: result.data.area_id || '',
          gst_number: result.data.gst_number || ''
        });
        setIsEditing(true);
        toast.success('Supplier loaded for editing');
      } else {
        toast.error(result.message || 'Supplier not found');
      }
    } catch (err) {
      toast.error('Failed to fetch supplier');
      console.error('Fetch supplier error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address_line: '',
      company_id: '',
      area_id: '',
      gst_number: ''
    });
    setSupplierId('');
    setIsEditing(false);
    clearError?.();
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{isEditing ? 'Edit Supplier' : 'Create New Supplier'}</h2>
        <div className="header-actions">
          {isEditing && (
            <>
              <button
                className="btn-delete"
                onClick={handleDelete}
                disabled={loading || fetchingData}
              >
                Delete Supplier
              </button>
              <button
                className="btn-cancel"
                onClick={resetForm}
                disabled={loading || fetchingData}
              >
                Cancel Edit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="form-section">
        <div className="fetch-section">
          <h3>Load Existing Supplier (Optional)</h3>
          <div className="fetch-form">
            <input
              type="text"
              placeholder="Enter Supplier ID"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="fetch-input"
              disabled={loading || fetchingData}
            />
            <button
              type="button"
              className="btn-fetch"
              onClick={handleFetch}
              disabled={loading || fetchingData}
            >
              {loading ? 'Loading...' : 'Load Supplier'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-group">
            <label className="form-label required">Supplier Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              required
              disabled={loading || fetchingData}
              placeholder="Enter supplier name"
            />
          </div>

          {/* Company Selection (Optional) */}
          <div className="form-group">
            <label className="form-label">Company</label>
            <select
              name="company_id"
              value={formData.company_id}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading || fetchingData}
            >
              <option value="">Select Company (Optional)</option>
              {companies.map(company => (
                <option key={company.company_id} value={company.company_id}>
                  {company.name}
                </option>
              ))}
            </select>
            {fetchingData && <small>Loading companies...</small>}
          </div>

          {/* Area Selection (Required) */}
          <div className="form-group">
            <label className="form-label required">Area *</label>
            <select
              name="area_id"
              value={formData.area_id}
              onChange={handleInputChange}
              className="form-input"
              required
              disabled={loading || fetchingData}
            >
              <option value="">Select Area</option>
              {areas.map(area => (
                <option key={area.area_id} value={area.area_id}>
                  {area.name} {area.city ? `, ${area.city}` : ''}
                </option>
              ))}
            </select>
            {fetchingData && <small>Loading areas...</small>}
          </div>

          {/* Contact Information */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading || fetchingData}
                placeholder="Enter email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading || fetchingData}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading || fetchingData}
                placeholder="Enter GST number"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              name="address_line"
              value={formData.address_line}
              onChange={handleInputChange}
              className="form-textarea"
              rows="3"
              disabled={loading || fetchingData}
              placeholder="Enter full address"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || fetchingData || !formData.name || !formData.area_id}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Supplier' : 'Create Supplier')}
            </button>
            <button
              type="button"
              className="btn-reset"
              onClick={resetForm}
              disabled={loading || fetchingData}
            >
              Reset Form
            </button>
          </div>

          <div className="form-note">
            <p><span className="required">*</span> Required fields</p>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 15px;
        }
        .form-header h2 {
          margin: 0;
          color: #333;
        }
        .header-actions {
          display: flex;
          gap: 10px;
        }
        .btn-delete {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .btn-delete:hover:not(:disabled) {
          background: #c82333;
        }
        .btn-cancel {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .btn-cancel:hover:not(:disabled) {
          background: #5a6268;
        }
        .btn-delete:disabled,
        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .fetch-section {
          margin-bottom: 25px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        .fetch-section h3 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 16px;
          color: #555;
        }
        .fetch-form {
          display: flex;
          gap: 10px;
        }
        .fetch-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .btn-fetch {
          background: #17a2b8;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .btn-fetch:hover:not(:disabled) {
          background: #138496;
        }
        .btn-fetch:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #555;
        }
        .form-label.required:after {
          content: ' *';
          color: #dc3545;
        }
        .form-input, .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border 0.3s;
        }
        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
        }
        .form-input:disabled, .form-textarea:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
        }
        .form-row {
          display: flex;
          gap: 15px;
        }
        .form-row .form-group {
          flex: 1;
        }
        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        .btn-submit {
          flex: 1;
          background: #28a745;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .btn-submit:hover:not(:disabled) {
          background: #218838;
        }
        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-reset {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.3s;
        }
        .btn-reset:hover:not(:disabled) {
          background: #5a6268;
        }
        .btn-reset:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .form-note {
          margin-top: 10px;
          text-align: right;
          color: #666;
          font-size: 12px;
        }
        small {
          display: block;
          margin-top: 5px;
          color: #666;
          font-style: italic;
        }
        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 20px;
          }
          .fetch-form {
            flex-direction: column;
          }
          .header-actions {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default SupplierForm;