import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDeliveryPersonContext } from '../../../../context/DeliveryPersonContext';
import {
  User, Mail, Phone, MapPin, Calendar, DollarSign, Package,
  ChevronLeft, Edit, Star, Clock, CheckCircle, XCircle,
  Activity, Bike, Car, Shield, Award, TrendingUp,
  FileText, AlertCircle, Download, Eye
} from 'lucide-react';
import './DeliveryPersonDetails.css';

const DeliveryPersonDetails = () => {
  const { deliveryPersonId } = useParams();
  const navigate = useNavigate();
  const {
    currentDeliveryPerson,
    loading,
    error,
    fetchDeliveryPersonById,
    fetchDeliveryPersonStats
  } = useDeliveryPersonContext();

  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (deliveryPersonId) {
      fetchDeliveryPersonById(deliveryPersonId);
      loadDeliveryPersonData();
    }
  }, [deliveryPersonId]);

  const loadDeliveryPersonData = async () => {
    const statsResult = await fetchDeliveryPersonStats(deliveryPersonId);
    if (statsResult.success) setStats(statsResult.data);

    // Mock orders data - in a real app, you would fetch from orders API
    const mockOrders = [
      { order_id: 1001, status: 'delivered', amount: 45.99, date: '2024-01-15', items: 3 },
      { order_id: 1002, status: 'delivered', amount: 89.50, date: '2024-01-14', items: 5 },
      { order_id: 1003, status: 'in_transit', amount: 32.99, date: '2024-01-15', items: 2 },
      { order_id: 1004, status: 'pending', amount: 67.25, date: '2024-01-15', items: 4 },
    ];
    setOrders(mockOrders);
  };

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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle size={14} className="status-icon active" />;
      case 'INACTIVE': return <XCircle size={14} className="status-icon inactive" />;
      case 'SUSPENDED': return <AlertCircle size={14} className="status-icon suspended" />;
      case 'PENDING': return <Clock size={14} className="status-icon pending" />;
      default: return null;
    }
  };

  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType?.toLowerCase()) {
      case 'bike': return <Bike size={16} />;
      case 'car': return <Car size={16} />;
      case 'motorcycle': return <Bike size={16} />;
      default: return <MapPin size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex justify-between items-center">
        <p>{error}</p>
        <button onClick={() => navigate('/admin/users/delivery-persons')} className="hover:bg-red-100 p-1 rounded">
          <ChevronLeft size={16} /> Back
        </button>
      </div>
    );
  }

  if (!currentDeliveryPerson) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-bold text-[var(--admin-text-primary)] mb-4">Delivery person not found</h3>
        <button onClick={() => navigate('/admin/users/delivery-persons')} className="admin-btn admin-btn-secondary">
          <ChevronLeft size={16} /> Back to Delivery Persons
        </button>
      </div>
    );
  }

  const ratingValue = parseNumber(currentDeliveryPerson.rating);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <button className="flex items-center text-[var(--admin-text-secondary)] hover:text-[var(--admin-primary)] transition-colors" onClick={() => navigate('/admin/users/delivery-persons')}>
          <ChevronLeft size={20} /> Back to Delivery Persons
        </button>

        <div className="flex gap-2">
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => navigate(`/admin/users/delivery-persons/edit/${deliveryPersonId}`)}
          >
            <Edit size={16} /> Edit Profile
          </button>
          <button className="admin-btn admin-btn-secondary">
            <Download size={16} /> Export Data
          </button>
        </div>
      </div>

      <div className="admin-card p-6 border-l-4 border-l-[var(--admin-primary)]">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[var(--admin-bg-hover)] flex items-center justify-center text-[var(--admin-primary)] font-bold text-2xl">
            {currentDeliveryPerson.user_name?.[0]?.toUpperCase() || 'D'}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)] mb-1">{currentDeliveryPerson.user_name || 'Unknown'}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${currentDeliveryPerson.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border border-green-200' :
                  currentDeliveryPerson.status === 'INACTIVE' ? 'bg-red-100 text-red-700 border border-red-200' :
                    currentDeliveryPerson.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                      'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                {getStatusIcon(currentDeliveryPerson.status)}
                {currentDeliveryPerson.status}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--admin-bg-hover)] text-[var(--admin-text-secondary)]">
                <Calendar size={12} /> Joined {formatDate(currentDeliveryPerson.joined_at)}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                <Star size={12} className="fill-yellow-700" /> {getRatingValue(currentDeliveryPerson.rating)}/5.0
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-[var(--admin-border)] pt-4 mt-2 w-full md:w-3/4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                  <Package size={18} />
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--admin-text-primary)]">{currentDeliveryPerson.total_deliveries || 0}</p>
                  <p className="text-xs text-[var(--admin-text-secondary)] uppercase font-bold">Deliveries</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-full">
                  <DollarSign size={18} />
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--admin-text-primary)]">${getEarningsValue(currentDeliveryPerson.total_earnings)}</p>
                  <p className="text-xs text-[var(--admin-text-secondary)] uppercase font-bold">Earnings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full">
                  <Award size={18} />
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--admin-text-primary)]">{getRatingValue(currentDeliveryPerson.rating)}</p>
                  <p className="text-xs text-[var(--admin-text-secondary)] uppercase font-bold">Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--admin-border)] mb-6">
        <div className="flex gap-6 overflow-x-auto">
          <button
            className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'overview'
                ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]'
                : 'border-transparent text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]'
              }`}
            onClick={() => setActiveTab('overview')}
          >
            <div className="flex items-center gap-2">
              <Activity size={16} /> Overview
            </div>
          </button>
          <button
            className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'orders'
                ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]'
                : 'border-transparent text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]'
              }`}
            onClick={() => setActiveTab('orders')}
          >
            <div className="flex items-center gap-2">
              <Package size={16} /> Orders ({orders.length})
            </div>
          </button>
          <button
            className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'documents'
                ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]'
                : 'border-transparent text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]'
              }`}
            onClick={() => setActiveTab('documents')}
          >
            <div className="flex items-center gap-2">
              <FileText size={16} /> Documents
            </div>
          </button>
          <button
            className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'performance'
                ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]'
                : 'border-transparent text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]'
              }`}
            onClick={() => setActiveTab('performance')}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} /> Performance
            </div>
          </button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="admin-card">
                <h3 className="text-lg font-bold text-[var(--admin-text-primary)] mb-6 flex items-center gap-2">
                  <User size={18} /> Personal Information
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-[var(--admin-border)] last:border-0">
                    <span className="text-[var(--admin-text-secondary)]">Full Name</span>
                    <span className="font-medium text-[var(--admin-text-primary)]">{currentDeliveryPerson.user_name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--admin-border)] last:border-0">
                    <span className="text-[var(--admin-text-secondary)]">Email</span>
                    <span className="font-medium text-[var(--admin-text-primary)]">{currentDeliveryPerson.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--admin-border)] last:border-0">
                    <span className="text-[var(--admin-text-secondary)]">Phone</span>
                    <span className="font-medium text-[var(--admin-text-primary)]">{currentDeliveryPerson.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--admin-border)] last:border-0">
                    <span className="text-[var(--admin-text-secondary)]">User ID</span>
                    <span className="font-mono text-[var(--admin-text-primary)]">{currentDeliveryPerson.user_id}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--admin-border)] last:border-0">
                    <span className="text-[var(--admin-text-secondary)]">Delivery Person ID</span>
                    <span className="font-mono text-[var(--admin-text-primary)]">{currentDeliveryPerson.delivery_person_id}</span>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h3 className="text-lg font-bold text-[var(--admin-text-primary)] mb-6 flex items-center gap-2">
                  <Bike size={18} /> Delivery Information
                </h3>
                <div className="bg-[var(--admin-bg-hover)] p-4 rounded-lg border border-[var(--admin-border)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                      {getVehicleIcon(currentDeliveryPerson.vehicle_type)}
                    </div>
                    <h4 className="font-bold text-[var(--admin-text-primary)] uppercase">{currentDeliveryPerson.vehicle_type || 'Not specified'}</h4>
                  </div>
                  <div className="space-y-3 pl-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--admin-text-secondary)]">License Number</span>
                      <span className="font-mono font-medium">{currentDeliveryPerson.license_number || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--admin-text-secondary)]">Vehicle Number</span>
                      <span className="font-mono font-medium">{currentDeliveryPerson.vehicle_number || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--admin-text-secondary)]">Current Status</span>
                      <span className={`font-bold ${currentDeliveryPerson.status === 'ACTIVE' ? 'text-green-600' :
                          currentDeliveryPerson.status === 'INACTIVE' ? 'text-red-600' : 'text-orange-600'
                        }`}>
                        {currentDeliveryPerson.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card h-fit">
              <h3 className="text-lg font-bold text-[var(--admin-text-primary)] mb-6 flex items-center gap-2">
                <MapPin size={18} /> Activity Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--admin-bg-hover)] rounded-lg text-center">
                  <Calendar size={20} className="mx-auto mb-2 text-[var(--admin-text-secondary)]" />
                  <h4 className="text-xs uppercase font-bold text-[var(--admin-text-secondary)] mb-1">Joined Date</h4>
                  <p className="font-semibold text-sm">{formatDate(currentDeliveryPerson.joined_at)}</p>
                </div>
                <div className="p-4 bg-[var(--admin-bg-hover)] rounded-lg text-center">
                  <Package size={20} className="mx-auto mb-2 text-[var(--admin-text-secondary)]" />
                  <h4 className="text-xs uppercase font-bold text-[var(--admin-text-secondary)] mb-1">Total Deliveries</h4>
                  <p className="font-semibold text-sm">{currentDeliveryPerson.total_deliveries || 0}</p>
                </div>
                <div className="p-4 bg-[var(--admin-bg-hover)] rounded-lg text-center">
                  <DollarSign size={20} className="mx-auto mb-2 text-[var(--admin-text-secondary)]" />
                  <h4 className="text-xs uppercase font-bold text-[var(--admin-text-secondary)] mb-1">Total Earnings</h4>
                  <p className="font-semibold text-sm">${getEarningsValue(currentDeliveryPerson.total_earnings)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="admin-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">Recent Delivery Assignments</h3>
              <span className="text-sm text-[var(--admin-text-secondary)] bg-[var(--admin-bg-hover)] px-2 py-1 rounded-full">{orders.length} orders found</span>
            </div>

            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--admin-text-muted)]">
                <Package size={48} className="mb-4 opacity-50" />
                <h4 className="text-lg font-semibold">No delivery assignments yet</h4>
                <p>This delivery person hasn't been assigned any orders yet.</p>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Status</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.order_id}>
                        <td className="font-mono font-semibold text-[var(--admin-primary)]">#{order.order_id}</td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                            {order.status === 'delivered' ? <CheckCircle size={12} /> :
                              order.status === 'cancelled' ? <XCircle size={12} /> :
                                <Clock size={12} />}
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{order.items} items</td>
                        <td className="font-bold">${order.amount.toFixed(2)}</td>
                        <td>{formatDate(order.date)}</td>
                        <td>
                          <button className="admin-btn admin-btn-secondary py-1 px-3 text-xs flex items-center gap-1">
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="admin-card">
            <h3 className="text-lg font-bold text-[var(--admin-text-primary)] mb-6">Documents & Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="border border-[var(--admin-border)] rounded-lg p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                  <Shield size={24} />
                </div>
                <h4 className="font-bold text-[var(--admin-text-primary)] mb-1">Driver's License</h4>
                <p className="text-xs text-[var(--admin-text-secondary)] mb-3">Government issued ID</p>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mb-4">Verified</span>
                <button className="admin-btn admin-btn-secondary w-full text-xs">
                  <Eye size={14} /> View Document
                </button>
              </div>

              <div className="border border-[var(--admin-border)] rounded-lg p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                  <Car size={24} />
                </div>
                <h4 className="font-bold text-[var(--admin-text-primary)] mb-1">Vehicle Registration</h4>
                <p className="text-xs text-[var(--admin-text-secondary)] mb-3">Vehicle ownership proof</p>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold mb-4">Pending</span>
                <button className="admin-btn admin-btn-secondary w-full text-xs">
                  <Eye size={14} /> Review
                </button>
              </div>

              <div className="border border-[var(--admin-border)] rounded-lg p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-3">
                  <FileText size={24} />
                </div>
                <h4 className="font-bold text-[var(--admin-text-primary)] mb-1">Insurance Certificate</h4>
                <p className="text-xs text-[var(--admin-text-secondary)] mb-3">Third-party insurance</p>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mb-4">Verified</span>
                <button className="admin-btn admin-btn-secondary w-full text-xs">
                  <Eye size={14} /> View Document
                </button>
              </div>
            </div>

            <div className="bg-[var(--admin-bg-hover)] p-6 rounded-lg border border-[var(--admin-border)] flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="font-bold text-[var(--admin-text-primary)]">Request Additional Documents</h4>
                <p className="text-sm text-[var(--admin-text-secondary)]">If additional verification is needed, request documents from the delivery person.</p>
              </div>
              <button className="admin-btn admin-btn-outline">
                Request Document
              </button>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="admin-card">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp size={24} className="text-[var(--admin-primary)]" />
                  <h4 className="text-lg font-bold text-[var(--admin-text-primary)]">Performance Overview</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--admin-border)]">
                    <span className="text-[var(--admin-text-secondary)]">Completion Rate</span>
                    <span className="font-bold text-green-600">98%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--admin-border)]">
                    <span className="text-[var(--admin-text-secondary)]">Avg. Delivery Time</span>
                    <span className="font-bold text-[var(--admin-text-primary)]">32 min</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--admin-border)]">
                    <span className="text-[var(--admin-text-secondary)]">On-time Rate</span>
                    <span className="font-bold text-blue-600">95%</span>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="flex items-center gap-3 mb-6">
                  <Star size={24} className="text-yellow-500" />
                  <h4 className="text-lg font-bold text-[var(--admin-text-primary)]">Customer Feedback</h4>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex text-yellow-500">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={24}
                        className={star <= ratingValue ? 'fill-current' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-2xl font-bold text-[var(--admin-text-primary)]">{getRatingValue(currentDeliveryPerson.rating)}/5.0</span>
                </div>
                <div className="space-y-3">
                  <h5 className="font-semibold text-sm uppercase text-[var(--admin-text-secondary)]">Recent Feedback</h5>
                  <div className="p-3 bg-[var(--admin-bg-hover)] rounded-lg">
                    <p className="text-sm italic text-[var(--admin-text-primary)]">"Very professional and punctual"</p>
                    <span className="text-xs text-[var(--admin-text-secondary)] block mt-1">Jan 14, 2024</span>
                  </div>
                  <div className="p-3 bg-[var(--admin-bg-hover)] rounded-lg">
                    <p className="text-sm italic text-[var(--admin-text-primary)]">"Careful handling of fragile items"</p>
                    <span className="text-xs text-[var(--admin-text-secondary)] block mt-1">Jan 13, 2024</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <h4 className="text-lg font-bold text-[var(--admin-text-primary)] mb-4">Actions</h4>
              <div className="flex flex-wrap gap-4">
                <button className="admin-btn bg-green-100 text-green-700 hover:bg-green-200 border-none">
                  <Award size={16} /> Give Bonus
                </button>
                <button className="admin-btn bg-orange-100 text-orange-700 hover:bg-orange-200 border-none">
                  <AlertCircle size={16} /> Send Warning
                </button>
                <button className="admin-btn bg-red-100 text-red-700 hover:bg-red-200 border-none">
                  <XCircle size={16} /> Suspend Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPersonDetails;