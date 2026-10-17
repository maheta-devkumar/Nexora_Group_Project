import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Admin Context Providers
import { DashboardProvider } from '../../context/admin/DashboardContext';
import { ProductProvider } from '../../context/ProductContext';
import { CategoryProvider } from '../../context/CategoryContext';
import { BrandProvider } from '../../context/BrandContext';
import { AttributeProvider } from '../../context/AttributeContext';
import { ProductReviewProvider } from '../../context/ProductReviewContext';
import { MediaProvider } from '../../context/MediaContext';
import { VariantProvider } from '../../context/VariantContext';
import { CustomerProvider } from '../../context/CustomerContext';
import { OrderAdminProvider } from '../../context/OrderAdminContext';
import { MarketingProvider } from '../../context/MarketingContext';
import { DeliveryProvider } from '../../context/DeliveryContext';
import { InventoryProvider } from '../../context/InventoryContext';
import { AnalyticsProvider } from '../../context/AnalyticsContext';
import { NotificationAdminProvider } from '../../context/NotificationAdminContext';
import { ReportsProvider } from '../../context/ReportsContext';
import { SystemProvider } from '../../context/SystemContext';
import { ProfileProvider } from '../../context/ProfileContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { AdminPaymentProvider } from '../../context/AdminPaymentContext';
import { SettingsProvider } from '../../context/SettingsContext'; // Added here

// Import Error Boundary
import AdminErrorBoundary from '../../components/DeliveryPerson/Common/ErrorBoundary';


// Import all admin pages using lazy loading
const AdminDashboard = React.lazy(() => import('./Dashboard/Dashboard'));
const System = React.lazy(() => import('./System/System'));
const Reports = React.lazy(() => import('./Reports/Reports'));
// Reuse Dashboard for Analytics route logic if needed, or just redirect.
const Analytics = React.lazy(() => import('./Dashboard/Dashboard'));
const Inventory = React.lazy(() => import('./Inventory/Inventory'));

// AI Features
const AdminAI = React.lazy(() => import('./AdminAI'));

// Product Catalog
const ProductsCatalogDashboard = React.lazy(() => import('./ProductCatalog/ProductsCatalogDashboard'));

// Catalog content pages - Using your existing imports
const ProductsPage = React.lazy(() => import('./ProductCatalog/Products')); // Main products page WITH nested routes
const CategoriesPage = React.lazy(() => import('./ProductCatalog/Categories'));
const BrandsPage = React.lazy(() => import('./ProductCatalog/Brands'));
const AttributesPage = React.lazy(() => import('./ProductCatalog/Attributes'));

// Users Management
const CustomersPage = React.lazy(() => import('./Users/Customers/Customers'));
const CustomerDetails = React.lazy(() => import('../../components/Admin/Users/Customers/CustomerDetails'));
const CustomerForm = React.lazy(() => import('../../components/Admin/Users/Customers/CustomerForm'));
const DeliveryPersonsPage = React.lazy(() => import('./Users/DeliveryPersons/DeliveryPersons'));

// Orders Management - Unified Dashboard
const OrdersDashboard = React.lazy(() => import('./Orders/OrdersDashboard'));
const Orders = React.lazy(() => import('./Orders/Orders'));
const OrderDetails = React.lazy(() => import('./Orders/OrderDetails'));
const Returns = React.lazy(() => import('./Orders/Returns'));
const Refunds = React.lazy(() => import('./Orders/Refunds'));
const DeliveryManagement = React.lazy(() => import('./Orders/DeliveryManagement'));
const OrderAnalytics = React.lazy(() => import('./Orders/OrderAnalytics'));

// Other Admin Pages
const Delivery = React.lazy(() => import('./Delivery/Delivery'));
const Marketing = React.lazy(() => import('./Marketing/Marketing'));
const NotificationAdminPage = React.lazy(() => import('./Notification/Notification'));
const AdminProfile = React.lazy(() => import('../../components/Admin/Profile/AdminProfile'));
const MyNotifications = React.lazy(() => import('../../components/Admin/Notification/MyNotifications'));
const Payments = React.lazy(() => import('./Payments/Payments'));
const BulkExcelUpload = React.lazy(() => import('./BulkExcelUpload'));
const Settings = React.lazy(() => import('./Settings')); // Added here

// Create a Loading component
const LoadingFallback = () => (
  <div className="admin-loading">
    <div className="loading-spinner"></div>
    <p>Loading admin panel...</p>
  </div>
);

// Main AdminPanel Component
const AdminPanel = () => {
  return (
    <AdminErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Default route - redirect to dashboard */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Dashboard (Powered by Analytics) */}
          <Route
            path="dashboard"
            element={
              <AnalyticsProvider>
                <AdminDashboard />
              </AnalyticsProvider>
            }
          />

          {/* AI Features */}
          {/* AI Features */}
          <Route
            path="ai"
            element={
              <ReportsProvider>
                <AdminAI />
              </ReportsProvider>
            }
          />

          {/* System Management */}
          <Route
            path="system/*"
            element={
              <SystemProvider>
                <System />
              </SystemProvider>
            }
          />

          {/* Reports */}
          <Route
            path="reports"
            element={
              <ReportsProvider>
                <Reports />
              </ReportsProvider>
            }
          />

          {/* Analytics */}
          <Route
            path="analytics"
            element={
              <AnalyticsProvider>
                <Analytics />
              </AnalyticsProvider>
            }
          />

          {/* Inventory */}
          <Route
            path="inventory/*"
            element={
              <InventoryProvider>
                <Inventory />
              </InventoryProvider>
            }
          />

          {/* ============================================== */}
          {/* PRODUCT CATALOG DASHBOARD - Main catalog landing */}
          {/* ============================================== */}
          <Route
            path="product-catalog"
            element={
              <ProductProvider>
                <CategoryProvider>
                  <BrandProvider>
                    <ProductsCatalogDashboard />
                  </BrandProvider>
                </CategoryProvider>
              </ProductProvider>
            }
          />

          {/* ============================================== */}
          {/* PRODUCTS ROUTES - Uses ProductsCatalogDashboard */}
          {/* ============================================== */}
          <Route
            path="products/*"
            element={
              <ProductProvider>
                <CategoryProvider>
                  <BrandProvider>
                    <MediaProvider>
                      <ProductReviewProvider>
                        <ProductsCatalogDashboard>
                          {/* Pass ProductsPage as children - ProductsPage handles its own routing */}
                          <ProductsPage />
                        </ProductsCatalogDashboard>
                      </ProductReviewProvider>
                    </MediaProvider>
                  </BrandProvider>
                </CategoryProvider>
              </ProductProvider>
            }
          />

          {/* ============================================== */}
          {/* CATEGORIES ROUTES - Uses ProductsCatalogDashboard */}
          {/* ============================================== */}
          <Route
            path="categories/*"
            element={
              <CategoryProvider>
                <ProductsCatalogDashboard>
                  <CategoriesPage />
                </ProductsCatalogDashboard>
              </CategoryProvider>
            }
          />

          {/* ============================================== */}
          {/* BRANDS ROUTES - Uses ProductsCatalogDashboard */}
          {/* ============================================== */}
          <Route
            path="brands/*"
            element={
              <BrandProvider>
                <ProductsCatalogDashboard>
                  <BrandsPage />
                </ProductsCatalogDashboard>
              </BrandProvider>
            }
          />

          {/* ============================================== */}
          {/* ATTRIBUTES ROUTES - Uses ProductsCatalogDashboard */}
          {/* ============================================== */}
          <Route
            path="attributes/*"
            element={
              <AttributeProvider>
                <ProductsCatalogDashboard>
                  <AttributesPage />
                </ProductsCatalogDashboard>
              </AttributeProvider>
            }
          />

          {/* ============================================== */}
          {/* REDIRECT OLD ROUTES */}
          {/* ============================================== */}
          <Route path="product-catalog/products" element={<Navigate to="/admin/products" replace />} />
          <Route path="product-catalog/categories" element={<Navigate to="/admin/categories" replace />} />
          <Route path="product-catalog/brands" element={<Navigate to="/admin/brands" replace />} />
          <Route path="product-catalog/attributes" element={<Navigate to="/admin/attributes" replace />} />

          {/* ============================================== */}
          {/* CUSTOMERS MANAGEMENT */}
          {/* ============================================== */}
          <Route
            path="users/customers"
            element={
              <CustomerProvider>
                <CustomersPage />
              </CustomerProvider>
            }
          />

          <Route
            path="users/customers/:customerId"
            element={
              <CustomerProvider>
                <CustomerDetails />
              </CustomerProvider>
            }
          />

          <Route
            path="users/customers/edit/:customerId"
            element={
              <CustomerProvider>
                <CustomerForm mode="edit" />
              </CustomerProvider>
            }
          />

          <Route
            path="users/customers/create"
            element={
              <CustomerProvider>
                <CustomerForm mode="create" />
              </CustomerProvider>
            }
          />

          <Route
            path="users"
            element={
              <CustomerProvider>
                <CustomersPage />
              </CustomerProvider>
            }
          />

          <Route
            path="users/delivery-persons/*"
            element={
              <DeliveryPersonsPage />
            }
          />

          {/* ============================================== */}
          {/* ORDERS MANAGEMENT */}
          {/* ============================================== */}
          <Route
            path="orders"
            element={
              <OrderAdminProvider>
                <OrdersDashboard />
              </OrderAdminProvider>
            }
          >
            <Route index element={<Orders />} />
            <Route path=":orderId" element={<OrderDetails />} />
            <Route path="analytics" element={<OrderAnalytics />} />
            <Route path="returns" element={<Returns />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="delivery-management" element={<DeliveryManagement />} />

            <Route path="*" element={<Navigate to="" replace />} />
          </Route>

          {/* ============================================== */}
          {/* OTHER ADMIN PAGES */}
          {/* ============================================== */}
          <Route
            path="delivery"
            element={
              <DeliveryProvider>
                <OrderAdminProvider>
                  <Delivery />
                </OrderAdminProvider>
              </DeliveryProvider>
            }
          />

          <Route
            path="payments"
            element={
              <AdminPaymentProvider>
                <Payments />
              </AdminPaymentProvider>
            }
          />

          <Route
            path="bulk-upload"
            element={<BulkExcelUpload />}
          />

          <Route
            path="marketing"
            element={
              <MarketingProvider>
                <Marketing />
              </MarketingProvider>
            }
          />

          {/* Notifications Management (Admin sending notifications) */}
          <Route
            path="notifications"
            element={
              <NotificationAdminProvider>
                <NotificationAdminPage />
              </NotificationAdminProvider>
            }
          />

          {/* New: Personal Notifications (My Notifications) */}
          <Route
            path="notifications/me"
            element={
              <NotificationProvider>
                <MyNotifications />
              </NotificationProvider>
            }
          />

          <Route
            path="settings"
            element={
              <SettingsProvider>
                <Settings />
              </SettingsProvider>
            }
          />

          {/* New: Admin Profile */}
          <Route
            path="profile"
            element={
              <ProfileProvider>
                <AdminProfile />
              </ProfileProvider>
            }
          />

          {/* Catch-all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AdminErrorBoundary>
  );
};

// Add CSS for loading spinner
const styles = `
.admin-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9fafb;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.admin-loading p {
  color: #6b7280;
  font-size: 16px;
  font-weight: 500;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default AdminPanel;