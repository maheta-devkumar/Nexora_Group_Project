import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { InventoryProvider } from '../../../context/InventoryContext';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout';
// import Dashboard from '../../../components/Admin/Inventory/Dashboard'; // Removed as per request
import CompanyList from '../../../components/Admin/Inventory/CompanyList';
import CompanyForm from '../../../components/Admin/Inventory/CompanyForm';
import PurchaseList from '../../../components/Admin/Inventory/PurchaseList';
import PurchaseForm from '../../../components/Admin/Inventory/PurchaseForm';
import PurchaseStatus from '../../../components/Admin/Inventory/PurchaseStatus';
import ReturnList from '../../../components/Admin/Inventory/ReturnList';
import ReturnForm from '../../../components/Admin/Inventory/ReturnForm';
import StockSummary from '../../../components/Admin/Inventory/StockSummary';
import StockMovements from '../../../components/Admin/Inventory/StockMovements';
import StockAdjustment from '../../../components/Admin/Inventory/StockAdjustment';
import SupplierList from '../../../components/Admin/Inventory/SupplierList';
import SupplierForm from '../../../components/Admin/Inventory/SupplierForm';
import BatchList from '../../../components/Admin/Inventory/BatchList';
import BatchForm from '../../../components/Admin/Inventory/BatchForm';
import './Inventory.css';

// Removed 'dashboard' module
const modules = [
  { id: 'companies', label: 'Companies', icon: '🏭' },
  { id: 'purchases', label: 'Purchases', icon: '📦' },
  { id: 'returns', label: 'Returns', icon: '🔄' },
  { id: 'stock', label: 'Stock', icon: '📊' },
  { id: 'suppliers', label: 'Suppliers', icon: '🏢' },
  { id: 'batches', label: 'Batches', icon: '🏷️' }
];

