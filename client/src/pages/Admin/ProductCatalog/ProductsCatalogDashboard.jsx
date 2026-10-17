import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useProductContext } from '../../../context/ProductContext';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout';
import './ProductsCatalogDashboard.css';

const ProductsCatalogDashboard = ({ children }) => { // ✅ Add children prop
    const location = useLocation();
    const navigate = useNavigate();
    const { stats } = useProductContext();
    const [activeTab, setActiveTab] = useState('products');

    // Determine which catalog page we're on
    const isProductsPage = location.pathname.startsWith('/admin/products');
    const isCategoriesPage = location.pathname.startsWith('/admin/categories');
    const isBrandsPage = location.pathname.startsWith('/admin/brands');
    const isAttributesPage = location.pathname.startsWith('/admin/attributes');

    // Check if we're on the main catalog dashboard
    const isCatalogDashboard = location.pathname === '/admin/product-catalog';

    // Navigation items for ALL catalog pages
    const navItems = [
        {
            id: 'products',
            label: 'Products',
            path: '/admin/products',
            icon: '📦',
            count: stats?.total_products || 0,
            exact: false
        },
        {
            id: 'categories',
            label: 'Categories',
            path: '/admin/categories',
            icon: '📁',
            count: stats?.total_categories || 0
        },
        {
            id: 'brands',
            label: 'Brands',
            path: '/admin/brands',
            icon: '🏷️',
            count: stats?.total_brands || 0
        },
        {
            id: 'attributes',
            label: 'Attributes',
            path: '/admin/attributes',
            icon: '⚙️',
            count: stats?.total_attributes || 0
        }
    ];

    // Update active tab based on current URL
    useEffect(() => {
        if (isProductsPage) setActiveTab('products');
        else if (isCategoriesPage) setActiveTab('categories');
        else if (isBrandsPage) setActiveTab('brands');
        else if (isAttributesPage) setActiveTab('attributes');
        else if (isCatalogDashboard) setActiveTab('products'); // Default to products on catalog dashboard
    }, [location.pathname, isProductsPage, isCategoriesPage, isBrandsPage, isAttributesPage, isCatalogDashboard]);

    // Get title and subtitle based on current page
    const getHeaderInfo = () => {
        if (isProductsPage) return {
            title: 'Product Management',
            subtitle: 'Manage all products, variants, and inventory'
        };
        if (isCategoriesPage) return {
            title: 'Category Management',
            subtitle: 'Manage product categories and subcategories'
        };
        if (isBrandsPage) return {
            title: 'Brand Management',
            subtitle: 'Manage product brands and manufacturers'
        };
        if (isAttributesPage) return {
            title: 'Attribute Management',
            subtitle: 'Manage product attributes and specifications'
        };
        return {
            title: 'Product Catalog',
            subtitle: 'Manage products, categories, brands, and attributes'
        };
    };

    const headerInfo = getHeaderInfo();

    // Only show dashboard for catalog pages, not individual item details
    const shouldShowDashboard = !location.pathname.match(/\/admin\/(products|categories|brands|attributes)\/\d+/);

    return (
        <AdminLayout>
            <div className="admin-catalog-dashboard-page">
                {/* Header with stats - Show on ALL catalog pages except details pages */}
                {shouldShowDashboard && (
                    <div className="admin-catalog-header">
                        <div className="admin-catalog-header-content">
                            <h1 className="admin-catalog-title">{headerInfo.title}</h1>
                            <p className="admin-catalog-subtitle">{headerInfo.subtitle}</p>
                        </div>
                        <div className="admin-catalog-stats">
                            <div className="admin-stat-card">
                                <div className="admin-stat-icon">📦</div>
                                <div className="admin-stat-info">
                                    <span className="admin-stat-label">Total Products</span>
                                    <span className="admin-stat-value">{stats?.total_products || 0}</span>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="admin-stat-icon">📁</div>
                                <div className="admin-stat-info">
                                    <span className="admin-stat-label">Categories</span>
                                    <span className="admin-stat-value">{stats?.total_categories || 0}</span>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="admin-stat-icon">🏷️</div>
                                <div className="admin-stat-info">
                                    <span className="admin-stat-label">Brands</span>
                                    <span className="admin-stat-value">{stats?.total_brands || 0}</span>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="admin-stat-icon">⚙️</div>
                                <div className="admin-stat-info">
                                    <span className="admin-stat-label">Attributes</span>
                                    <span className="admin-stat-value">{stats?.total_attributes || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top navigation - Show on ALL catalog pages except details pages */}
                {shouldShowDashboard && (
                    <div className="admin-catalog-nav">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                end={item.exact}
                                className={({ isActive }) =>
                                    `admin-catalog-nav-link ${isActive || activeTab === item.id ? 'active' : ''}`
                                }
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                                {item.count > 0 && (
                                    <span className="nav-badge">{item.count}</span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                )}

                {/* Content area */}
                <div className="admin-catalog-content">
                    {isCatalogDashboard ? (
                        // Catalog dashboard welcome content
                        <div className="admin-dashboard-welcome">
                            <h2>Product Catalog Dashboard</h2>
                            <p>Use the navigation above to manage different aspects of your product catalog.</p>

                            <div className="admin-quick-actions">
                                <h3>Quick Actions</h3>
                                <div className="admin-quick-actions-grid">
                                    <button
                                        className="admin-quick-action-btn"
                                        onClick={() => navigate('/admin/products')}
                                    >
                                        <span className="action-icon">📦</span>
                                        <span className="action-label">Manage Products</span>
                                    </button>
                                    <button
                                        className="admin-quick-action-btn"
                                        onClick={() => navigate('/admin/categories')}
                                    >
                                        <span className="action-icon">📁</span>
                                        <span className="action-label">Manage Categories</span>
                                    </button>
                                    <button
                                        className="admin-quick-action-btn"
                                        onClick={() => navigate('/admin/brands')}
                                    >
                                        <span className="action-icon">🏷️</span>
                                        <span className="action-label">Manage Brands</span>
                                    </button>
                                </div>
                            </div>

                            <div className="admin-dashboard-grid">
                                {navItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="admin-dashboard-card"
                                        onClick={() => navigate(item.path)}
                                    >
                                        <div className="admin-card-icon">{item.icon}</div>
                                        <h3 className="admin-card-title">{item.label}</h3>
                                        <p className="admin-card-count">{item.count} items</p>
                                        <button className="admin-card-action">Manage →</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // ✅ Render children if provided, otherwise Outlet for backward compatibility
                        children || <Outlet />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default ProductsCatalogDashboard;