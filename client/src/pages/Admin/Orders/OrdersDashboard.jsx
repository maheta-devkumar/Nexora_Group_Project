import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useOrderAdminContext } from '../../../context/OrderAdminContext';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout';
import './OrdersDashboard.css';
import {
    Package,
    BarChart3,
    RotateCcw,
    CreditCard,
    Truck,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

const OrdersDashboard = () => {
    const location = useLocation();
    const { stats } = useOrderAdminContext();
    const [activeTab, setActiveTab] = useState('orders');

    // Navigation items
    const navItems = [
        {
            id: 'orders',
            label: 'Orders',
            path: '',
            icon: <Package size={18} />,
            count: stats?.total_orders || 0,
            exact: true
        },
        {
            id: 'analytics',
            label: 'Analytics',
            path: 'analytics',
            icon: <BarChart3 size={18} />,
            badge: 'New'
        },
        {
            id: 'returns',
            label: 'Returns',
            path: 'returns',
            icon: <RotateCcw size={18} />,
            count: stats?.pending_returns || 0
        },
        {
            id: 'refunds',
            label: 'Refunds',
            path: 'refunds',
            icon: <CreditCard size={18} />,
            count: stats?.pending_refunds || 0
        },
        {
            id: 'delivery',
            label: 'Delivery',
            path: 'delivery-management',
            icon: <Truck size={18} />,
            count: stats?.pending_delivery || 0
        },
    ];

    // Update active tab based on current URL
    useEffect(() => {
        const path = location.pathname;

        if (path.includes('/admin/orders/analytics')) {
            setActiveTab('analytics');
        } else if (path.includes('/admin/orders/returns')) {
            setActiveTab('returns');
        } else if (path.includes('/admin/orders/refunds')) {
            setActiveTab('refunds');
        } else if (path.includes('/admin/orders/delivery-management')) {
            setActiveTab('delivery');
        } else if (path.match(/\/admin\/orders\/\d+/)) {
            setActiveTab('orders');
        } else if (path === '/admin/orders' || path === '/admin/orders/') {
            setActiveTab('orders');
        }
    }, [location.pathname]);

    return (
        <AdminLayout>
            <div className="od-dashboard">
                {/* Header with stats */}
                <div className="od-header">


                    <div className="od-stats-grid">
                        <div className="od-stat-card primary">
                            <div className="od-stat-icon-wrapper">
                                <Package size={24} />
                            </div>
                            <div className="od-stat-content">
                                <span className="od-stat-label">Total Orders</span>
                                <span className="od-stat-value">{stats?.total_orders || 0}</span>
                            </div>
                            <div className="od-stat-trend up">
                                <TrendingUp size={14} />
                                <span>+12%</span>
                            </div>
                        </div>

                        <div className="od-stat-card success">
                            <div className="od-stat-icon-wrapper">
                                <CreditCard size={24} />
                            </div>
                            <div className="od-stat-content">
                                <span className="od-stat-label">Revenue</span>
                                <span className="od-stat-value">${stats?.total_revenue?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="od-stat-trend up">
                                <ArrowUpRight size={14} />
                                <span>+8.4%</span>
                            </div>
                        </div>

                        <div className="od-stat-card warning">
                            <div className="od-stat-icon-wrapper">
                                <RotateCcw size={24} />
                            </div>
                            <div className="od-stat-content">
                                <span className="od-stat-label">Pending Returns</span>
                                <span className="od-stat-value">{stats?.pending_returns || 0}</span>
                            </div>
                            <div className="od-stat-trend down">
                                <ArrowDownRight size={14} />
                                <span>-2.1%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="od-nav-wrapper">
                    <div className="od-nav">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                end={item.exact}
                                className={({ isActive }) =>
                                    `od-nav-item ${isActive || activeTab === item.id ? 'active' : ''}`
                                }
                            >
                                <span className="od-nav-icon">{item.icon}</span>
                                <span className="od-nav-label">{item.label}</span>
                                {item.count > 0 && (
                                    <span className="od-nav-badge count">{item.count}</span>
                                )}
                                {item.badge && (
                                    <span className="od-nav-badge new">{item.badge}</span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="od-content">
                    <Outlet />
                </div>
            </div>
        </AdminLayout>
    );
};

export default OrdersDashboard;