const Inventory = () => {
  // Default to 'companies' since dashboard is gone
  const [activeModule, setActiveModule] = useState('companies');
  const [activeSubModule, setActiveSubModule] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const handleEditCompany = (company) => {
    setEditingItem(company);
    setActiveModule('companies');
    setActiveSubModule('form');
  };

  const handleEditSupplier = (supplier) => {
    setEditingItem(supplier);
    setActiveModule('suppliers');
    setActiveSubModule('form');
  };

  const handleEditBatch = (batch) => {
    setEditingItem(batch);
    setActiveModule('batches');
    setActiveSubModule('form');
  };

  const handleEditPurchase = (purchase) => {
    setEditingItem(purchase);
    setActiveModule('purchases');
    setActiveSubModule('form');
  };

  const handleUpdatePurchaseStatus = (purchase) => {
    setEditingItem(purchase);
    setActiveModule('purchases');
    setActiveSubModule('status');
  };

  const handleEditReturn = (returnItem) => {
    setEditingItem(returnItem);
    setActiveModule('returns');
    setActiveSubModule('form');
  };

  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
    setActiveSubModule('');
    setEditingItem(null);
  };

  const handleSubModuleClick = (subModuleId) => {
    setActiveSubModule(subModuleId);
    if (subModuleId === 'list' || subModuleId === 'summary') {
      setEditingItem(null);
    }
  };

  const handleCreateNew = (subModule) => {
    setEditingItem(null);
    setActiveSubModule(subModule);
  };

  const renderComponent = () => {
    switch (activeModule) {
      case 'companies':
        return activeSubModule === 'form' ? (
          <CompanyForm initialData={editingItem} onSuccess={() => setActiveSubModule('list')} />
        ) : (
          <CompanyList onEdit={handleEditCompany} />
        );

      case 'purchases':
        if (activeSubModule === 'form') return <PurchaseForm initialData={editingItem} onSuccess={() => setActiveSubModule('list')} />;
        if (activeSubModule === 'status') return <PurchaseStatus purchase={editingItem} onSuccess={() => setActiveSubModule('list')} />;
        return <PurchaseList onEdit={handleEditPurchase} onUpdateStatus={handleUpdatePurchaseStatus} />;

      case 'returns':
        return activeSubModule === 'form' ? (
          <ReturnForm initialData={editingItem} onSuccess={() => setActiveSubModule('list')} />
        ) : (
          <ReturnList onEdit={handleEditReturn} />
        );

      case 'stock':
        if (activeSubModule === 'movements') return <StockMovements />;
        if (activeSubModule === 'adjustment') return <StockAdjustment />;
        return <StockSummary />;

      case 'suppliers':
        return activeSubModule === 'form' ? (
          <SupplierForm initialData={editingItem} onSuccess={() => setActiveSubModule('list')} />
        ) : (
          <SupplierList onEdit={handleEditSupplier} />
        );

      case 'batches':
        return activeSubModule === 'form' ? (
          <BatchForm initialData={editingItem} onSuccess={() => setActiveSubModule('list')} />
        ) : (
          <BatchList onEdit={handleEditBatch} />
        );

      default:
        return <CompanyList onEdit={handleEditCompany} />;
    }
  };

  const getPageTitle = () => {
    const module = modules.find(m => m.id === activeModule);
    if (!module) return 'Inventory';

    if (activeSubModule) {
      switch (activeSubModule) {
        case 'list': return `${module.label} List`;
        case 'form': return editingItem ? `Edit ${module.label.slice(0, -1)}` : `Create ${module.label.slice(0, -1)}`;
        case 'status': return 'Update Purchase Status';
        case 'movements': return 'Stock Movements';
        case 'adjustment': return 'Stock Adjustment';
        default: return module.label;
      }
    }

    return module.label;
  };

  const getSubModules = () => {
    switch (activeModule) {
      case 'companies':
        return [
          { id: 'list', label: 'List' },
          { id: 'form', label: 'Create New' }
        ];
      case 'purchases':
        return [
          { id: 'list', label: 'List' },
          { id: 'form', label: 'Create New' },
          { id: 'status', label: 'Update Status' }
        ];
      case 'returns':
        return [
          { id: 'list', label: 'List' },
          { id: 'form', label: 'Create New' }
        ];
      case 'stock':
        return [
          { id: 'summary', label: 'Summary' },
          { id: 'movements', label: 'Movements' },
          { id: 'adjustment', label: 'Adjustment' }
        ];
      case 'suppliers':
        return [
          { id: 'list', label: 'List' },
          { id: 'form', label: 'Create New' }
        ];
      case 'batches':
        return [
          { id: 'list', label: 'List' },
          { id: 'form', label: 'Create New' }
        ];
      default:
        return [];
    }
  };

  return (
    <InventoryProvider>
      <AdminLayout>
        <div className="inventory-page-premium">
          <ToastContainer position="top-right" autoClose={3000} />

          {/* Top Navigation Bar - Sticky Module Nav */}
          <div className="inventory-top-nav">
            <div className="nav-brand">
              <span className="nav-icon-main">📦</span>
              <span className="nav-title-main">Inventory</span>
            </div>
            <div className="nav-modules">
              {modules.map(module => (
                <button
                  key={module.id}
                  className={`nav-module-btn ${activeModule === module.id ? 'active' : ''}`}
                  onClick={() => handleModuleClick(module.id)}
                >
                  <span className="btn-icon">{module.icon}</span>
                  {module.label}
                </button>
              ))}
            </div>
            <div className="nav-actions">
              <button
                className="nav-refresh-btn"
                onClick={() => window.location.reload()}
                title="Refresh"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="inventory-main-content">
            <div className="module-header-premium">
              <h1 className="module-page-title">
                {getPageTitle()}
              </h1>
              {getSubModules().length > 0 && (
                <div className="premium-tabs">
                  {getSubModules().map(sub => (
                    <button
                      key={sub.id}
                      className={`premium-tab ${activeSubModule === sub.id ? 'active' : ''}`}
                      onClick={() => sub.id === 'form' ? handleCreateNew('form') : handleSubModuleClick(sub.id)}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="premium-content-body">
              {renderComponent()}
            </div>
          </div>
        </div>
      </AdminLayout>
    </InventoryProvider>
  );
};

export default Inventory;