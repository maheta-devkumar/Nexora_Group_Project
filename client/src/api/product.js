import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const PRODUCTS_BASE_URL = `${API_URL}/products`;
const REVIEWS_BASE_URL = `${API_URL}/reviews`;
/* -----------------------------
   ✅ PRODUCT DETAILS API
------------------------------ */
export const fetchProductDetail = async (productId) => {
    try {
        const response = await axios.get(`${PRODUCTS_BASE_URL}/${productId}`);
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
   ✅ REVIEWS API
------------------------------ */
export const fetchProductReviews = async (variantId, page = 1, perPage = 10) => {
    try {
        console.log(`🔍 REVIEWS: Fetching reviews for variant ID: ${variantId}`);
        const response = await axios.get(`${REVIEWS_BASE_URL}/${variantId}`, {
            params: { page, per_page: perPage }
        });
        console.log(`🔍 REVIEWS: Found ${response.data.data.items.length} reviews`);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 REVIEWS ERROR:", error.response?.data || error.message);
        const message = error.response?.data?.detail || "Failed to load reviews.";
        return { success: false, message, data: { items: [], total: 0 } };
    }
};

export const createProductReview = async (reviewData) => {
    try {
        console.log(`🔍 REVIEWS: Creating new review`, reviewData);
        const response = await axios.post(`${REVIEWS_BASE_URL}/`, reviewData);
        console.log(`🔍 REVIEWS: Review created successfully`);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 REVIEWS CREATE ERROR:", error.response?.data || error.message);
        const message = error.response?.data?.detail || "Failed to create review.";
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
        
        const response = await axios.get(`${PRODUCTS_BASE_URL}/suggestions`, {
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
        const cleanFilters = {};
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== "") {
                cleanFilters[key] = filters[key];
            }
        });
        
        console.log("🔍 FRONTEND PRODUCTS: Cleaned filters:", cleanFilters);
        
        const response = await axios.get(`${PRODUCTS_BASE_URL}/`, { 
            params: cleanFilters 
        });
        
        console.log(`🔍 FRONTEND PRODUCTS: Successfully fetched ${response.data.data.items.length} products`);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("🔍 FRONTEND PRODUCTS ERROR:", error.response?.data || error.message);
        const message =
            error.response?.data?.message ||
            "Failed to load products. Please check the server connection.";
        return { success: false, message };
    }
};

/* -----------------------------
   ✅ CATEGORY & BRAND FUNCTIONS
------------------------------ */
const CATEGORIES_URL = `${API_URL}/categories`;
const BRANDS_URL = `${API_URL}/brands`;

export const fetchCategories = async () => {
    try {
        console.log("DEBUG API: Fetching Categories from:", CATEGORIES_URL);
        const response = await axios.get(`${CATEGORIES_URL}/`);
        
        if (response.data && Array.isArray(response.data.data)) {
            console.log(`DEBUG API: Categories found: ${response.data.data.length} items.`);
            return { success: true, data: response.data.data };
        }
        
        console.warn("DEBUG API: Categories fetched, but data structure was empty or invalid.");
        return { success: true, data: [] }; 
        
    } catch (error) {
        console.error("API Category Fetch FAILED:", error.response?.status, error.message);
        return { success: false, data: [], message: "Could not load categories." };
    }
};

export const fetchBrands = async () => {
    try {
        console.log("DEBUG API: Fetching Brands from:", BRANDS_URL);
        const response = await axios.get(`${BRANDS_URL}/`);
        
        if (response.data && Array.isArray(response.data.data)) {
            console.log(`DEBUG API: Brands found: ${response.data.data.length} items.`);
            return { success: true, data: response.data.data };
        }
        
        console.warn("DEBUG API: Brands fetched, but data structure was empty or invalid.");
        return { success: true, data: [] };

    } catch (error) {
        console.error("API Brand Fetch FAILED:", error.response?.status, error.message);
        return { success: false, data: [], message: "Could not load brands." };
    }
};

/* -----------------------------
   ✅ SPECIAL PAGES FUNCTIONS
------------------------------ */
export const fetchDiscountedProducts = async (filters = {}) => {
  console.log("🔍 DEALS PAGE: Fetching discounted products with filters:", filters);
  
  try {
    const cleanFilters = {
      ...filters,
      has_discount: true
    };
    
    if (cleanFilters.sort_by) {
      const sortMapping = {
        'discount_desc': 'newest',
        'price_low': 'price_asc',
        'price_high': 'price_desc',
        'newest': 'newest'
      };
      cleanFilters.sort_by = sortMapping[cleanFilters.sort_by] || 'newest';
    }
    
    Object.keys(cleanFilters).forEach(key => {
      if (cleanFilters[key] === null || cleanFilters[key] === undefined || cleanFilters[key] === "") {
        delete cleanFilters[key];
      }
    });
    
    if (cleanFilters.min_discount_percentage) {
      delete cleanFilters.min_discount_percentage;
    }
    
    console.log("🔍 DEALS PAGE: Final API call with filters:", cleanFilters);
    
    const response = await axios.get(`${PRODUCTS_BASE_URL}/`, { 
      params: cleanFilters 
    });
    
    console.log(`🔍 DEALS PAGE: Successfully fetched ${response.data.data.items?.length || 0} discounted products`);
    
    let items = response.data.data.items || [];
    
    items = items.map(item => {
      const originalPrice = parseFloat(item.default_variant?.price || 0);
      const finalPrice = parseFloat(item.default_variant?.final_price || 0);
      let discountPercent = 0;
      
      if (originalPrice > 0 && finalPrice < originalPrice) {
        discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
      }
      
      return {
        ...item,
        discount_percentage: discountPercent
      };
    });
    
    if (filters.min_discount_percentage) {
      items = items.filter(item => 
        item.discount_percentage >= filters.min_discount_percentage
      );
    }
    
    if (filters.sort_by === 'discount_desc') {
      items.sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));
    }
    
    return { 
      success: true, 
      data: {
        items,
        total: items.length,
        page: response.data.data.page || 1,
        per_page: response.data.data.per_page || (filters.per_page || 12)
      }
    };
    
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
    } else if (error.response?.status === 404) {
      message = "Deals endpoint not found.";
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
    const cleanFilters = {
      ...filters,
      sort_by: 'newest',
      per_page: filters.per_page || 24
    };
    
    Object.keys(cleanFilters).forEach(key => {
      if (cleanFilters[key] === null || cleanFilters[key] === undefined || cleanFilters[key] === "") {
        delete cleanFilters[key];
      }
    });
    
    console.log("🔍 NEW ARRIVALS: Final API call with filters:", cleanFilters);
    
    const response = await axios.get(`${PRODUCTS_BASE_URL}/`, { 
      params: cleanFilters 
    });
    
    console.log(`🔍 NEW ARRIVALS: Successfully fetched ${response.data.data.items.length} products`);
    return { 
      success: true, 
      data: { 
        items: response.data.data.items, 
        total: response.data.data.total || response.data.data.items.length 
      } 
    };
  } catch (error) {
    console.error("🔍 NEW ARRIVALS ERROR:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    const message = error.response?.data?.detail || "Failed to load new arrivals. Please check the server connection.";
    return { 
      success: false, 
      message,
      data: { items: [], total: 0 }
    };
  }
};

