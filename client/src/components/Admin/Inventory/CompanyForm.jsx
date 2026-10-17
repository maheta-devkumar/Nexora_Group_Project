import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const CompanyForm = ({ initialData, onSuccess }) => {
  const {
    companies, // Added for validation
    currentCompany,
    fetchCompanyById,
    createCompany,
    updateCompany,
    clearError,
    fetchAreas
  } = useInventoryContext();

  // Initialize form with all backend-required fields
  const [formData, setFormData] = useState({
    name: '',
    gst_number: '',
    address_line: '',
    area_id: '',
    contact_email: '',
    contact_phone: '',
    website: ''
  });

  const [companyId, setCompanyId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [fetchingAreas, setFetchingAreas] = useState(false);
  const [areasError, setAreasError] = useState('');

  // Handle Initial Data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.company_name || initialData.name || '',
        gst_number: initialData.gst_number || '',
        address_line: initialData.address || initialData.address_line || '',
        area_id: initialData.area_id || '',
        contact_email: initialData.contact_email || '',
        contact_phone: initialData.phone || initialData.contact_phone || '',
        website: initialData.website || ''
      });
      setCompanyId(initialData.company_id);
      setIsEditing(true);
    }
  }, [initialData]);

  // Fetch areas from backend on component mount using context function
  useEffect(() => {
    const loadAreas = async () => {
      if (!fetchAreas) {
        setAreasError('fetchAreas function is not available in context');
        return;
      }

      setFetchingAreas(true);
      setAreasError('');

      try {
        const result = await fetchAreas();
        if (result.success) {
          setAreas(result.data || []);
        } else {
          setAreasError(result.message || 'Failed to load areas');
          toast.error(result.message || 'Failed to load areas');
        }
      } catch (error) {
        const errorMsg = 'Error fetching areas: ' + error.message;
        setAreasError(errorMsg);
        console.error('Error fetching areas:', error);
        toast.error('Failed to load areas');
      } finally {
        setFetchingAreas(false);
      }
    };

    loadAreas();
  }, [fetchAreas]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (!formData.area_id) {
      toast.error('Please select an area');
      return;
    }

    // Validation: Case-insensitive duplicate check
    if (!isEditing && companies && companies.length > 0) {
      const duplicate = companies.find(c =>
        c.name?.trim().toLowerCase() === formData.name.trim().toLowerCase() ||
        c.company_name?.trim().toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (duplicate) {
        toast.error('A company with this name already exists.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isEditing && companyId) {
        const result = await updateCompany(companyId, formData);
        if (result.success) {
          toast.success('Company updated successfully!');
          if (onSuccess) onSuccess();
          resetForm();
        } else {
          toast.error(result.message || 'Failed to update company');
        }
      } else {
        const result = await createCompany(formData);
        if (result.success) {
          toast.success('Company created successfully!');
          if (onSuccess) onSuccess();
          resetForm();
        } else {
          toast.error(result.message || 'Failed to create company');
        }
      }
    } catch (err) {
      toast.error('Failed to save company');
      console.error('Save company error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = async () => {
    if (!companyId) {
      toast.warning('Please enter a company ID');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchCompanyById(companyId);
      if (result.success && result.data) {
        // Map backend response to form fields
        setFormData({
          name: result.data.name || '',
          gst_number: result.data.gst_number || '',
          address_line: result.data.address_line || '',
          area_id: result.data.area_id || '',
          contact_email: result.data.contact_email || '',
          contact_phone: result.data.contact_phone || '',
          website: result.data.website || ''
        });
        setIsEditing(true);
        toast.success('Company loaded for editing');
      } else {
        toast.error(result.message || 'Company not found');
      }
    } catch (err) {
      toast.error('Failed to fetch company');
      console.error('Fetch company error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gst_number: '',
      address_line: '',
      area_id: '',
      contact_email: '',
      contact_phone: '',
      website: ''
    });
    setCompanyId('');
    setIsEditing(false);
    clearError?.();
  };

  const handleRefreshAreas = async () => {
    if (!fetchAreas) return;

    setFetchingAreas(true);
    setAreasError('');
    try {
      const result = await fetchAreas();
      if (result.success) {
        setAreas(result.data || []);
        toast.success('Areas refreshed successfully');
      } else {
        setAreasError(result.message || 'Failed to refresh areas');
        toast.error(result.message || 'Failed to refresh areas');
      }
    } catch (error) {
      setAreasError('Error refreshing areas');
      toast.error('Failed to refresh areas');
    } finally {
      setFetchingAreas(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="form-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="admin-title" style={{ margin: 0 }}>{isEditing ? 'Edit Company' : 'Create New Company'}</h2>
        {isEditing && (
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={resetForm}
            disabled={loading}
          >
            Cancel Edit
          </button>
        )}
      </div>

      <div className="form-section">
        {/* Load Existing Company Section */}
        <div style={{ background: 'var(--admin-bg-page)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          <h3 className="admin-subtitle" style={{ fontSize: '15px' }}>Load Existing Company (Optional)</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Enter Company ID"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="admin-input"
              disabled={loading}
              style={{ maxWidth: '200px' }}
            />
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={handleFetch}
              disabled={loading || fetchingAreas}
            >
              {loading ? 'Loading...' : 'Load Company'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Required Fields */}
          <div className="admin-form-group">
            <label className="admin-label required">Company Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="admin-input"
              required
              disabled={loading || fetchingAreas}
              placeholder="Enter company name"
            />
          </div>

          <div className="admin-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="admin-label required" style={{ margin: 0 }}>Area</label>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
                onClick={handleRefreshAreas}
                disabled={fetchingAreas}
                title="Refresh areas list"
              >
                {fetchingAreas ? '🔄' : '↻'} Refresh
              </button>
            </div>
            <select
              name="area_id"
              value={formData.area_id}
              onChange={handleInputChange}
              className="admin-select"
              required
              disabled={loading || fetchingAreas}
            >
              <option value="">Select Area</option>
              {areas.length > 0 ? (
                areas.map(area => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.name} {area.city ? `, ${area.city}` : ''}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {fetchingAreas ? 'Loading areas...' : 'No areas available'}
                </option>
              )}
            </select>
            {fetchingAreas && <small style={{ display: 'block', marginTop: '5px', color: 'var(--admin-primary)' }}>Loading areas...</small>}
            {areasError && <small style={{ display: 'block', marginTop: '5px', color: 'var(--admin-accent-red)' }}>{areasError}</small>}
          </div>

          {/* Contact Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="admin-form-group">
              <label className="admin-label">GST Number</label>
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleInputChange}
                className="admin-input"
                disabled={loading || fetchingAreas}
                placeholder="Enter GST number"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Phone</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                className="admin-input"
                disabled={loading || fetchingAreas}
                placeholder="Enter contact phone"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Email</label>
            <input
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleInputChange}
              className="admin-input"
              disabled={loading || fetchingAreas}
              placeholder="Enter contact email"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Website</label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="admin-input"
              disabled={loading || fetchingAreas}
              placeholder="https://example.com"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Address</label>
            <textarea
              name="address_line"
              value={formData.address_line}
              onChange={handleInputChange}
              className="admin-textarea"
              rows="3"
              disabled={loading || fetchingAreas}
              placeholder="Enter full address"
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={loading || fetchingAreas || !formData.name || !formData.area_id}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Company' : 'Create Company')}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={resetForm}
              disabled={loading || fetchingAreas}
            >
              Reset Form
            </button>
          </div>

          <div style={{ marginTop: '15px', textAlign: 'right', fontSize: '12px', color: 'var(--admin-text-subtle)' }}>
            <p><span style={{ color: 'var(--admin-accent-red)' }}>*</span> Required fields</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyForm;