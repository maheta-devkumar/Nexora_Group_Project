import React, { useState, useEffect } from 'react';
import { useDeliveryPersonContext } from '../../../../context/DeliveryPersonContext';
import {
    Search, Filter, Eye, Edit, Trash2,
    User, Phone, Star, MapPin, Clock, DollarSign,
    CheckCircle, XCircle, AlertCircle, Bike, Car,
    Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './DeliveryPersonList.css';
import AdminLayout from '../../../../components/Admin/Layout/AdminLayout';

const DeliveryPersonList = () => {
    const { deliveryPersons, loading, error, fetchDeliveryPersons, deleteDeliveryPerson } = useDeliveryPersonContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDeliveryPersons();
    }, [fetchDeliveryPersons]);

    // Helper function to safely parse rating
    const getRatingValue = (rating) => {
        if (!rating && rating !== 0) return 'N/A';
        const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
        return isNaN(numRating) ? 'N/A' : numRating.toFixed(1);
    };

    // Helper function to safely format earnings
    const getEarningsValue = (earnings) => {
        if (!earnings && earnings !== 0) return '0.00';
        const numEarnings = typeof earnings === 'string' ? parseFloat(earnings) : earnings;
        return isNaN(numEarnings) ? '0.00' : numEarnings.toFixed(2);
    };

    // Helper function to parse number safely
    const parseNumber = (value) => {
        if (!value && value !== 0) return 0;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? 0 : num;
    };

    const filteredDeliveryPersons = deliveryPersons.filter(person => {
        const matchesSearch =
            (person.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.phone?.includes(searchTerm) ||
                person.license_number?.includes(searchTerm)) || false;

        const matchesStatus = statusFilter === 'all' || person.status === statusFilter;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return (a.user_name || '').localeCompare(b.user_name || '');
            case 'rating':
                return parseNumber(b.rating) - parseNumber(a.rating);
            case 'deliveries':
                return (b.total_deliveries || 0) - (a.total_deliveries || 0);
            case 'earnings':
                return parseNumber(b.total_earnings) - parseNumber(a.total_earnings);
            default:
                return 0;
        }
    });

    const handleDelete = async (deliveryPersonId) => {
        const result = await deleteDeliveryPerson(deliveryPersonId);
        if (result.success) {
            setDeleteConfirm(null);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ACTIVE': return <CheckCircle size={14} className="admin-dp-list-icon-muted" />;
            case 'INACTIVE': return <XCircle size={14} className="admin-dp-list-icon-muted" />;
            case 'SUSPENDED': return <AlertCircle size={14} className="admin-dp-list-icon-muted" />;
            case 'PENDING': return <Clock size={14} className="admin-dp-list-icon-muted" />;
            default: return null;
        }
    };

    const getVehicleIcon = (vehicleType) => {
        switch (vehicleType?.toLowerCase()) {
            case 'bike': return <Bike size={14} />;
            case 'car': return <Car size={14} />;
            case 'motorcycle': return <Bike size={14} />;
            default: return <MapPin size={14} />;
        }
    };

    if (loading) {
        return (
            <div className="admin-dp-list-loading">
                <div className="admin-dp-list-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dp-list-error">
                <div className="admin-dp-list-error-box">
                    <p>{error}</p>
                    <button onClick={fetchDeliveryPersons} className="admin-dp-list-retry-btn">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dp-list-wrapper">

            <div className="admin-dp-list-header">
                <div className="admin-dp-list-title-box">
                    <h1>Delivery Persons</h1>
                    <p>Manage delivery team performance and status</p>
                </div>
                <button
                    className="admin-dp-list-btn-primary"
                    onClick={() => navigate('/admin/users/delivery-persons/create')}
                >
                    <Plus size={16} /> Add Delivery Person
                </button>
            </div>

            <div className="admin-dp-list-stats-grid">
                <div className="admin-dp-list-stat-card blue">
                    <div className="admin-dp-list-stat-icon blue"><User size={24} /></div>
                    <p className="admin-dp-list-stat-value">{deliveryPersons.length}</p>
                    <p className="admin-dp-list-stat-label">Total Staff</p>
                </div>
                <div className="admin-dp-list-stat-card green">
                    <div className="admin-dp-list-stat-icon green"><DollarSign size={24} /></div>
                    <p className="admin-dp-list-stat-value">${deliveryPersons.reduce((sum, p) => sum + parseNumber(p.total_earnings), 0).toFixed(2)}</p>
                    <p className="admin-dp-list-stat-label">Total Earnings</p>
                </div>
                <div className="admin-dp-list-stat-card orange">
                    <div className="admin-dp-list-stat-icon orange"><MapPin size={24} /></div>
                    <p className="admin-dp-list-stat-value">{deliveryPersons.reduce((sum, p) => sum + (p.total_deliveries || 0), 0)}</p>
                    <p className="admin-dp-list-stat-label">Total Deliveries</p>
                </div>
                <div className="admin-dp-list-stat-card yellow">
                    <div className="admin-dp-list-stat-icon yellow"><Star size={24} /></div>
                    <p className="admin-dp-list-stat-value">{(deliveryPersons.reduce((sum, p) => sum + parseNumber(p.rating), 0) / (deliveryPersons.length || 1)).toFixed(1)}</p>
                    <p className="admin-dp-list-stat-label">Avg Rating</p>
                </div>
            </div>

            <div className="admin-dp-list-controls-card">
                <div className="admin-dp-list-controls-row">
                    <div className="admin-dp-list-search-wrapper">
                        <Search className="admin-dp-list-search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or license..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="admin-dp-list-search-input"
                        />
                    </div>

                    <div className="admin-dp-list-filters-group">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="admin-dp-list-select"
                        >
                            <option value="all">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="PENDING">Pending</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="admin-dp-list-select"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="rating">Sort by Rating</option>
                            <option value="deliveries">Sort by Deliveries</option>
                            <option value="earnings">Sort by Earnings</option>
                        </select>
                    </div>
                </div>

                <div className="admin-dp-list-table-wrapper">
                    <table className="admin-dp-list-table">
                        <thead>
                            <tr>
                                <th>Delivery Person</th>
                                <th>Contact</th>
                                <th>Performance</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDeliveryPersons.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                                        No delivery persons found
                                    </td>
                                </tr>
                            ) : (
                                filteredDeliveryPersons.map(person => (
                                    <tr key={person.delivery_person_id}>
                                        <td>
                                            <div className="admin-dp-list-person-cell">
                                                <div className="admin-dp-list-avatar">
                                                    {person.user_name?.[0]?.toUpperCase() || 'D'}
                                                </div>
                                                <div className="admin-dp-list-details">
                                                    <p className="admin-dp-list-name">{person.user_name || 'Unknown'}</p>
                                                    <p className="admin-dp-list-subtext">ID: {person.delivery_person_id}</p>
                                                    <div className="admin-dp-list-meta">
                                                        {getVehicleIcon(person.vehicle_type)}
                                                        <span>{person.vehicle_type || 'No vehicle'}</span>
                                                        {person.license_number && <span>• License: {person.license_number}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="admin-dp-list-contact-cell">
                                                <div className="admin-dp-list-contact-row">
                                                    <Phone className="admin-dp-list-icon-muted" />
                                                    <span>{person.phone || 'Not provided'}</span>
                                                </div>
                                                <div className="admin-dp-list-subtext">
                                                    {person.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="admin-dp-list-perf-cell">
                                                <div className="admin-dp-list-rating-row">
                                                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                                    <span className="admin-dp-list-rating-val">{getRatingValue(person.rating)}</span>
                                                    <span className="admin-dp-list-subtext">({person.total_deliveries || 0} deliveries)</span>
                                                </div>
                                                <div className="admin-dp-list-earnings-row">
                                                    <DollarSign size={14} />
                                                    <span>${getEarningsValue(person.total_earnings)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`admin-dp-list-status-badge ${person.status}`}>
                                                {getStatusIcon(person.status)}
                                                {person.status}
                                            </span>
                                            {person.joined_at && (
                                                <div className="admin-dp-list-subtext" style={{ marginTop: '4px' }}>
                                                    Joined: {new Date(person.joined_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="admin-dp-list-actions-cell">
                                                <button
                                                    className="admin-dp-list-btn-action view"
                                                    title="View Details"
                                                    onClick={() => navigate(`/admin/users/delivery-persons/${person.delivery_person_id}`)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="admin-dp-list-btn-action edit"
                                                    title="Edit"
                                                    onClick={() => navigate(`/admin/users/delivery-persons/edit/${person.delivery_person_id}`)}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="admin-dp-list-btn-action delete"
                                                    title="Delete/Deactivate"
                                                    onClick={() => setDeleteConfirm(person.delivery_person_id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteConfirm && (
                <div className="admin-dp-list-modal-overlay">
                    <div className="admin-dp-list-modal-content">
                        <h3 className="admin-dp-list-modal-title">Confirm Deactivation</h3>
                        <p className="admin-dp-list-modal-text">Are you sure you want to deactivate this delivery person? This will set their status to INACTIVE.</p>
                        <div className="admin-dp-list-modal-actions">
                            <button
                                className="admin-dp-list-modal-btn cancel"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="admin-dp-list-modal-btn confirm"
                                onClick={() => handleDelete(deleteConfirm)}
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryPersonList;