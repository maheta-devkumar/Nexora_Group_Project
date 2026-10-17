import api from './api';

const WISHLIST_BASE_URL = `/wishlist`;

/* -----------------------------
   ✅ WISHLIST API FUNCTIONS
------------------------------ */

// Get wishlist
export const fetchWishlist = async () => {
    try {
        const response = await api.get(`${WISHLIST_BASE_URL}/`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Wishlist fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Wishlist Error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return { 
                success: false, 
                message: "Please log in to view wishlist",
                unauthorized: true,
                data: []
            };
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to load wishlist",
            data: []
        };
    }
};

// Add to wishlist
export const addToWishlist = async (variantId) => {
    try {
        const response = await api.post(`${WISHLIST_BASE_URL}/add`, null, {
            params: { variant_id: variantId },
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Added to wishlist successfully"
        };
    } catch (error) {
        console.error("Add to Wishlist Error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return { 
                success: false, 
                message: "Please log in to add to wishlist",
                unauthorized: true
            };
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to add to wishlist"
        };
    }
};

// Remove from wishlist
export const removeFromWishlist = async (variantId) => {
    try {
        const response = await api.delete(`${WISHLIST_BASE_URL}/remove/${variantId}`);
        return { 
            success: true, 
            message: response.data.message || "Item removed from wishlist successfully"
        };
    } catch (error) {
        console.error("Remove from Wishlist Error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return { 
                success: false, 
                message: "Please log in to remove from wishlist",
                unauthorized: true
            };
        }
        
        // Handle 404 as success since the item is no longer in wishlist
        if (error.response?.status === 404) {
            return { 
                success: true, 
                message: "Item removed from wishlist"
            };
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to remove wishlist item"
        };
    }
};