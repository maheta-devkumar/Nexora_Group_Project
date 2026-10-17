import api from './api';

/* -----------------------------
   📦 INVENTORY API FUNCTIONS
------------------------------ */

// Base URLs for each inventory module
const BATCHES_BASE_URL = `/inventory/batches`;
const COMPANIES_BASE_URL = `/inventory/companies`;
const PURCHASES_BASE_URL = `/inventory/purchases`;
const RETURNS_BASE_URL = `/inventory/returns`;
const STOCK_BASE_URL = `/inventory/stock`;
const SUPPLIERS_BASE_URL = `/inventory/suppliers`;

/* -----------------------------
   🏭 COMPANY API FUNCTIONS
------------------------------ */

// Get all companies
export const fetchAllCompanies = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(COMPANIES_BASE_URL, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Companies Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch companies",
            data: []
        };
    }
};

// Get company by ID
export const fetchCompanyById = async (companyId) => {
    try {
        const response = await api.get(`${COMPANIES_BASE_URL}/${companyId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Company Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch company"
        };
    }
};

// Create new company
export const createCompany = async (companyData) => {
    try {
        const response = await api.post(COMPANIES_BASE_URL, companyData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Create Company Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to create company"
        };
    }
};
export const fetchAllAreas = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(`${COMPANIES_BASE_URL}/areas`, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Companies Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch companies",
            data: []
        };
    }
};

// Update company
export const updateCompany = async (companyId, updateData) => {
    try {
        const response = await api.patch(`${COMPANIES_BASE_URL}/${companyId}`, updateData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Company Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update company"
        };
    }
};

// Delete company
export const deleteCompany = async (companyId) => {
    try {
        const response = await api.delete(`${COMPANIES_BASE_URL}/${companyId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Delete Company Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete company"
        };
    }
};

/* -----------------------------
   📦 PURCHASE API FUNCTIONS
------------------------------ */

// Get all purchases
export const fetchAllPurchases = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(PURCHASES_BASE_URL, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Purchases Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch purchases",
            data: []
        };
    }
};

// Get purchase by ID
export const fetchPurchaseById = async (purchaseId) => {
    try {
        const response = await api.get(`${PURCHASES_BASE_URL}/${purchaseId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Purchase Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch purchase"
        };
    }
};

// Create new purchase
export const createPurchase = async (purchaseData) => {
    try {
        const response = await api.post(PURCHASES_BASE_URL, purchaseData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Create Purchase Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to create purchase"
        };
    }
};

// Update purchase status
export const updatePurchaseStatus = async (purchaseId, status) => {
    try {
        const response = await api.patch(`${PURCHASES_BASE_URL}/${purchaseId}/status`, { status });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Purchase Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update purchase status"
        };
    }
};

/* -----------------------------
   🔄 PURCHASE RETURN API FUNCTIONS
------------------------------ */

// Get all purchase returns
export const fetchAllPurchaseReturns = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(RETURNS_BASE_URL, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Purchase Returns Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch purchase returns",
            data: []
        };
    }
};

// Get purchase return by ID
export const fetchPurchaseReturnById = async (returnId) => {
    try {
        const response = await api.get(`${RETURNS_BASE_URL}/${returnId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Purchase Return Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch purchase return"
        };
    }
};

// Create new purchase return
export const createPurchaseReturn = async (returnData) => {
    try {
        const response = await api.post(RETURNS_BASE_URL, returnData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Create Purchase Return Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to create purchase return"
        };
    }
};

// Update purchase return status
export const updatePurchaseReturnStatus = async (returnId, status) => {
    try {
        const response = await api.patch(`${RETURNS_BASE_URL}/${returnId}/status`, { status });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Purchase Return Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update purchase return status"
        };
    }
};

/* -----------------------------
   📊 STOCK API FUNCTIONS
------------------------------ */

// Get stock movements
export const fetchStockMovements = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(`${STOCK_BASE_URL}/movements`, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Stock Movements Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch stock movements",
            data: []
        };
    }
};

// Get stock summary
export const fetchStockSummary = async () => {
    try {
        const response = await api.get(`${STOCK_BASE_URL}/summary`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Stock Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch stock summary",
            data: []
        };
    }
};

// Adjust stock
export const adjustStock = async (adjustmentData, userId) => {
    try {
        const data = { ...adjustmentData, user_id: userId };
        const response = await api.post(`${STOCK_BASE_URL}/adjust`, data);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Adjust Stock Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to adjust stock"
        };
    }
};

// Get variant movements
export const fetchVariantMovements = async (variantId, skip = 0, limit = 100) => {
    try {
        const response = await api.get(`${STOCK_BASE_URL}/movements/variant/${variantId}`, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Variant Movements Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch variant movements",
            data: []
        };
    }
};

/* -----------------------------
   🏢 SUPPLIER API FUNCTIONS
------------------------------ */

// Get all suppliers
export const fetchAllSuppliers = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(SUPPLIERS_BASE_URL, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Suppliers Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch suppliers",
            data: []
        };
    }
};

// Get supplier by ID
export const fetchSupplierById = async (supplierId) => {
    try {
        const response = await api.get(`${SUPPLIERS_BASE_URL}/${supplierId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Supplier Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch supplier"
        };
    }
};

// Create new supplier
export const createSupplier = async (supplierData) => {
    try {
        const response = await api.post(SUPPLIERS_BASE_URL, supplierData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Create Supplier Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to create supplier"
        };
    }
};

// Update supplier
export const updateSupplier = async (supplierId, updateData) => {
    try {
        const response = await api.patch(`${SUPPLIERS_BASE_URL}/${supplierId}`, updateData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Supplier Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update supplier"
        };
    }
};

// Delete supplier
export const deleteSupplier = async (supplierId) => {
    try {
        const response = await api.delete(`${SUPPLIERS_BASE_URL}/${supplierId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Delete Supplier Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete supplier"
        };
    }
};

/* -----------------------------
   🏷️ BATCH API FUNCTIONS
------------------------------ */

// Get all batches
export const fetchAllBatches = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get(BATCHES_BASE_URL, {
            params: { skip, limit }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Batches Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch batches",
            data: []
        };
    }
};

// Get batch by ID
export const fetchBatchById = async (batchId) => {
    try {
        const response = await api.get(`${BATCHES_BASE_URL}/${batchId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Batch Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch batch"
        };
    }
};

// Create new batch
export const createBatch = async (batchData) => {
    try {
        const response = await api.post(BATCHES_BASE_URL, batchData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Create Batch Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to create batch"
        };
    }
};

// Update batch
export const updateBatch = async (batchId, updateData) => {
    try {
        const response = await api.patch(`${BATCHES_BASE_URL}/${batchId}`, updateData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Batch Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update batch"
        };
    }
};