import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const CompanyList = ({ onEdit }) => {
  const {
    companies,
    loading,
    error,
    clearError,
    fetchCompanies,
    deleteCompany
  } = useInventoryContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const result = await fetchCompanies();
      if (result.success) {
        toast.success('Companies loaded successfully');
      }
    } catch (err) {
      toast.error('Failed to load companies');
    }
  };

  const handleDelete = async (companyId, companyName) => {
    if (window.confirm(`Are you sure you want to delete ${companyName}?`)) {
      try {
        const result = await deleteCompany(companyId);
        if (result.success) {
          toast.success('Company deleted successfully');
        }
      } catch (err) {
        toast.error('Failed to delete company');
      }
    }
  };

  const handleEdit = (company) => {
    // Call parent handler to switch view
    if (onEdit) {
      onEdit(company);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading companies...</div>;
  if (error) {
    toast.error(error);
    clearError();
  }

  return (
    <div className="admin-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">Company List</h2>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={loadCompanies}>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-[var(--admin-text-muted)]">No companies found</td>
              </tr>
            ) : (
              filteredCompanies.map(company => (
                <tr key={company.company_id}>
                  <td>{company.company_id}</td>
                  <td className="font-semibold">{company.company_name}</td>
                  <td>{company.contact_email || '-'}</td>
                  <td>{company.phone || '-'}</td>
                  <td>{company.address ? company.address.substring(0, 30) + '...' : '-'}</td>
                  <td className="flex gap-2">
                    <button
                      className="admin-btn admin-btn-secondary py-1 px-3 text-xs"
                      onClick={() => handleEdit(company)}
                    >
                      Edit
                    </button>
                    <button
                      className="admin-btn admin-btn-danger py-1 px-3 text-xs"
                      onClick={() => handleDelete(company.company_id, company.company_name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-[var(--admin-text-muted)] flex justify-end">
        <p>Showing {filteredCompanies.length} of {companies.length} companies</p>
      </div>
    </div>
  );
};

export default CompanyList;