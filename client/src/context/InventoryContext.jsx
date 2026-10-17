import React, { createContext, useContext, useState, useCallback } from 'react';
import * as inventoryApi from '../api/inventory';

const InventoryContext = createContext();

export const useInventoryContext = () => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventoryContext must be used within InventoryProvider');
    }
    return context;
};

export const InventoryProvider = ({ children }) => {
    // Companies State
    const [companies, setCompanies] = useState([]);
    const [currentCompany, setCurrentCompany] = useState(null);

    // Purchases State
    const [purchases, setPurchases] = useState([]);
    const [currentPurchase, setCurrentPurchase] = useState(null);

    // Purchase Returns State
    const [purchaseReturns, setPurchaseReturns] = useState([]);
    const [currentPurchaseReturn, setCurrentPurchaseReturn] = useState(null);

    // Stock State
    const [stockMovements, setStockMovements] = useState([]);
    const [stockSummary, setStockSummary] = useState([]);
    const [variantMovements, setVariantMovements] = useState([]);

    // Suppliers State
    const [suppliers, setSuppliers] = useState([]);
    const [currentSupplier, setCurrentSupplier] = useState(null);

    // Batches State
    const [batches, setBatches] = useState([]);
    const [currentBatch, setCurrentBatch] = useState(null);

    // Common State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /* -----------------------------
       🏭 COMPANY FUNCTIONS
    ------------------------------ */

    // Fetch all companies
    const fetchCompanies = useCallback(async (skip = 0, limit = 100) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchAllCompanies(skip, limit);
            if (result.success) {
                setCompanies(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch companies';
            setError(errorMsg);
            console.error('Fetch companies error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAreas = useCallback(async (skip = 0, limit = 100) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchAllAreas(skip, limit);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch areas';
            setError(errorMsg);
            console.error('Fetch areas error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch company by ID
    const fetchCompanyById = useCallback(async (companyId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchCompanyById(companyId);
            if (result.success) {
                setCurrentCompany(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch company';
            setError(errorMsg);
            console.error('Fetch company error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create company
    const createCompany = useCallback(async (companyData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.createCompany(companyData);
            if (result.success) {
                setCompanies(prev => [...prev, result.data]);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to create company';
            setError(errorMsg);
            console.error('Create company error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update company
    const updateCompany = useCallback(async (companyId, updateData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.updateCompany(companyId, updateData);
            if (result.success) {
                setCompanies(prev => prev.map(company =>
                    company.company_id === companyId ? { ...company, ...result.data } : company
                ));
                if (currentCompany?.company_id === companyId) {
                    setCurrentCompany(prev => ({ ...prev, ...result.data }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update company';
            setError(errorMsg);
            console.error('Update company error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentCompany]);

    // Delete company
    const deleteCompany = useCallback(async (companyId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.deleteCompany(companyId);
            if (result.success) {
                setCompanies(prev => prev.filter(c => c.company_id !== companyId));
                if (currentCompany?.company_id === companyId) {
                    setCurrentCompany(null);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to delete company';
            setError(errorMsg);
            console.error('Delete company error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentCompany]);

    /* -----------------------------
       📦 PURCHASE FUNCTIONS
    ------------------------------ */

    // Fetch all purchases
    const fetchPurchases = useCallback(async (skip = 0, limit = 100) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchAllPurchases(skip, limit);
            if (result.success) {
                setPurchases(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch purchases';
            setError(errorMsg);
            console.error('Fetch purchases error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch purchase by ID
    const fetchPurchaseById = useCallback(async (purchaseId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchPurchaseById(purchaseId);
            if (result.success) {
                setCurrentPurchase(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch purchase';
            setError(errorMsg);
            console.error('Fetch purchase error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create purchase
    const createPurchase = useCallback(async (purchaseData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.createPurchase(purchaseData);
            if (result.success) {
                setPurchases(prev => [...prev, result.data]);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to create purchase';
            setError(errorMsg);
            console.error('Create purchase error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update purchase status
    const updatePurchaseStatus = useCallback(async (purchaseId, status) => {
        setLoading(true);
        setError(null);
        try {
            // Ensure ID is integer
            const id = parseInt(purchaseId, 10);
            const result = await inventoryApi.updatePurchaseStatus(id, status);
            if (result.success) {
                setPurchases(prev => prev.map(purchase =>
                    purchase.purchase_id === id ? { ...purchase, status } : purchase
                ));
                if (currentPurchase?.purchase_id === id) {
                    setCurrentPurchase(prev => ({ ...prev, status }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update purchase status';
            setError(errorMsg);
            console.error('Update purchase status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentPurchase]);

    /* -----------------------------
       🔄 PURCHASE RETURN FUNCTIONS
    ------------------------------ */

    // Fetch all purchase returns
    const fetchPurchaseReturns = useCallback(async (skip = 0, limit = 100) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchAllPurchaseReturns(skip, limit);
            if (result.success) {
                setPurchaseReturns(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch purchase returns';
            setError(errorMsg);
            console.error('Fetch purchase returns error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch purchase return by ID
    const fetchPurchaseReturnById = useCallback(async (returnId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchPurchaseReturnById(returnId);
            if (result.success) {
                setCurrentPurchaseReturn(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch purchase return';
            setError(errorMsg);
            console.error('Fetch purchase return error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create purchase return
    const createPurchaseReturn = useCallback(async (returnData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.createPurchaseReturn(returnData);
            if (result.success) {
                setPurchaseReturns(prev => [...prev, result.data]);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to create purchase return';
            setError(errorMsg);
            console.error('Create purchase return error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update purchase return status
    const updatePurchaseReturnStatus = useCallback(async (returnId, status) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.updatePurchaseReturnStatus(returnId, status);
            if (result.success) {
                setPurchaseReturns(prev => prev.map(purchaseReturn =>
                    purchaseReturn.return_id === returnId ? { ...purchaseReturn, status } : purchaseReturn
                ));
                if (currentPurchaseReturn?.return_id === returnId) {
                    setCurrentPurchaseReturn(prev => ({ ...prev, status }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update purchase return status';
            setError(errorMsg);
            console.error('Update purchase return status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentPurchaseReturn]);

    /* -----------------------------
       📊 STOCK FUNCTIONS
    ------------------------------ */

    // Fetch stock movements
    const fetchStockMovements = useCallback(async (skip = 0, limit = 100) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchStockMovements(skip, limit);
            if (result.success) {
                setStockMovements(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch stock movements';
            setError(errorMsg);
            console.error('Fetch stock movements error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch stock summary
    const fetchStockSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchStockSummary();
            if (result.success) {
                setStockSummary(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch stock summary';
            setError(errorMsg);
            console.error('Fetch stock summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Adjust stock
    const adjustStock = useCallback(async (adjustmentData, userId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.adjustStock(adjustmentData, userId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to adjust stock';
            setError(errorMsg);
            console.error('Adjust stock error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch variant movements
    const fetchVariantMovements = useCallback(async (variantId, skip = 0, limit = 100) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchVariantMovements(variantId, skip, limit);
            if (result.success) {
                setVariantMovements(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch variant movements';
            setError(errorMsg);
            console.error('Fetch variant movements error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /* -----------------------------
       🏢 SUPPLIER FUNCTIONS
    ------------------------------ */

    // Fetch all suppliers
    const fetchSuppliers = useCallback(async (skip = 0, limit = 100) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchAllSuppliers(skip, limit);
            if (result.success) {
                setSuppliers(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch suppliers';
            setError(errorMsg);
            console.error('Fetch suppliers error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch supplier by ID
    const fetchSupplierById = useCallback(async (supplierId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchSupplierById(supplierId);
            if (result.success) {
                setCurrentSupplier(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch supplier';
            setError(errorMsg);
            console.error('Fetch supplier error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create supplier
    const createSupplier = useCallback(async (supplierData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.createSupplier(supplierData);
            if (result.success) {
                setSuppliers(prev => [...prev, result.data]);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to create supplier';
            setError(errorMsg);
            console.error('Create supplier error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update supplier
    const updateSupplier = useCallback(async (supplierId, updateData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.updateSupplier(supplierId, updateData);
            if (result.success) {
                setSuppliers(prev => prev.map(supplier =>
                    supplier.supplier_id === supplierId ? { ...supplier, ...result.data } : supplier
                ));
                if (currentSupplier?.supplier_id === supplierId) {
                    setCurrentSupplier(prev => ({ ...prev, ...result.data }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update supplier';
            setError(errorMsg);
            console.error('Update supplier error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentSupplier]);

    // Delete supplier
    const deleteSupplier = useCallback(async (supplierId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.deleteSupplier(supplierId);
            if (result.success) {
                setSuppliers(prev => prev.filter(s => s.supplier_id !== supplierId));
                if (currentSupplier?.supplier_id === supplierId) {
                    setCurrentSupplier(null);
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to delete supplier';
            setError(errorMsg);
            console.error('Delete supplier error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentSupplier]);

    /* -----------------------------
       🏷️ BATCH FUNCTIONS
    ------------------------------ */

    // Fetch all batches
    const fetchBatches = useCallback(async (skip = 0, limit = 100) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchAllBatches(skip, limit);
            if (result.success) {
                setBatches(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch batches';
            setError(errorMsg);
            console.error('Fetch batches error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch batch by ID
    const fetchBatchById = useCallback(async (batchId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.fetchBatchById(batchId);
            if (result.success) {
                setCurrentBatch(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch batch';
            setError(errorMsg);
            console.error('Fetch batch error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create batch
    const createBatch = useCallback(async (batchData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.createBatch(batchData);
            if (result.success) {
                setBatches(prev => [...prev, result.data]);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to create batch';
            setError(errorMsg);
            console.error('Create batch error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update batch
    const updateBatch = useCallback(async (batchId, updateData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await inventoryApi.updateBatch(batchId, updateData);
            if (result.success) {
                setBatches(prev => prev.map(batch =>
                    batch.batch_id === batchId ? { ...batch, ...result.data } : batch
                ));
                if (currentBatch?.batch_id === batchId) {
                    setCurrentBatch(prev => ({ ...prev, ...result.data }));
                }
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update batch';
            setError(errorMsg);
            console.error('Update batch error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentBatch]);

    /* -----------------------------
       🧹 UTILITY FUNCTIONS
    ------------------------------ */

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear all current data
    const clearCurrentData = useCallback(() => {
        setCurrentCompany(null);
        setCurrentPurchase(null);
        setCurrentPurchaseReturn(null);
        setCurrentSupplier(null);
        setCurrentBatch(null);
        setVariantMovements([]);
    }, []);

    const value = {
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
        fetchAreas,
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
    };

    return (
        <InventoryContext.Provider value={value}>
            {children}
        </InventoryContext.Provider>
    );
};