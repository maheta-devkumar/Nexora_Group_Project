// src/pages/Admin/Orders/OrdersLayout.jsx
import React, { useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useOrderAdminContext } from '../../../context/OrderAdminContext';
import './OrdersLayout.css';
import { FaBox, FaUndo, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';

// Import your existing order components
import AdminOrders from './Orders';
import AdminOrderDetails from './OrderDetails';
import AdminReturns from './Returns';
import AdminRefunds from './Refunds';
import AdminOrderAnalytics from './OrderAnalytics';

const OrdersLayout = () => {
  const location = useLocation();
  const { stats } = useOrderAdminContext();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeTab = location.pathname.split('/').pop();

  // Navigation items
  const navItems = [
    {
      id: 'orders',
      label: 'All Orders',
      path: '/admin/orders',
      icon: <FaBox />,
      count: stats?.total_orders || 0,
      exact: true
    },
    {
      id: 'returns',
      label: 'Returns',
      path: '/admin/orders/returns',
      icon: <FaUndo />,
      count: stats?.pending_returns || 0
    },
    {
      id: 'refunds',
      label: 'Refunds',
      path: '/admin/orders/refunds',
      icon: <FaMoneyBillWave />,
      count: stats?.pending_refunds || 0
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/admin/orders/analytics',
      icon: <FaChartLine />,
      badge: 'New'
    },
  ];

  return (
    <div className="orders-layout h-full flex flex-col md:flex-row bg-[var(--admin-bg-main)] min-h-screen">
      {/* Sidebar Navigation */}
      <div className={`orders-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} bg-[var(--admin-bg-card)] border-r border-[var(--admin-border)]`}>
        <div className="sidebar-header mb-6">
          {!isSidebarCollapsed && <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">Order Management</h2>}
          <button
            className="collapse-toggle text-[var(--admin-text-secondary)] hover:bg-[var(--admin-bg-hover)] p-2 rounded-lg"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="orders-nav space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `orders-nav-item ${isActive ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`
              }
              title={isSidebarCollapsed ? item.label : ''}
            >
              <span className="nav-icon text-lg">{item.icon}</span>
              {!isSidebarCollapsed && (
                <span className="nav-label">{item.label}</span>
              )}
              {!isSidebarCollapsed && item.count > 0 && (
                <span className="nav-count ml-auto bg-[var(--admin-bg-hover)] text-[var(--admin-text-secondary)] text-xs py-0.5 px-2 rounded-full">{item.count}</span>
              )}
              {item.badge && !isSidebarCollapsed && (
                <span className="nav-badge ml-auto bg-[var(--admin-primary-light)] text-[var(--admin-primary)] text-[10px] font-bold uppercase py-0.5 px-2 rounded-full">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {!isSidebarCollapsed && (
          <div className="sidebar-footer mt-auto pt-6 border-t border-[var(--admin-border)]">
            <div className="stats-summary space-y-3">
              <div className="stat-item flex justify-between items-center text-sm">
                <span className="stat-label text-[var(--admin-text-secondary)]">Today's Orders</span>
                <span className="stat-value font-bold text-[var(--admin-text-primary)]">{stats?.today_orders || 0}</span>
              </div>
              <div className="stat-item flex justify-between items-center text-sm">
                <span className="stat-label text-[var(--admin-text-secondary)]">Revenue</span>
                <span className="stat-value font-bold text-[var(--admin-success)]">₹{stats?.total_revenue?.toLocaleString('en-IN') || '0'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="orders-content flex-1 overflow-x-hidden overflow-y-auto bg-[var(--admin-bg-main)] p-6">
        <Routes>
          <Route index element={<AdminOrders />} />
          <Route path="returns" element={<AdminReturns />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="analytics" element={<AdminOrderAnalytics />} />
          <Route path=":orderId" element={<AdminOrderDetails />} />
        </Routes>
      </div>
    </div>
  );
};


export default OrdersLayout;
