import React, { useState, useEffect } from 'react';
import { useCustomerContext } from '../../../../context/CustomerContext';
import { Search, Filter, MoreVertical, Eye, Edit, Trash2, User, Mail, Phone, Calendar, DollarSign } from 'lucide-react';
import './CustomerList.css';
import AdminLayout from '../../../../components/Admin/Layout/AdminLayout';

const CustomerList = () => {
    const { customers, loading, error, fetchCustomers, deleteCustomer } = useCustomerContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Helper function to get customer name
    const getCustomerName = (customer) => {
        // First try to use full_name if it exists
        if (customer.full_name && customer.full_name !== 'Unknown Customer') {
            return customer.full_name;
        }

        // Otherwise combine first_name and last_name
        if (customer.first_name || customer.last_name) {
            return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
        }

        // Fallback to email or unknown
        return customer.email ? `Customer (${customer.email})` : 'Unknown Customer';
    };

    // Helper function to get initials for avatar
    const getCustomerInitials = (customer) => {
        const name = getCustomerName(customer);
        if (name && name !== 'Unknown Customer') {
            // Get first letter of each word
            return name
                .split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .join('')
                .substring(0, 2);
        }
        return customer.email ? customer.email.charAt(0).toUpperCase() : 'U';
    };

    const customerList = Array.isArray(customers) ? customers : [];

    const filteredCustomers = customerList.filter(customer => {
        const customerName = getCustomerName(customer).toLowerCase();
        const customerEmail = customer.email?.toLowerCase() || '';
        const customerPhone = customer.phone || '';

        const matchesSearch =
            customerName.includes(searchTerm.toLowerCase()) ||
            customerEmail.includes(searchTerm.toLowerCase()) ||
            customerPhone.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' ? customer.is_active : !customer.is_active);

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        const nameA = getCustomerName(a);
        const nameB = getCustomerName(b);

        switch (sortBy) {
            case 'name':
                return nameA.localeCompare(nameB);
            case 'email':
                return (a.email || '').localeCompare(b.email || '');
            case 'date':
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            default:
                return 0;
        }
    });

    const handleDelete = async (customerId) => {
        const result = await deleteCustomer(customerId);
        if (result.success) {
            setDeleteConfirm(null);
        }
    };

    const getStatusText = (isActive) => {
        return isActive ? 'Active' : 'Inactive';
    };

    if (loading) {
        return (
            <div className="admin-cl-loading">
                <div className="admin-cl-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-cl-error">
                <div className="admin-cl-error-box">
                    <p>{error}</p>
                    <button onClick={fetchCustomers} className="admin-cl-retry-btn">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-cl-wrapper">
            <div className="admin-cl-header">
                <div className="admin-cl-title-box">
                    <h1>Customers</h1>
                    <p>Manage core customer data and accounts</p>
                </div>
            </div>

            <div className="admin-cl-stats-grid">
                <div className="admin-cl-stat-card primary">
                    <p className="admin-cl-stat-label">Total Customers</p>
                    <p className="admin-cl-stat-value">{customerList.length}</p>
                </div>
                <div className="admin-cl-stat-card success">
                    <p className="admin-cl-stat-label">Active Customers</p>
                    <p className="admin-cl-stat-value">{customerList.filter(c => c.is_active).length}</p>
                </div>
                <div className="admin-cl-stat-card accent">
                    <p className="admin-cl-stat-label">Unique Emails</p>
                    <p className="admin-cl-stat-value">{new Set(customerList.map(c => c.email)).size}</p>
                </div>
            </div>

            <div className="admin-cl-controls-card">
                <div className="admin-cl-controls-row">
                    <div className="admin-cl-search-wrapper">
                        <Search className="admin-cl-search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="admin-cl-search-input"
                        />
                    </div>

                    <div className="admin-cl-filters-group">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="admin-cl-select"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="admin-cl-select"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="email">Sort by Email</option>
                            <option value="date">Sort by Date</option>
                        </select>
                    </div>
                </div>

                <div className="admin-cl-table-wrapper">
                    <table className="admin-cl-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Customer ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                                        {customerList.length === 0 ? 'No customers found' : 'No matching customers found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => {
                                    const customerName = getCustomerName(customer);
                                    const customerInitials = getCustomerInitials(customer);

                                    return (
                                        <tr key={customer.user_id}>
                                            <td>
                                                <div className="admin-cl-customer-cell">
                                                    <div className="admin-cl-avatar">
                                                        {customerInitials}
                                                    </div>
                                                    <div>
                                                        <p className="admin-cl-name">{customerName}</p>
                                                        {customer.created_at && (
                                                            <p className="admin-cl-joined">
                                                                Joined: {new Date(customer.created_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="admin-cl-contact-cell">
                                                    <div className="admin-cl-contact-row">
                                                        <Mail className="admin-cl-icon-muted" />
                                                        <span>{customer.email || 'No email'}</span>
                                                    </div>
                                                    {customer.phone && (
                                                        <div className="admin-cl-contact-row">
                                                            <Phone className="admin-cl-icon-muted" />
                                                            <span>{customer.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`admin-cl-status-badge ${customer.is_active ? 'active' : 'inactive'}`}>
                                                    {getStatusText(customer.is_active)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="admin-cl-id-cell">
                                                    #{customer.user_id}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="admin-cl-actions-cell">
                                                    <button
                                                        className="admin-cl-btn-action view"
                                                        title="View Details"
                                                        onClick={() => window.location.href = `/admin/users/customers/${customer.user_id}`}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="admin-cl-btn-action edit"
                                                        title="Edit"
                                                        onClick={() => window.location.href = `/admin/users/customers/edit/${customer.user_id}`}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        className="admin-cl-btn-action delete"
                                                        title="Delete"
                                                        onClick={() => setDeleteConfirm(customer.user_id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteConfirm && (
                <div className="admin-cl-modal-overlay">
                    <div className="admin-cl-modal-content">
                        <h3 className="admin-cl-modal-title">Confirm Deletion</h3>
                        <p className="admin-cl-modal-text">Are you sure you want to delete this customer? This action cannot be undone.</p>
                        <div className="admin-cl-modal-actions">
                            <button
                                className="admin-cl-modal-btn cancel"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="admin-cl-modal-btn confirm"
                                onClick={() => handleDelete(deleteConfirm)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerList;