import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');

  // Get page title from current path
  useEffect(() => {
    const path = location.pathname;
    const title = getPageTitle(path);
    setPageTitle(title);

    // Auto-close sidebar on mobile when navigating
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // Increased breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Helper function to get page title from path
  const getPageTitle = (path) => {
    const pathMap = {
      '/admin/dashboard': 'Dashboard',
      '/admin/orders': 'Orders Management',
      '/admin/products': 'Products Management',
      '/admin/customers': 'Customers Management',
      '/admin/delivery-persons': 'Delivery Agents',
      '/admin/inventory': 'Inventory Management',
      '/admin/marketing': 'Marketing',
      '/admin/delivery': 'Delivery Management',
      '/admin/analytics': 'Analytics',
      '/admin/reports': 'Reports',
      '/admin/ai': 'AI Business Insights',
      '/admin/payments': 'Payment Management',
      '/admin/schedule': 'Schedule',
      '/admin/security': 'Security',
      '/admin/support': 'Support',
      '/admin/notifications': 'Notifications',
      '/admin/settings': 'Settings',
      '/admin/profile': 'Profile',
      '/admin': 'Dashboard'
    };

    // Find exact match or starts with match
    for (const [key, value] of Object.entries(pathMap)) {
      if (path === key || path.startsWith(key + '/')) {
        return value;
      }
    }

    return 'Dashboard';
  };

  return (
    <div className="ad-layout">
      {/* Abstract Background Blobs for Premium Feel */}
      <div className="ad-bg-blob ad-blob-1"></div>
      <div className="ad-bg-blob ad-blob-2"></div>

      <AdminHeader
        toggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      <div className="ad-layout-container">
        <AdminSidebar
          isOpen={sidebarOpen}
          isMobile={isMobile}
          closeSidebar={closeSidebar}
          toggleSidebar={toggleSidebar}
        />

        <main className={`ad-main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
          {/* Breadcrumb Header - keeping logic but styling will be updated */}
          <div className="ad-content-header" style={{ display: location.pathname.includes('/dashboard') ? 'none' : 'flex' }}>
            <h1 className="ad-page-title">{pageTitle}</h1>
            <div className="ad-breadcrumb">
              <span>Admin</span>
              <span className="ad-breadcrumb-separator">/</span>
              <span className="ad-breadcrumb-current">{pageTitle}</span>
            </div>
          </div>

          <div className="ad-content-wrapper">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="ad-mobile-overlay"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default AdminLayout;