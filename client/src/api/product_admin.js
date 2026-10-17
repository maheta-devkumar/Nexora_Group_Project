import api from './api';

const PRODUCTS_BASE_URL = "/products";

/* -----------------------------
   ✅ PRODUCT DETAILS API
------------------------------ */
export const fetchProductDetail = async (productId) => {
    try {
        console.log(`🔍 PRODUCT DETAIL: Fetching product ID: ${productId}`);
        console.log(`🔍 PRODUCT DETAIL: API URL: ${PRODUCTS_BASE_URL}/${productId}`);
        
        const response = await api.get(`${PRODUCTS_BASE_URL}/${productId}`);
        console.log(`🔍 PRODUCT DETAIL: Successfully fetched product data:`, response.data);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 PRODUCT DETAIL ERROR:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        const message = error.response?.data?.detail || "Product not found.";
        return { success: false, message };
    }
};

/* -----------------------------
   ✅ SEARCH & FILTER FUNCTIONS
------------------------------ */
export const fetchSuggestions = async (query) => {
    console.log(`🔍 FRONTEND SUGGESTIONS: Fetching suggestions for query = '${query}'`);
    
    if (!query || query.trim().length < 2) {
        console.log("🔍 FRONTEND SUGGESTIONS: Query too short, returning empty");
        return { success: true, data: [] };
    }
    
    try {
        const cleanQuery = query.trim();
        console.log(`🔍 FRONTEND SUGGESTIONS: Making API call to /suggestions?query=${cleanQuery}`);
        
        const response = await api.get(`${PRODUCTS_BASE_URL}/suggestions`, {
            params: { query: cleanQuery }
        });
        
        console.log(`🔍 FRONTEND SUGGESTIONS: Received ${response.data.data.length} suggestions`);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 FRONTEND SUGGESTIONS ERROR:", error.response?.data || error.message);
        return { success: false, data: [] };
    }
};

export const fetchProducts = async (filters = {}) => {
    console.log("🔍 FRONTEND PRODUCTS: Fetching products with filters:", filters);
    
    try {
        // Clean filters: remove null/undefined/empty values
        const cleanFilters = {};
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== "") {
                cleanFilters[key] = filters[key];
            }
        });
        
        console.log("🔍 FRONTEND PRODUCTS: Cleaned filters:", cleanFilters);
        console.log("🔍 FRONTEND PRODUCTS: API URL:", `${PRODUCTS_BASE_URL}/`);
        
        const response = await api.get(`${PRODUCTS_BASE_URL}/`, { 
            params: cleanFilters 
        });
        
        console.log(`🔍 FRONTEND PRODUCTS: Successfully fetched ${response.data.data.items?.length || 0} products`);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 FRONTEND PRODUCTS ERROR:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            config: error.config
        });
        const message = error.response?.data?.detail || "Failed to load products. Please check the server connection.";
        return { success: false, message };
    }
};

/* -----------------------------
   ✅ CATEGORY & BRAND FUNCTIONS
------------------------------ */
const CATEGORIES_URL = "/categories";
const BRANDS_URL = "/brands";

export const fetchCategories = async () => {
    try {
        console.log("🔍 DEBUG API: Fetching Categories from:", CATEGORIES_URL);
        const response = await api.get(`${CATEGORIES_URL}/`);
        
        if (response.data && Array.isArray(response.data.data)) {
            console.log(`🔍 DEBUG API: Categories found: ${response.data.data.length} items.`);
            return { success: true, data: response.data.data };
        }
        
        console.warn("🔍 DEBUG API: Categories fetched, but data structure was empty or invalid.");
        return { success: true, data: [] }; 
        
    } catch (error) {
        console.error("🔍 API Category Fetch FAILED:", error.response?.status, error.message);
        return { success: false, data: [], message: "Could not load categories." };
    }
};

export const fetchBrands = async () => {
    try {
        console.log("🔍 DEBUG API: Fetching Brands from:", BRANDS_URL);
        const response = await api.get(`${BRANDS_URL}/`);
        
        if (response.data && Array.isArray(response.data.data)) {
            console.log(`🔍 DEBUG API: Brands found: ${response.data.data.length} items.`);
            return { success: true, data: response.data.data };
        }
        
        console.warn("🔍 DEBUG API: Brands fetched, but data structure was empty or invalid.");
        return { success: true, data: [] };

    } catch (error) {
        console.error("🔍 API Brand Fetch FAILED:", error.response?.status, error.message);
        return { success: false, data: [], message: "Could not load brands." };
    }
};

/* -----------------------------
   ✅ SPECIAL PAGES FUNCTIONS
------------------------------ */
export const fetchDiscountedProducts = async (filters = {}) => {
    console.log("🔍 DEALS PAGE: Fetching discounted products with filters:", filters);
    
    try {
        const response = await api.get(`${PRODUCTS_BASE_URL}/deals`, { 
            params: filters 
        });
        
        console.log(`🔍 DEALS PAGE: Successfully fetched ${response.data.data.items?.length || 0} discounted products`);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 DEALS PAGE ERROR:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        
        let message = "Failed to load deals. Please check the server connection.";
        if (error.response?.status === 500) {
            console.error("Server error details:", error.response?.data);
            message = "Server error. Please try again later.";
        } else if (error.response?.data?.detail) {
            message = error.response.data.detail;
        }
        
        return { 
            success: false, 
            message,
            data: { items: [], total: 0, page: 1, per_page: 12 }
        };
    }
};

