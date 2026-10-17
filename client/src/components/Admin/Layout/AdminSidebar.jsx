import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminSidebar.css';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  FileText,
  Settings,
  Bell,
  Tag,
  Map,
  DollarSign,
  Database,
  Home,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const AdminSidebar = ({ isOpen, isMobile, closeSidebar, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation data - Clean Modern Icons
  const [navItems, setNavItems] = useState([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      path: '/admin/dashboard',
      badge: null
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      icon: <Sparkles size={20} />,
      path: '/admin/ai',
      badge: 'NEW',
      isHighlight: true
    },
    { type: 'section', label: 'E-Commerce' },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingCart size={20} />,
      path: '/admin/orders',
      badge: 5 // Dummy
    },
    {
      id: 'products',
      label: 'Products',
      icon: <Package size={20} />,
      path: '/admin/products',
      badge: null
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Database size={20} />,
      path: '/admin/inventory',
      badge: null
    },
    { type: 'section', label: 'Users & Delivery' },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users size={20} />,
      path: '/admin/users',
      badge: null
    },
    {
      id: 'delivery-persons',
      label: 'Delivery Agents',
      icon: <Truck size={20} />,
      path: '/admin/users/delivery-persons',
      badge: null
    },
    {
      id: 'delivery',
      label: 'Delivery',
      icon: <Map size={20} />,
      path: '/admin/delivery',
      badge: null
    },
    { type: 'section', label: 'Finance & Marketing' },
    {
      id: 'payments',
      label: 'Payments',
      icon: <DollarSign size={20} />,
      path: '/admin/payments',
      badge: null
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: <Tag size={20} />,
      path: '/admin/marketing',
      badge: null
    },
    { type: 'section', label: 'System' },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText size={20} />,
      path: '/admin/reports',
      badge: null
    },
    {
      id: 'bulk-upload',
      label: 'Bulk Import',
      icon: <Database size={20} />,
      path: '/admin/bulk-upload',
      badge: null
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={20} />,
      path: '/admin/notifications',
      badge: 3
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      path: '/admin/settings',
      badge: null
    },
  ]);

  // Determine which item is active based on current URL
  useEffect(() => {
    const currentPath = location.pathname;

    const updatedItems = navItems.map(item => {
      if (item.type === 'section') return item;
      return {
        ...item,
        active: currentPath === item.path ||
          currentPath.startsWith(item.path + '/') ||
          (item.path === '/admin/dashboard' && currentPath === '/admin')
      };
    });

    setNavItems(updatedItems);
  }, [location.pathname]);

  const handleNavigation = (item) => {
    if (item.type === 'section') return;
    navigate(item.path);

    if (isMobile) {
      closeSidebar();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login');
  };

  return (
    <aside className={`ad-sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
      <div className="ad-sidebar-glass"></div>

      <nav className="ad-sidebar-content">


        {/* Main Menu */}
        <div className="ad-sidebar-menu">
          {navItems.map((item, index) => {
            if (item.type === 'section') {
              return isOpen ? (
                <div key={`section-${index}`} className="ad-menu-section-title">
                  {item.label}
                </div>
              ) : <div key={`section-${index}`} className="ad-menu-section-divider"></div>;
            }
            return (
              <button
                key={item.id}
                className={`ad-nav-item ${item.active ? 'active' : ''} ${item.isHighlight ? 'highlight' : ''}`}
                onClick={() => handleNavigation(item)}
                title={!isOpen ? item.label : ''}
              >
                <span className="ad-nav-icon">{item.icon}</span>
                {isOpen && <span className="ad-nav-label">{item.label}</span>}
                {item.badge !== null && (
                  <span className={`ad-nav-badge ${item.isHighlight ? 'new' : ''}`}>
                    {item.badge}
                  </span>
                )}
                {item.active && isOpen && <div className="ad-active-indicator"></div>}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="ad-sidebar-footer">
          <button className="ad-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {isOpen && <span>Sign Out</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;