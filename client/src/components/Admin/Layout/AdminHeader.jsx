import React, { useState, useEffect } from 'react';
import './AdminHeader.css';
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Search,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  LogOut,
  Sparkles
} from 'lucide-react';

const AdminHeader = ({ toggleSidebar, sidebarOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3); // Dummy data
  const [notifications, setNotifications] = useState([]); // Dummy data

  // Initialize dummy data on mount
  useEffect(() => {
    const loadData = async () => {
      // Dummy notifications data
      const dummyNotifications = [
        { notification_id: 1, message: 'New order #12345 placed', type: 'order', created_at: new Date().toISOString(), is_read: false },
        { notification_id: 2, message: 'Product "iPhone 15" is low in stock', type: 'system', created_at: new Date(Date.now() - 3600000).toISOString(), is_read: false },
        { notification_id: 3, message: 'New customer registered', type: 'user', created_at: new Date(Date.now() - 7200000).toISOString(), is_read: true },
        { notification_id: 4, message: 'Payment received for order #12340', type: 'payment', created_at: new Date(Date.now() - 10800000).toISOString(), is_read: false },
        { notification_id: 5, message: 'Delivery person assigned to order #12342', type: 'system', created_at: new Date(Date.now() - 14400000).toISOString(), is_read: true },
      ];
      setNotifications(dummyNotifications);
    };

    loadData();
  }, []);

  // Check for saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('admin-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('admin-theme', 'light');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setSearchQuery('');
    }
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map(notif => ({ ...notif, is_read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
  };

  const getAvatarUrl = () => {
    return 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff&size=128&bold=true';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    window.location.href = '/login';
  };

  return (
    <header className="ad-header">
      <div className="ad-header-content">
        {/* Left: Menu & Logo */}
        <div className="ad-header-left">
          <button
            className="ad-menu-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            <Menu size={22} strokeWidth={2.5} />
          </button>

          <div className="ad-logo">
            <div className="ad-logo-icon">
              <Sparkles size={20} fill="currentColor" />
            </div>
            <h1>Nexora <span>Admin</span></h1>
          </div>
        </div>

        {/* Center: Search */}
        <div className="ad-header-center">
          <div className={`ad-search-container ${showSearch ? 'mobile-active' : ''}`}>
            <span className="ad-search-icon">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="ad-search-input"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="ad-search-shortcut">⌘K</div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="ad-header-right">
          <button
            className="ad-icon-btn mobile-search-trigger"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search size={20} />
          </button>

          <button
            className="ad-icon-btn theme-btn"
            onClick={toggleDarkMode}
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="ad-action-wrapper">
            <button
              className={`ad-icon-btn ${showNotifications ? 'active' : ''}`}
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="ad-badge">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="ad-dropdown ad-notif-dropdown">
                <div className="ad-dropdown-header">
                  <h3>Notifications</h3>
                  <div className="ad-header-actions">
                    <button onClick={handleMarkAllAsRead} disabled={unreadCount === 0} className="ad-link-btn">
                      Mark all read
                    </button>
                    <button className="ad-close-btn" onClick={() => setShowNotifications(false)}>×</button>
                  </div>
                </div>

                <div className="ad-dropdown-body">
                  {notifications.length === 0 ? (
                    <div className="ad-empty-state">No notifications</div>
                  ) : (
                    notifications.slice(0, 5).map(notif => (
                      <div key={notif.notification_id} className={`ad-notif-item ${!notif.is_read ? 'unread' : ''}`}>
                        <div className="ad-notif-icon">
                          {notif.type === 'order' && '🛒'}
                          {notif.type === 'payment' && '💰'}
                          {notif.type === 'user' && '👤'}
                          {notif.type === 'system' && '🔔'}
                        </div>
                        <div className="ad-notif-content">
                          <p>{notif.message}</p>
                          <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="ad-dropdown-footer">
                  <button className="ad-view-all" onClick={() => window.location.href = '/admin/notifications'}>
                    View All Activity
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="ad-user-wrapper">
            <button
              className={`ad-user-btn ${showUserMenu ? 'active' : ''}`}
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
            >
              <img src={getAvatarUrl()} alt="Admin" className="ad-avatar" />
              <div className="ad-user-info">
                <span className="ad-name">Admin User</span>
                <ChevronDown size={14} className={`ad-chevron ${showUserMenu ? 'rotate' : ''}`} />
              </div>
            </button>

            {showUserMenu && (
              <div className="ad-dropdown ad-user-dropdown">
                <div className="ad-user-header">
                  <img src={getAvatarUrl()} alt="Admin" />
                  <div>
                    <h4>Admin User</h4>
                    <span>admin@nexora.com</span>
                  </div>
                </div>
                <div className="ad-dropdown-list">
                  <button onClick={() => window.location.href = '/admin/profile'}>
                    <User size={16} /> My Profile
                  </button>
                  <button onClick={() => window.location.href = '/admin/settings'}>
                    <Settings size={16} /> Settings
                  </button>
                  <button onClick={() => window.location.href = '/admin/help'}>
                    <HelpCircle size={16} /> Help Center
                  </button>
                  <div className="ad-divider"></div>
                  <button className="logout" onClick={handleLogout}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backdrop for dropdowns */}
        {(showNotifications || showUserMenu) && (
          <div className="ad-backdrop" onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }} />
        )}
      </div>
    </header>
  );
};

export default AdminHeader;