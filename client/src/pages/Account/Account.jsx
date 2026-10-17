import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountContext } from '../../context/AccountContext';
import { useAuth } from '../../context/AuthContext';
import './Account.css';

const Account = () => {
    const navigate = useNavigate();
    const { dashboard, loading, error, fetchDashboard } = useAccountContext();
    const { user: authUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchDashboard();
    }, []);

    // Derived User Data
    const userData = {
        name: dashboard?.overview?.name || `${authUser?.first_name} ${authUser?.last_name}` || 'User',
        email: dashboard?.overview?.email || authUser?.email || '',
        tier: dashboard?.overview?.membership_tier || 'Standard',
        status: dashboard?.overview?.account_status || 'Active',
        joined: new Date(dashboard?.overview?.joined_date || authUser?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    const stats = {
        orders: dashboard?.stats?.total_orders || 0,
        pending: dashboard?.stats?.pending_orders || 0,
        wishlist: dashboard?.stats?.wishlist_items || 0, // Assuming available or from other context
        spent: dashboard?.stats?.total_spent || 0
    };

    if (loading && !dashboard) {
        return (
            <div className="account-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="account-page">
            <div className="account-container">
                {/* Header */}
                <div className="account-header">
                    <div className="account-avatar-wrapper">
                        {authUser?.profile_img_url || dashboard?.user?.profile_img_url ? (
                            <img
                                src={`http://localhost:8000${authUser?.profile_img_url || dashboard?.user?.profile_img_url}`}
                                alt="Profile"
                                className="account-avatar-image"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '50%'
                                }}
                            />
                        ) : (
                            <div className="account-avatar-placeholder">
                                {userData.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="account-status-indicator"></div>
                    </div>
                    <div className="account-info">
                        <h1>Hi, {userData.name}</h1>
                        <p className="account-email">{userData.email}</p>
                        <div className="account-meta">
                            <span className="account-badge badge-tier">{userData.tier} Member</span>
                            <span className="account-badge badge-status">{userData.status}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        style={{
                            marginLeft: 'auto',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#fee2e2',
                            color: '#ef4444',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>

                {/* Dashboard Stats */}
                <div className="dashboard-grid">
                    <div className="dashboard-card" onClick={() => navigate('/orders')}>
                        <div className="card-icon icon-blue">
                            <i className="fas fa-shopping-bag"></i>
                        </div>
                        <h3>{stats.orders}</h3>
                        <p>Total Orders</p>
                    </div>

                    <div className="dashboard-card" onClick={() => navigate('/orders?status=processing')}>
                        <div className="card-icon icon-orange">
                            <i className="fas fa-clock"></i>
                        </div>
                        <h3>{stats.pending}</h3>
                        <p>Pending Orders</p>
                    </div>

                    <div className="dashboard-card" onClick={() => navigate('/wishlist')}>
                        <div className="card-icon icon-purple">
                            <i className="fas fa-heart"></i>
                        </div>
                        <h3>View</h3>
                        <p>My Wishlist</p>
                    </div>

                    <div className="dashboard-card" onClick={() => navigate('/reviews')}>
                        <div className="card-icon icon-green">
                            <i className="fas fa-star"></i>
                        </div>
                        <h3>Reviews</h3>
                        <p>My Contributions</p>
                    </div>
                </div>

                {/* Quick Actions / Links */}
                <div className="quick-actions-grid">
                    {/* Account Settings */}
                    <div className="action-block">
                        <h3><i className="fas fa-user-cog"></i> Account Settings</h3>
                        <div className="links-list">
                            <div className="link-item" onClick={() => navigate('/profile')}>
                                <span>Personal Information</span>
                                <i className="fas fa-chevron-right"></i>
                            </div>
                            <div className="link-item" onClick={() => navigate('/addresses')}>
                                <span>Manage Addresses</span>
                                <i className="fas fa-chevron-right"></i>
                            </div>
                            <div className="link-item" onClick={() => navigate('/profile?tab=security')}>
                                <span>Login & Security</span>
                                <i className="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>

                    {/* Support & Legal */}
                    <div className="action-block">
                        <h3><i className="fas fa-life-ring"></i> Support</h3>
                        <div className="links-list">
                            <div className="link-item" onClick={() => navigate('/support')}>
                                <span>Help Center</span>
                                <i className="fas fa-chevron-right"></i>
                            </div>
                            <div className="link-item" onClick={() => {
                                logout();
                                navigate('/login');
                            }}>
                                <span style={{ color: '#ef4444' }}>Logout</span>
                                <i className="fas fa-sign-out-alt" style={{ color: '#ef4444' }}></i>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Account;