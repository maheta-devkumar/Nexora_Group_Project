import React, { useState, useEffect } from 'react';
import { useInventoryContext } from '../context/InventoryContext';

const Example = () => {
  const {
    // State
    companies,
    currentCompany,
    purchases,
    currentPurchase,
    purchaseReturns,
    currentPurchaseReturn,
    stockMovements,
    stockSummary,
    variantMovements,
    suppliers,
    currentSupplier,
    batches,
    currentBatch,
    loading,
    error,
    
    // Company Functions
    fetchCompanies,
    fetchCompanyById,
    createCompany,
    updateCompany,
    deleteCompany,
    
    // Purchase Functions
    fetchPurchases,
    fetchPurchaseById,
    createPurchase,
    updatePurchaseStatus,
    
    // Purchase Return Functions
    fetchPurchaseReturns,
    fetchPurchaseReturnById,
    createPurchaseReturn,
    updatePurchaseReturnStatus,
    
    // Stock Functions
    fetchStockMovements,
    fetchStockSummary,
    adjustStock,
    fetchVariantMovements,
    
    // Supplier Functions
    fetchSuppliers,
    fetchSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Batch Functions
    fetchBatches,
    fetchBatchById,
    createBatch,
    updateBatch,
    
    // Utility Functions
    clearError,
    clearCurrentData
  } = useInventoryContext();

  // Test state
  const [testResults, setTestResults] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [testInputs, setTestInputs] = useState({
    companyId: '',
    purchaseId: '',
    returnId: '',
    variantId: '',
    supplierId: '',
    batchId: '',
    status: 'completed'
  });

  // Form data states
  const [newCompany, setNewCompany] = useState({
    company_name: 'Test Company',
    contact_email: 'test@example.com',
    phone: '+1234567890',
    address: '123 Test Street'
  });

  const [newPurchase, setNewPurchase] = useState({
    supplier_id: '',
    company_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    total_amount: 1000,
    items: JSON.stringify([
      {
        variant_id: 1,
        quantity: 10,
        unit_price: 100,
        total_price: 1000
      }
    ])
  });

  const [newPurchaseReturn, setNewPurchaseReturn] = useState({
    purchase_id: '',
    return_date: new Date().toISOString().split('T')[0],
    reason: 'Damaged goods',
    items: JSON.stringify([
      {
        purchase_item_id: 1,
        quantity_returned: 2,
        reason: 'Damaged'
      }
    ])
  });

  const [newSupplier, setNewSupplier] = useState({
    supplier_name: 'Test Supplier',
    contact_email: 'supplier@example.com',
    phone: '+9876543210',
    address: '456 Supplier Ave'
  });

  const [newBatch, setNewBatch] = useState({
    variant_id: 1,
    batch_number: 'BATCH-' + Date.now(),
    manufacturing_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantity: 100
  });

  const [stockAdjustment, setStockAdjustment] = useState({
    variant_id: 1,
    adjustment_quantity: 10,
    adjustment_type: 'add',
    reason: 'Test adjustment',
    notes: 'Testing stock adjustment'
  });

  // Initialize with sample data
  useEffect(() => {
    const initializeData = async () => {
      await fetchCompanies();
      await fetchPurchases();
      await fetchPurchaseReturns();
      await fetchStockMovements();
      await fetchStockSummary();
      await fetchSuppliers();
      await fetchBatches();
    };
    
    initializeData();
  }, []);

  // Test all endpoints
  const runAllTests = async () => {
    const results = {};
    
    try {
      // Test Companies
      results.companies = await fetchCompanies();
      if (companies.length > 0) {
        results.companyById = await fetchCompanyById(companies[0].company_id);
      }
      
      // Test Suppliers
      results.suppliers = await fetchSuppliers();
      if (suppliers.length > 0) {
        results.supplierById = await fetchSupplierById(suppliers[0].supplier_id);
      }
      
      // Test Purchases
      results.purchases = await fetchPurchases();
      if (purchases.length > 0) {
        results.purchaseById = await fetchPurchaseById(purchases[0].purchase_id);
      }
      
      // Test Purchase Returns
      results.purchaseReturns = await fetchPurchaseReturns();
      if (purchaseReturns.length > 0) {
        results.purchaseReturnById = await fetchPurchaseReturnById(purchaseReturns[0].return_id);
      }
      
      // Test Stock
      results.stockMovements = await fetchStockMovements();
      results.stockSummary = await fetchStockSummary();
      
      // Test Batches
      results.batches = await fetchBatches();
      if (batches.length > 0) {
        results.batchById = await fetchBatchById(batches[0].batch_id);
      }
      
      setTestResults(results);
      alert('All tests completed! Check the console for details.');
      
    } catch (error) {
      console.error('Test failed:', error);
      alert('Some tests failed. Check console for errors.');
    }
  };

  // Handle input changes
  const handleInputChange = (category, field, value) => {
    setTestInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form changes
  const handleFormChange = (form, field, value) => {
    switch(form) {
      case 'company':
        setNewCompany(prev => ({ ...prev, [field]: value }));
        break;
      case 'purchase':
        setNewPurchase(prev => ({ ...prev, [field]: value }));
        break;
      case 'purchaseReturn':
        setNewPurchaseReturn(prev => ({ ...prev, [field]: value }));
        break;
      case 'supplier':
        setNewSupplier(prev => ({ ...prev, [field]: value }));
        break;
      case 'batch':
        setNewBatch(prev => ({ ...prev, [field]: value }));
        break;
      case 'stock':
        setStockAdjustment(prev => ({ ...prev, [field]: value }));
        break;
    }
  };

  // Create test functions
  const testCreateCompany = async () => {
    const result = await createCompany(newCompany);
    if (result.success) {
      alert('Company created successfully!');
    }
  };

  const testCreatePurchase = async () => {
    const result = await createPurchase(newPurchase);
    if (result.success) {
      alert('Purchase created successfully!');
    }
  };

  const testCreatePurchaseReturn = async () => {
    const result = await createPurchaseReturn(newPurchaseReturn);
    if (result.success) {
      alert('Purchase return created successfully!');
    }
  };

  const testCreateSupplier = async () => {
    const result = await createSupplier(newSupplier);
    if (result.success) {
      alert('Supplier created successfully!');
    }
  };

  const testCreateBatch = async () => {
    const result = await createBatch(newBatch);
    if (result.success) {
      alert('Batch created successfully!');
    }
  };

  const testAdjustStock = async () => {
    const userId = 1; // Assuming user ID 1 for testing
    const result = await adjustStock(stockAdjustment, userId);
    if (result.success) {
      alert('Stock adjusted successfully!');
    }
  };

  const testUpdateStatus = async (type, id) => {
    if (type === 'purchase' && id) {
      await updatePurchaseStatus(id, testInputs.status);
    } else if (type === 'return' && id) {
      await updatePurchaseReturnStatus(id, testInputs.status);
    }
  };

  const testDelete = async (type, id) => {
    if (type === 'company' && id) {
      await deleteCompany(id);
    } else if (type === 'supplier' && id) {
      await deleteSupplier(id);
    }
  };

  // Render data in a table
  const renderDataTable = (data, title) => {
    if (!data || data.length === 0) {
      return <p>No data available</p>;
    }

    const headers = Object.keys(data[0]);
    
    return (
      <div style={{ marginBottom: '20px' }}>
        <h3>{title} ({data.length})</h3>
        <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                {headers.map(header => (
                  <th key={header} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>
                    {header.replace(/_/g, ' ').toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                  {headers.map(header => (
                    <td key={header} style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {typeof item[header] === 'object' 
                        ? JSON.stringify(item[header])
                        : String(item[header])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Styles
  const containerStyle = {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  };

  const tabContainerStyle = {
    display: 'flex',
    marginBottom: '20px',
    borderBottom: '2px solid #e0e0e0'
  };

  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: isActive ? '3px solid #667eea' : 'none',
    fontWeight: isActive ? 'bold' : 'normal',
    color: isActive ? '#667eea' : '#666'
  });

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0'
  };

  const buttonStyle = {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
    marginBottom: '10px'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f44336'
  };

  const successButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4CAF50'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333'
  };

  const sectionStyle = {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  };

  const errorStyle = {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '10px',
    border: '1px solid #ffcdd2'
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '20px',
    color: '#666'
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1>🏭 Inventory Context Tester</h1>
        <p>Test all inventory management endpoints and functions</p>
      </header>

      {error && (
        <div style={errorStyle}>
          <strong>Error:</strong> {error}
          <button 
            onClick={clearError}
            style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && (
        <div style={loadingStyle}>
          <p>Loading...</p>
        </div>
      )}

      <div style={tabContainerStyle}>
        {['overview', 'companies', 'purchases', 'returns', 'stock', 'suppliers', 'batches', 'test'].map(tab => (
          <div
            key={tab}
            style={tabStyle(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={cardStyle}>
          <h2>📊 System Overview</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={sectionStyle}>
              <h3>🏭 Companies</h3>
              <p><strong>Count:</strong> {companies.length}</p>
              <button style={buttonStyle} onClick={() => fetchCompanies()}>
                Refresh Companies
              </button>
            </div>

            <div style={sectionStyle}>
              <h3>📦 Purchases</h3>
              <p><strong>Count:</strong> {purchases.length}</p>
              <button style={buttonStyle} onClick={() => fetchPurchases()}>
                Refresh Purchases
              </button>
            </div>

            <div style={sectionStyle}>
              <h3>🔄 Purchase Returns</h3>
              <p><strong>Count:</strong> {purchaseReturns.length}</p>
              <button style={buttonStyle} onClick={() => fetchPurchaseReturns()}>
                Refresh Returns
              </button>
            </div>

            <div style={sectionStyle}>
              <h3>📊 Stock</h3>
              <p><strong>Movements:</strong> {stockMovements.length}</p>
              <p><strong>Summary Items:</strong> {stockSummary.length}</p>
              <button style={buttonStyle} onClick={() => fetchStockSummary()}>
                Refresh Stock
              </button>
            </div>

            <div style={sectionStyle}>
              <h3>🏢 Suppliers</h3>
              <p><strong>Count:</strong> {suppliers.length}</p>
              <button style={buttonStyle} onClick={() => fetchSuppliers()}>
                Refresh Suppliers
              </button>
            </div>

            <div style={sectionStyle}>
              <h3>🏷️ Batches</h3>
              <p><strong>Count:</strong> {batches.length}</p>
              <button style={buttonStyle} onClick={() => fetchBatches()}>
                Refresh Batches
              </button>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button 
              style={{ ...buttonStyle, backgroundColor: '#4CAF50' }} 
              onClick={runAllTests}
            >
              🚀 Run All Tests
            </button>
            
            <button 
              style={{ ...buttonStyle, backgroundColor: '#FF9800' }} 
              onClick={clearCurrentData}
            >
              🧹 Clear All Current Data
            </button>
          </div>
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div style={cardStyle}>
          <h2>🏭 Company Management</h2>
          
          {renderDataTable(companies, 'Companies')}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <h3>Create Company</h3>
              {Object.keys(newCompany).map(field => (
                <div key={field}>
                  <label style={labelStyle}>
                    {field.replace(/_/g, ' ')}:
                  </label>
                  <input
                    type="text"
                    value={newCompany[field]}
                    onChange={(e) => handleFormChange('company', field, e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ))}
              <button style={successButtonStyle} onClick={testCreateCompany}>
                Create Company
              </button>
            </div>

            <div>
              <h3>Test Company Operations</h3>
              <div>
                <label style={labelStyle}>Company ID:</label>
                <input
                  type="text"
                  value={testInputs.companyId}
                  onChange={(e) => handleInputChange('company', 'companyId', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter company ID"
                />
              </div>
              
              <button style={buttonStyle} onClick={() => fetchCompanyById(testInputs.companyId)}>
                Fetch Company by ID
              </button>
              
              <button style={dangerButtonStyle} onClick={() => testDelete('company', testInputs.companyId)}>
                Delete Company
              </button>
              
              {currentCompany && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                  <h4>Current Company:</h4>
                  <pre>{JSON.stringify(currentCompany, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div style={cardStyle}>
          <h2>📦 Purchase Management</h2>
          
          {renderDataTable(purchases, 'Purchases')}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <h3>Create Purchase</h3>
              {Object.keys(newPurchase).map(field => (
                <div key={field}>
                  <label style={labelStyle}>
                    {field.replace(/_/g, ' ')}:
                  </label>
                  <input
                    type={field.includes('date') ? 'date' : 'text'}
                    value={newPurchase[field]}
                    onChange={(e) => handleFormChange('purchase', field, e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ))}
              <button style={successButtonStyle} onClick={testCreatePurchase}>
                Create Purchase
              </button>
            </div>

            <div>
              <h3>Test Purchase Operations</h3>
              <div>
                <label style={labelStyle}>Purchase ID:</label>
                <input
                  type="text"
                  value={testInputs.purchaseId}
                  onChange={(e) => handleInputChange('purchase', 'purchaseId', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter purchase ID"
                />
                
                <label style={labelStyle}>Status:</label>
                <select
                  value={testInputs.status}
                  onChange={(e) => handleInputChange('purchase', 'status', e.target.value)}
                  style={inputStyle}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <button style={buttonStyle} onClick={() => fetchPurchaseById(testInputs.purchaseId)}>
                Fetch Purchase by ID
              </button>
              
              <button style={buttonStyle} onClick={() => testUpdateStatus('purchase', testInputs.purchaseId)}>
                Update Status
              </button>
              
              {currentPurchase && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                  <h4>Current Purchase:</h4>
                  <pre>{JSON.stringify(currentPurchase, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Returns Tab */}
      {activeTab === 'returns' && (
        <div style={cardStyle}>
          <h2>🔄 Purchase Return Management</h2>
          
          {renderDataTable(purchaseReturns, 'Purchase Returns')}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <h3>Create Purchase Return</h3>
              {Object.keys(newPurchaseReturn).map(field => (
                <div key={field}>
                  <label style={labelStyle}>
                    {field.replace(/_/g, ' ')}:
                  </label>
                  <input
                    type={field.includes('date') ? 'date' : 'text'}
                    value={newPurchaseReturn[field]}
                    onChange={(e) => handleFormChange('purchaseReturn', field, e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ))}
              <button style={successButtonStyle} onClick={testCreatePurchaseReturn}>
                Create Purchase Return
              </button>
            </div>

            <div>
              <h3>Test Return Operations</h3>
              <div>
                <label style={labelStyle}>Return ID:</label>
                <input
                  type="text"
                  value={testInputs.returnId}
                  onChange={(e) => handleInputChange('return', 'returnId', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter return ID"
                />
              </div>
              
              <button style={buttonStyle} onClick={() => fetchPurchaseReturnById(testInputs.returnId)}>
                Fetch Return by ID
              </button>
              
              <button style={buttonStyle} onClick={() => testUpdateStatus('return', testInputs.returnId)}>
                Update Status
              </button>
              
              {currentPurchaseReturn && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
                  <h4>Current Purchase Return:</h4>
                  <pre>{JSON.stringify(currentPurchaseReturn, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock Tab */}
      {activeTab === 'stock' && (
        <div style={cardStyle}>
          <h2>📊 Stock Management</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              {renderDataTable(stockMovements, 'Stock Movements')}
            </div>
            <div>
              {renderDataTable(stockSummary, 'Stock Summary')}
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <h3>Adjust Stock</h3>
              {Object.keys(stockAdjustment).map(field => (
                <div key={field}>
                  <label style={labelStyle}>
                    {field.replace(/_/g, ' ')}:
                  </label>
                  {field === 'adjustment_type' ? (
                    <select
                      value={stockAdjustment[field]}
                      onChange={(e) => handleFormChange('stock', field, e.target.value)}
                      style={inputStyle}
                    >
                      <option value="add">Add</option>
                      <option value="remove">Remove</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={stockAdjustment[field]}
                      onChange={(e) => handleFormChange('stock', field, e.target.value)}
                      style={inputStyle}
                    />
                  )}
                </div>
              ))}
              <button style={successButtonStyle} onClick={testAdjustStock}>
                Adjust Stock
              </button>
            </div>

            <div>
              <h3>Test Stock Operations</h3>
              <div>
                <label style={labelStyle}>Variant ID:</label>
                <input
                  type="text"
                  value={testInputs.variantId}
                  onChange={(e) => handleInputChange('stock', 'variantId', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter variant ID"
                />
              </div>
              
              <button style={buttonStyle} onClick={() => fetchVariantMovements(testInputs.variantId)}>
                Fetch Variant Movements
              </button>
              
              {variantMovements.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4>Variant Movements:</h4>
                  {renderDataTable(variantMovements, '')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div style={cardStyle}>
          <h2>🏢 Supplier Management</h2>
          
          {renderDataTable(suppliers, 'Suppliers')}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <h3>Create Supplier</h3>
              {Object.keys(newSupplier).map(field => (
                <div key={field}>
                  <label style={labelStyle}>
                    {field.replace(/_/g, ' ')}:
                  </label>
                  <input
                    type="text"
                    value={newSupplier[field]}
                    onChange={(e) => handleFormChange('supplier', field, e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ))}
              <button style={successButtonStyle} onClick={testCreateSupplier}>
                Create Supplier
              </button>
            </div>

            <div>
              <h3>Test Supplier Operations</h3>
              <div>
                <label style={labelStyle}>Supplier ID:</label>
                <input
                  type="text"
                  value={testInputs.supplierId}
                  onChange={(e) => handleInputChange('supplier', 'supplierId', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter supplier ID"
                />
              </div>
              
              <button style={buttonStyle} onClick={() => fetchSupplierById(testInputs.supplierId)}>
                Fetch Supplier by ID
              </button>
              
              <button style={dangerButtonStyle} onClick={() => testDelete('supplier', testInputs.supplierId)}>
                Delete Supplier
              </button>
              
              {currentSupplier && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '4px' }}>
                  <h4>Current Supplier:</h4>
                  <pre>{JSON.stringify(currentSupplier, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batches Tab */}
      {activeTab === 'batches' && (
        <div style={cardStyle}>
          <h2>🏷️ Batch Management</h2>
          
          {renderDataTable(batches, 'Batches')}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <h3>Create Batch</h3>
              {Object.keys(newBatch).map(field => (
                <div key={field}>
                  <label style={labelStyle}>
                    {field.replace(/_/g, ' ')}:
                  </label>
                  <input
                    type={field.includes('date') ? 'date' : 'text'}
                    value={newBatch[field]}
                    onChange={(e) => handleFormChange('batch', field, e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ))}
              <button style={successButtonStyle} onClick={testCreateBatch}>
                Create Batch
              </button>
            </div>

            <div>
              <h3>Test Batch Operations</h3>
              <div>
                <label style={labelStyle}>Batch ID:</label>
                <input
                  type="text"
                  value={testInputs.batchId}
                  onChange={(e) => handleInputChange('batch', 'batchId', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter batch ID"
                />
              </div>
              
              <button style={buttonStyle} onClick={() => fetchBatchById(testInputs.batchId)}>
                Fetch Batch by ID
              </button>
              
              {currentBatch && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e0f7fa', borderRadius: '4px' }}>
                  <h4>Current Batch:</h4>
                  <pre>{JSON.stringify(currentBatch, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Results Tab */}
      {activeTab === 'test' && (
        <div style={cardStyle}>
          <h2>🧪 Test Results</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <button style={buttonStyle} onClick={runAllTests}>
              Run Complete Test Suite
            </button>
          </div>
          
          {Object.keys(testResults).length > 0 && (
            <div>
              <h3>Last Test Results:</h3>
              <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <pre>{JSON.stringify(testResults, null, 2)}</pre>
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '20px' }}>
            <h3>API Response Status:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                <strong>Companies:</strong> {companies.length > 0 ? '✅' : '❌'}
              </div>
              <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                <strong>Purchases:</strong> {purchases.length > 0 ? '✅' : '❌'}
              </div>
              <div style={{ padding: '10px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
                <strong>Returns:</strong> {purchaseReturns.length > 0 ? '✅' : '❌'}
              </div>
              <div style={{ padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '4px' }}>
                <strong>Suppliers:</strong> {suppliers.length > 0 ? '✅' : '❌'}
              </div>
              <div style={{ padding: '10px', backgroundColor: '#e0f7fa', borderRadius: '4px' }}>
                <strong>Batches:</strong> {batches.length > 0 ? '✅' : '❌'}
              </div>
              <div style={{ padding: '10px', backgroundColor: '#fce4ec', borderRadius: '4px' }}>
                <strong>Stock:</strong> {stockSummary.length > 0 ? '✅' : '❌'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Example;