import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DeliverySidebar.css';
import { useAvailableDeliveriesContext } from '../../../context/delivery_panel/AvailableDeliveriesContext';
import { useNotification } from '../../../context/NotificationContext';

const DeliverySidebar = ({ isOpen, isMobile, closeSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Contexts
  const { availableDeliveries, loading, getDeliveryStats } = useAvailableDeliveriesContext();
  const { unreadCount } = useNotification();

  // Stats
  const deliveryStats = getDeliveryStats();
  const realTimeData = {
    availableDeliveries: deliveryStats.totalAvailable || 0,
    activeDeliveries: 0, // Placeholder
    pendingPickup: 0,    // Placeholder
    completed: 0,        // Placeholder
    earnings: 0,         // Placeholder
  };

  const [navItems, setNavItems] = useState([
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-th-large', path: '/delivery/dashboard', badge: null },
    { id: 'available', label: 'New Orders', icon: 'fas fa-box-open', path: '/delivery/available-deliveries', badge: loading ? 'fas fa-sync-alt fa-spin' : realTimeData.availableDeliveries, isHighlight: true },
    { id: 'active', label: 'Active Tasks', icon: 'fas fa-cube', path: '/delivery/active-deliveries', badge: null },
    { id: 'pickup', label: 'Pending Pickup', icon: 'fas fa-clock', path: '/delivery/pending-pickup', badge: null },
    { id: 'completed', label: 'History', icon: 'fas fa-check-circle', path: '/delivery/completed', badge: null },
    { id: 'earnings', label: 'My Earnings', icon: 'fas fa-wallet', path: '/delivery/earnings', badge: null },
    { id: 'performance', label: 'Performance', icon: 'fas fa-chart-line', path: '/delivery/performance', badge: null },
    { id: 'vehicle', label: 'Vehicle', icon: 'fas fa-motorcycle', path: '/delivery/vehicle', badge: null },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user', path: '/delivery/profile', badge: null },
    { id: 'notifications', label: 'Inbox', icon: 'fas fa-bell', path: '/delivery/notifications', badge: unreadCount > 0 ? unreadCount : null },
  ]);

  // Update active state
  useEffect(() => {
    const currentPath = location.pathname;
    setNavItems(prev => prev.map(item => ({
      ...item,
      active: currentPath === item.path || (item.path !== '/delivery/dashboard' && currentPath.startsWith(item.path)) || (item.path === '/delivery/dashboard' && currentPath === '/delivery')
    })));
  }, [location.pathname]);

  // Update badges
  useEffect(() => {
    setNavItems(prev => prev.map(item => {
      // For badges passed as numbers
      if (item.id === 'available') {
        // If loading, show spinner icon class, else number
        return { ...item, badge: loading ? 'fas fa-sync-alt fa-spin' : realTimeData.availableDeliveries };
      }
      if (item.id === 'notifications') return { ...item, badge: unreadCount > 0 ? unreadCount : null };
      return item;
    }));
  }, [realTimeData.availableDeliveries, loading, unreadCount]);

  const handleNavigation = (item) => {
    navigate(item.path);
    if (isMobile) closeSidebar();
  };

  return (
    <aside className={`nd-sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
      <div className="nd-sidebar-glass-effect"></div>

      <nav className="nd-sidebar-content">
        {/* Quick Action / Home */}


        {/* Main Menu */}
        <div className="nd-sidebar-menu">
          {isOpen && <h5 className="nd-menu-title">Main Menu</h5>}
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nd-nav-item ${item.active ? 'active' : ''} ${item.isHighlight ? 'highlight' : ''}`}
              onClick={() => handleNavigation(item)}
              title={!isOpen ? item.label : ''}
            >
              <span className="nd-nav-icon">
                <i className={item.icon}></i>
              </span>
              {isOpen && <span className="nd-nav-label">{item.label}</span>}
              {item.badge !== null && item.badge !== 0 && (
                <span className={`nd-nav-badge ${item.id === 'available' ? 'blue' : 'red'}`}>
                  {/* If badge is string and contains 'fa-', render icon, else render text */}
                  {String(item.badge).includes('fa-') ? <i className={item.badge}></i> : item.badge}
                </span>
              )}
              {item.active && isOpen && <div className="nd-active-indicator"></div>}
            </button>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="nd-sidebar-footer">
          <button className="nd-logout-btn" onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}>
            <i className="fas fa-sign-out-alt" style={{ fontSize: '20px' }}></i>
            {isOpen && <span>Log Out</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
};

// Spinner CSS via styles injection usually preferred in CSS file, but keeping inline for quick fix context if needed
// We will rely on CSS file for animations

export default DeliverySidebar;