export const fetchTrendingProducts = async (limit = 6) => {
  console.log("🔍 TRENDING: Fetching trending products");
  
  try {
    const response = await axios.get(`${PRODUCTS_BASE_URL}/`, {
      params: {
        per_page: limit,
        sort_by: 'newest',
        has_discount: true
      }
    });
    
    console.log(`🔍 TRENDING: Successfully fetched ${response.data.data.items.length} trending products`);
    
    return { 
      success: true, 
      data: { 
        items: response.data.data.items, 
        total: response.data.data.total || response.data.data.items.length 
      } 
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
  
  if (categoryName.toLowerCase() === 'all') {
    return fetchProducts(filters);
  }
  
  try {
    const categoriesResult = await fetchCategories();
    if (categoriesResult.success) {
      const category = categoriesResult.data.find(
        cat => cat.category_name && cat.category_name.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (category) {
        const cleanFilters = {
          ...filters,
          category_id: category.category_id,
          sort_by: filters.sort_by || 'newest',
          per_page: filters.per_page || 24
        };
        
        Object.keys(cleanFilters).forEach(key => {
          if (cleanFilters[key] === null || cleanFilters[key] === undefined || cleanFilters[key] === "") {
            delete cleanFilters[key];
          }
        });
        
        console.log("🔍 CATEGORY: Final API call with filters:", cleanFilters);
        
        const response = await axios.get(`${PRODUCTS_BASE_URL}/`, {
          params: cleanFilters
        });
        
        console.log(`🔍 CATEGORY: Successfully fetched ${response.data.data.items.length} products for ${categoryName}`);
        
        return { 
          success: true, 
          data: { 
            items: response.data.data.items, 
            total: response.data.data.total || response.data.data.items.length 
          } 
        };
      }
    }
    
    return { 
      success: true, 
      data: { items: [], total: 0 },
      message: `No products found in ${categoryName}`
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
   🔥 NEW ADMIN PRODUCT FUNCTIONS (ADDED BELOW)
------------------------------ */

// Get product details with variants for admin
export const fetchProductWithVariants = async (productId) => {
    try {
        const response = await axios.get(`${PRODUCTS_BASE_URL}/${productId}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Admin Product Fetch Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch product" 
        };
    }
};

// Create new product (Admin only)
export const createProduct = async (productData) => {
    try {
        const response = await axios.post(`${PRODUCTS_BASE_URL}/`, productData);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Create Product Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to create product" 
        };
    }
};

// Update product (Admin only)
export const updateProduct = async (productId, updateData) => {
    try {
        const response = await axios.put(`${PRODUCTS_BASE_URL}/${productId}`, updateData);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Update Product Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to update product" 
        };
    }
};

// Delete product (Admin only)
export const deleteProduct = async (productId) => {
    try {
        const response = await axios.delete(`${PRODUCTS_BASE_URL}/${productId}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Delete Product Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to delete product" 
        };
    }
};

// Get product suggestions for admin
export const fetchAdminSuggestions = async (query) => {
    try {
        const response = await axios.get(`${PRODUCTS_BASE_URL}/suggestions`, {
            params: { query: query.trim() }
        });
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Admin Suggestions Error:", error.response?.data || error.message);
        return { success: false, data: [] };
    }
};

// Get deals for admin
export const fetchAdminDeals = async (filters = {}) => {
    try {
        const params = { ...filters, has_discount: true };
        const response = await axios.get(`${PRODUCTS_BASE_URL}/deals`, { params });
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Admin Deals Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: "Failed to fetch deals",
            data: { items: [], total: 0 }
        };
    }
};

// Get new arrivals for admin
export const fetchAdminNewArrivals = async (filters = {}) => {
    try {
        const response = await axios.get(`${PRODUCTS_BASE_URL}/new-arrivals`, { params: filters });
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Admin New Arrivals Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: "Failed to fetch new arrivals",
            data: { items: [], total: 0 }
        };
    }
};

// Get trending products for admin
export const fetchAdminTrending = async (limit = 6) => {
    try {
        const response = await axios.get(`${PRODUCTS_BASE_URL}/trending`, {
            params: { limit }
        });
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Admin Trending Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: "Failed to fetch trending products",
            data: { items: [], total: 0 }
        };
    }
};

// Get products by category for admin
export const fetchAdminCategoryProducts = async (categoryName, filters = {}) => {
    try {
        const response = await axios.get(`${PRODUCTS_BASE_URL}/category/${categoryName}`, { 
            params: filters 
        });
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Admin Category Products Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: `Failed to fetch products for ${categoryName}`,
            data: { items: [], total: 0 }
        };
    }
};