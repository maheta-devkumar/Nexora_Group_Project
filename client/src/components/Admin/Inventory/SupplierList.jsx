import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useInventoryContext } from '../../../context/InventoryContext';

const SupplierList = ({ onEdit }) => {
  const {
    suppliers,
    loading,
    error,
    clearError,
    fetchSuppliers,
    deleteSupplier
  } = useInventoryContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'supplier_id', direction: 'asc' });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    // Filter suppliers when search term changes
    const filtered = suppliers.filter(supplier =>
      (supplier.name || supplier.supplier_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.gst_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm]);

  const loadSuppliers = async () => {
    try {
      const result = await fetchSuppliers();
      if (result.success) {
        toast.success('Suppliers loaded successfully');
      }
    } catch (err) {
      toast.error('Failed to load suppliers');
    }
  };

  const handleDelete = async (supplierId, supplierName) => {
    if (window.confirm(`Are you sure you want to delete "${supplierName}"? This action cannot be undone.`)) {
      try {
        const result = await deleteSupplier(supplierId);
        if (result.success) {
          toast.success(`${supplierName} deleted successfully`);
        }
      } catch (err) {
        toast.error('Failed to delete supplier');
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSuppliers = sortedSuppliers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status) => {
    return status ? 'status-active' : 'status-inactive';
  };

  const getSupplierName = (supplier) => {
    return supplier.name || supplier.supplier_name || 'Unnamed Supplier';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading suppliers...</p>
      </div>
    );
  }

  if (error) {
    toast.error(error);
    clearError();
  }

  return (
    <div className="supplier-list-container">
      {/* Header Section */}
      <div className="supplier-list-header">
        <div className="header-left">
          <h2>Supplier Management</h2>
          <p className="subtitle">Manage all your suppliers in one place</p>
        </div>
        <div className="header-right">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search suppliers by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="header-actions">
            <button
              className="btn-refresh"
              onClick={loadSuppliers}
              title="Refresh list"
            >
              ↻ Refresh
            </button>
            <div className="items-per-page">
              <label>Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{suppliers.length}</h3>
            <p>Total Suppliers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{suppliers.filter(s => s.is_active).length}</h3>
            <p>Active Suppliers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">₹</div>
          <div className="stat-content">
            <h3>₹{suppliers.reduce((sum, s) => sum + (parseFloat(s.total_purchases) || 0), 0).toLocaleString()}</h3>
            <p>Total Purchases</p>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <table className="supplier-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('supplier_id')}>
                ID {sortConfig.key === 'supplier_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="sortable" onClick={() => handleSort('name')}>
                Supplier Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Company</th>
              <th>Contact Info</th>
              <th>GST</th>
              <th>Status</th>
              <th>Total Purchases</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSuppliers.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  <div className="empty-content">
                    <div className="empty-icon">📋</div>
                    <h3>No suppliers found</h3>
                    <p>{searchTerm ? 'Try a different search term' : 'Start by adding your first supplier'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedSuppliers.map(supplier => (
                <tr key={supplier.supplier_id} className="supplier-row">
                  <td className="supplier-id">#{supplier.supplier_id}</td>
                  <td>
                    <div className="supplier-name">
                      <strong>{getSupplierName(supplier)}</strong>
                      <span className="supplier-area">{supplier.area?.name || ''}</span>
                    </div>
                  </td>
                  <td>
                    {supplier.company?.name ? (
                      <div className="company-info">
                        <span className="company-name">{supplier.company.name}</span>
                        {supplier.company.contact_email && (
                          <span className="company-email">{supplier.company.contact_email}</span>
                        )}
                      </div>
                    ) : (
                      <span className="no-company">No company</span>
                    )}
                  </td>
                  <td>
                    <div className="contact-info">
                      {supplier.email && (
                        <div className="contact-item">
                          <span className="contact-icon">✉️</span>
                          <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="contact-item">
                          <span className="contact-icon">📞</span>
                          <a href={`tel:${supplier.phone}`}>{supplier.phone}</a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {supplier.gst_number ? (
                      <span className="gst-badge">{supplier.gst_number}</span>
                    ) : (
                      <span className="no-gst">No GST</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(supplier.is_active)}`}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="purchase-info">
                      <span className="purchase-amount">₹{(parseFloat(supplier.total_purchases) || 0).toLocaleString()}</span>
                      {supplier.last_purchase_date && (
                        <span className="last-purchase">
                          Last: {new Date(supplier.last_purchase_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-view"
                        onClick={() => toast.info(`Viewing ${getSupplierName(supplier)}`)}
                        title="View details"
                      >
                        👁️
                      </button>
                      <button
                        className="btn-action btn-edit"
                        onClick={() => onEdit && onEdit(supplier)}
                        title="Edit supplier"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(supplier.supplier_id, getSupplierName(supplier))}
                        title="Delete supplier"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="table-footer">
        <div className="footer-left">
          <span className="results-count">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedSuppliers.length)} of {sortedSuppliers.length} suppliers
          </span>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>

            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="page-dots">...</span>
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierList;

// CSS Styles
<style jsx>{`
  .supplier-list-container {
    padding: 24px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
  }

  /* Header Styles */
  .supplier-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 20px;
  }

  .header-left h2 {
    margin: 0;
    font-size: 28px;
    color: #2c3e50;
    font-weight: 700;
  }

  .subtitle {
    margin: 8px 0 0 0;
    color: #7f8c8d;
    font-size: 14px;
  }

  .header-right {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    max-width: 600px;
  }

  .search-container {
    position: relative;
    display: flex;
    align-items: center;
    background: white;
    border-radius: 12px;
    padding: 10px 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 2px solid transparent;
    transition: border-color 0.3s;
  }

  .search-container:focus-within {
    border-color: #3498db;
  }

  .search-icon {
    margin-right: 10px;
    color: #7f8c8d;
  }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    padding: 5px;
    background: transparent;
    width: 100%;
  }

  .clear-search {
    background: none;
    border: none;
    cursor: pointer;
    color: #95a5a6;
    font-size: 18px;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.3s;
  }

  .clear-search:hover {
    color: #e74c3c;
  }

  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
  }

  .btn-refresh {
    background: #3498db;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-refresh:hover:not(:disabled) {
    background: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }

  .items-per-page {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #2c3e50;
    font-weight: 500;
  }

  .items-per-page select {
    padding: 8px 12px;
    border: 1px solid #bdc3c7;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: border-color 0.3s;
  }

  .items-per-page select:focus {
    border-color: #3498db;
    outline: none;
  }

  /* Stats Cards */
  .stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s, box-shadow 0.3s;
  }

  .stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  }

  .stat-icon {
    font-size: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .stat-content h3 {
    margin: 0;
    font-size: 32px;
    color: #2c3e50;
    font-weight: 700;
  }

  .stat-content p {
    margin: 5px 0 0 0;
    color: #7f8c8d;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* Table Styles */
  .table-container {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
    overflow-x: auto;
  }

  .supplier-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1200px;
  }

  .supplier-table thead {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .supplier-table th {
    padding: 20px;
    text-align: left;
    color: white;
    font-weight: 600;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
  }

  .sortable {
    cursor: pointer;
    user-select: none;
    transition: background 0.3s;
  }

  .sortable:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .supplier-table tbody tr {
    border-bottom: 1px solid #ecf0f1;
    transition: background 0.3s;
  }

  .supplier-table tbody tr:hover {
    background: #f8f9fa;
  }

  .supplier-table td {
    padding: 20px;
    vertical-align: top;
  }

  /* Supplier Row Content */
  .supplier-id {
    font-weight: 700;
    color: #2c3e50;
  }

  .supplier-name {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .supplier-name strong {
    font-size: 16px;
    color: #2c3e50;
  }

  .supplier-area {
    font-size: 12px;
    color: #7f8c8d;
    background: #f8f9fa;
    padding: 2px 8px;
    border-radius: 4px;
    display: inline-block;
  }

  .company-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .company-name {
    font-weight: 600;
    color: #2c3e50;
  }

  .company-email {
    font-size: 12px;
    color: #3498db;
  }

  .no-company, .no-gst {
    color: #95a5a6;
    font-style: italic;
  }

  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .contact-icon {
    font-size: 12px;
  }

  .contact-info a {
    color: #3498db;
    text-decoration: none;
    font-size: 13px;
    transition: color 0.3s;
  }

  .contact-info a:hover {
    color: #2980b9;
    text-decoration: underline;
  }

  .gst-badge {
    background: #e8f4fc;
    color: #3498db;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }

  .status-badge {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-block;
  }

  .status-active {
    background: #d5f4e6;
    color: #27ae60;
  }

  .status-inactive {
    background: #fde8e8;
    color: #e74c3c;
  }

  .purchase-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .purchase-amount {
    font-weight: 700;
    color: #2c3e50;
    font-size: 16px;
  }

  .last-purchase {
    font-size: 11px;
    color: #7f8c8d;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .btn-action {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.3s;
  }

  .btn-view {
    background: #e8f4fc;
    color: #3498db;
  }

  .btn-view:hover {
    background: #3498db;
    color: white;
  }

  .btn-edit {
    background: #fff8e1;
    color: #f39c12;
  }

  .btn-edit:hover {
    background: #f39c12;
    color: white;
  }

  .btn-delete {
    background: #fde8e8;
    color: #e74c3c;
  }

  .btn-delete:hover {
    background: #e74c3c;
    color: white;
  }

  /* Empty State */
  .empty-state {
    padding: 60px 20px;
  }

  .empty-content {
    text-align: center;
    padding: 40px;
  }

  .empty-icon {
    font-size: 60px;
    margin-bottom: 20px;
    opacity: 0.5;
  }

  .empty-content h3 {
    color: #2c3e50;
    margin-bottom: 10px;
  }

  .empty-content p {
    color: #7f8c8d;
  }

  /* Footer */
  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    flex-wrap: wrap;
    gap: 20px;
  }

  .results-count {
    color: #2c3e50;
    font-weight: 500;
  }

  /* Pagination */
  .pagination {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pagination-btn {
    padding: 10px 20px;
    background: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    color: #2c3e50;
    font-weight: 500;
    transition: all 0.3s;
  }

  .pagination-btn:hover:not(:disabled) {
    background: #3498db;
    color: white;
    border-color: #3498db;
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .page-btn {
    width: 40px;
    height: 40px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    color: #2c3e50;
    transition: all 0.3s;
  }

  .page-btn:hover:not(.active) {
    border-color: #3498db;
    color: #3498db;
  }

  .page-btn.active {
    background: #3498db;
    color: white;
    border-color: #3498db;
  }

  .page-dots {
    padding: 0 10px;
    color: #95a5a6;
  }

  /* Loading State */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 20px;
  }

  .spinner {
    width: 60px;
    height: 60px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-container p {
    color: #2c3e50;
    font-size: 18px;
    font-weight: 500;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .supplier-list-container {
      padding: 16px;
    }

    .supplier-list-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-right {
      max-width: 100%;
    }

    .stats-container {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    .table-footer {
      flex-direction: column;
      align-items: stretch;
    }

    .pagination {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 768px) {
    .header-actions {
      flex-direction: column;
    }

    .items-per-page {
      align-self: flex-end;
    }

    .action-buttons {
      flex-direction: column;
    }

    .btn-action {
      width: 32px;
      height: 32px;
      font-size: 14px;
    }

    .supplier-table td,
    .supplier-table th {
      padding: 12px;
    }
  }

  @media (max-width: 480px) {
    .stats-container {
      grid-template-columns: 1fr;
    }

    .stat-card {
      flex-direction: column;
      text-align: center;
    }
  }
`}</style>