export const fetchNewArrivals = async (filters = {}) => {
    console.log("🔍 NEW ARRIVALS: Fetching new arrivals with filters:", filters);
    
    try {
        const response = await api.get(`${PRODUCTS_BASE_URL}/new-arrivals`, { 
            params: filters 
        });
        
        console.log(`🔍 NEW ARRIVALS: Successfully fetched ${response.data.data.items?.length || 0} products`);
        return { 
            success: true, 
            data: response.data.data
        };
    } catch (error) {
        console.error("🔍 NEW ARRIVALS ERROR:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        const message = error.response?.data?.detail || "Failed to load new arrivals.";
        return { 
            success: false, 
            message,
            data: { items: [], total: 0, page: 1, per_page: 24 }
        };
    }
};

export const fetchTrendingProducts = async (limit = 6) => {
    console.log("🔍 TRENDING: Fetching trending products");
    
    try {
        const response = await api.get(`${PRODUCTS_BASE_URL}/trending`, {
            params: { limit }
        });
        
        console.log(`🔍 TRENDING: Successfully fetched ${response.data.data?.items?.length || 0} trending products`);
        return { 
            success: true, 
            data: response.data.data
        };
    } catch (error) {
        console.error("🔍 TRENDING ERROR:", error.response?.data || error.message);
        return { 
            success: false, 
            message: "Failed to load trending products",
            data: { items: [], total: 0 }
        };
    }
};

export const fetchProductsByCategory = async (categoryName, filters = {}) => {
    console.log(`🔍 CATEGORY: Fetching products for category: ${categoryName}`);
    
    try {
        const response = await api.get(`${PRODUCTS_BASE_URL}/category/${encodeURIComponent(categoryName)}`, { 
            params: filters 
        });
        
        console.log(`🔍 CATEGORY: Successfully fetched ${response.data.data.items?.length || 0} products for ${categoryName}`);
        return { 
            success: true, 
            data: response.data.data
        };
    } catch (error) {
        console.error("🔍 CATEGORY ERROR:", error.response?.data || error.message);
        return { 
            success: false, 
            message: `Failed to load products in ${categoryName}`,
            data: { items: [], total: 0 }
        };
    }
};

/* -----------------------------
   🔥 ADMIN PRODUCT CRUD FUNCTIONS
------------------------------ */

// Get product with variants for admin
export const fetchProductWithVariants = async (productId) => {
    try {
        console.log(`🔍 ADMIN: Fetching product with variants ID: ${productId}`);
        const response = await api.get(`${PRODUCTS_BASE_URL}/${productId}`);
        console.log(`🔍 ADMIN: Product fetched successfully:`, response.data);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 ADMIN Product Fetch Error:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch product" 
        };
    }
};

// Create new product (Admin only)
export const createProduct = async (productData) => {
    try {
        console.log("🔍 ADMIN: Creating new product with data:", productData);
        
        const response = await api.post(`${PRODUCTS_BASE_URL}/`, productData);
        
        console.log("🔍 ADMIN: Product created successfully:", response.data);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 ADMIN Create Product Error:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            headers: error.config?.headers // Log headers to check auth
        });
        
        // Check if it's an authentication issue
        if (error.response?.status === 401 || error.response?.status === 403) {
            const token = localStorage.getItem('token');
            console.log("🔍 ADMIN: Current token exists:", !!token);
            if (!token) {
                return { 
                    success: false, 
                    message: "Authentication required. Please login as admin." 
                };
            }
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to create product" 
        };
    }
};

// Update product (Admin only)
export const updateProduct = async (productId, updateData) => {
    try {
        console.log(`🔍 ADMIN: Updating product ID: ${productId}`, updateData);
        
        const response = await api.put(`${PRODUCTS_BASE_URL}/${productId}`, updateData);
        
        console.log(`🔍 ADMIN: Product updated successfully:`, response.data);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 ADMIN Update Product Error:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            const token = localStorage.getItem('token');
            if (!token) {
                return { 
                    success: false, 
                    message: "Authentication required. Please login as admin." 
                };
            }
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to update product" 
        };
    }
};

// Delete product (Admin only)
export const deleteProduct = async (productId) => {
    try {
        console.log(`🔍 ADMIN: Deleting product ID: ${productId}`);
        
        const response = await api.delete(`${PRODUCTS_BASE_URL}/${productId}`);
        
        console.log(`🔍 ADMIN: Product deleted successfully:`, response.data);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 ADMIN Delete Product Error:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            const token = localStorage.getItem('token');
            if (!token) {
                return { 
                    success: false, 
                    message: "Authentication required. Please login as admin." 
                };
            }
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to delete product" 
        };
    }
};

/* -----------------------------
   ✅ DEBUG/HELPER FUNCTIONS
------------------------------ */

// Check if user is authenticated
export const checkAuthStatus = () => {
    try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log("🔍 AUTH CHECK:", {
            hasToken: !!token,
            hasUser: !!user,
            user: user ? JSON.parse(user) : null
        });
        
        return {
            isAuthenticated: !!token,
            token,
            user: user ? JSON.parse(user) : null
        };
    } catch (error) {
        console.error("🔍 AUTH CHECK ERROR:", error);
        return { isAuthenticated: false, token: null, user: null };
    }
};

// Set admin token manually (for testing)
export const setAdminTokenForTesting = (token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
        roles: ['admin'],
        email: 'admin@test.com'
    }));
    console.log("🔍 TEST: Admin token set for testing");
};