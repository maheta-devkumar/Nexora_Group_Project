import api from './api';

const CART_BASE_URL = `/cart`;

/* -----------------------------
   ✅ CART API FUNCTIONS
------------------------------ */

// Get cart data
export const fetchCart = async () => {
    try {
        const response = await api.get(`${CART_BASE_URL}/`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Cart fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Cart Error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return { 
                success: false, 
                message: "Please log in to view your cart",
                unauthorized: true,
                data: { items: [], subtotal: 0, total_items: 0 }
            };
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to load cart",
            data: { items: [], subtotal: 0, total_items: 0 }
        };
    }
};

// Add item to cart
export const addToCart = async (variantId, quantity = 1) => {
    try {
        console.log('Cart API: addToCart called with variantId:', variantId);
        const response = await api.post(`${CART_BASE_URL}/add`, null, { 
            params: { variant_id: variantId, quantity } 
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Item added to cart successfully"
        };
    } catch (error) {
        console.error("Add to Cart Error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return { 
                success: false, 
                message: "Please log in to add items to cart",
                unauthorized: true
            };
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to add item to cart"
        };
    }
};

// Update cart item quantity
export const updateCartItem = async (variantId, quantity) => {
    try {
        const response = await api.put(`${CART_BASE_URL}/update`, null, {
            params: { variant_id: variantId, quantity }
        });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message || "Cart updated successfully"
        };
    } catch (error) {
        console.error("Update Cart Item Error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return { 
                success: false, 
                message: "Please log in to update cart",
                unauthorized: true
            };
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to update quantity"
        };
    }
};

// Remove item from cart
export const removeFromCart = async (variantId) => {
    try {
        const response = await api.delete(`${CART_BASE_URL}/remove/${variantId}`);
        return { 
            success: true, 
            message: response.data.message || "Item removed from cart successfully"
        };
    } catch (error) {
        console.error("Remove from Cart Error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return { 
                success: false, 
                message: "Please log in to remove items",
                unauthorized: true
            };
        }
        
        // Handle 404 as success since the item is no longer in cart
        if (error.response?.status === 404) {
            return { 
                success: true, 
                message: "Item removed from cart"
            };
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to remove item"
        };
    }
};

// Clear cart
export const clearCart = async () => {
    try {
        const response = await api.delete(`${CART_BASE_URL}/clear`);
        return { 
            success: true, 
            message: response.data.message || "Cart cleared successfully"
        };
    } catch (error) {
        console.error("Clear Cart Error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return { 
                success: false, 
                message: "Please log in to clear cart",
                unauthorized: true
            };
        }
        
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to clear cart"
        };
    }
};