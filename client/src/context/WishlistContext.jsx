import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as wishlistApi from '../api/wishlist';
import { useAuth } from './AuthContext';
import { useCartContext } from './CartContext';

const WishlistContext = createContext();

export const useWishlistContext = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlistContext must be used within WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    // Auth context
    const { isAuthenticated, user } = useAuth();
    
    // Cart context for move to cart functionality
    const { addItemToCart } = useCartContext();
    
    // State
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);

    // Utility function to add logs
    const addLog = useCallback((message, type = 'info') => {
        const log = {
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        setOperationLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, []);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setWishlist([]);
        setOperationLogs([]);
        setError(null);
        addLog('All wishlist data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Wishlist operation logs cleared', 'info');
    }, [addLog]);

    // ===== LOAD WISHLIST =====
    const loadWishlist = useCallback(async () => {
        // Reset if not authenticated
        if (!isAuthenticated || !user) {
            setWishlist([]);
            setError(null);
            addLog('User not authenticated, wishlist reset', 'info');
            return { success: true, message: 'Wishlist reset for unauthenticated user' };
        }
        
        setLoading(true);
        setError(null);
        addLog('Loading wishlist...', 'info');
        
        try {
            const result = await wishlistApi.fetchWishlist();
            if (result.success) {
                setWishlist(result.data || []);
                addLog(`✅ Wishlist loaded: ${result.data.length} items`, 'success');
                return { success: true, data: result.data };
            } else {
                // Handle unauthorized (401)
                if (result.unauthorized) {
                    setWishlist([]);
                    addLog('User unauthorized, wishlist reset', 'warning');
                }
                
                setError(result.message);
                addLog(`❌ Failed to load wishlist: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to load wishlist';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Wishlist endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Load wishlist error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user, addLog]);

    // ===== ADD TO WISHLIST =====
    const addItemToWishlist = useCallback(async (variantId) => {
        if (!isAuthenticated) {
            const errorMsg = "Please log in to add to wishlist";
            addLog(`❌ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg, unauthorized: true };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Adding item ${variantId} to wishlist...`, 'info');
        
        try {
            const result = await wishlistApi.addToWishlist(variantId);
            if (result.success) {
                // Reload wishlist to get updated data
                await loadWishlist();
                addLog(`✅ Item ${variantId} added to wishlist`, 'success');
                return { success: true, message: "Added to wishlist" };
            } else {
                // Handle unauthorized
                if (result.unauthorized) {
                    setWishlist([]);
                    addLog('User unauthorized during add to wishlist', 'warning');
                }
                
                setError(result.message);
                addLog(`❌ Failed to add to wishlist: ${result.message}`, 'error');
                return { success: false, message: result.message, unauthorized: result.unauthorized };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to add to wishlist';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Add to wishlist endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Add to wishlist error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, loadWishlist, addLog]);

    // ===== REMOVE FROM WISHLIST =====
    const removeItemFromWishlist = useCallback(async (variantId) => {
        if (!isAuthenticated) {
            const errorMsg = "Please log in to remove from wishlist";
            addLog(`❌ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg, unauthorized: true };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Removing item ${variantId} from wishlist...`, 'info');
        
        try {
            // Optimistically remove from local state
            setWishlist(prev => prev.filter(item => item.variant_id !== variantId));
            
            const result = await wishlistApi.removeFromWishlist(variantId);
            if (result.success) {
                addLog(`✅ Item ${variantId} removed from wishlist`, 'success');
                return { success: true, message: "Removed from wishlist" };
            } else {
                // Handle unauthorized
                if (result.unauthorized) {
                    setWishlist([]);
                    addLog('User unauthorized during removal', 'warning');
                } else {
                    // Reload on failure to restore state (except unauthorized)
                    await loadWishlist();
                }
                
                setError(result.message);
                addLog(`❌ Failed to remove from wishlist: ${result.message}`, 'error');
                return { success: false, message: result.message, unauthorized: result.unauthorized };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to remove from wishlist';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Remove from wishlist endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Reload on error to restore state
            await loadWishlist();
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Remove from wishlist error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, loadWishlist, addLog]);

    // ===== MOVE TO CART =====
    const moveToCart = useCallback(async (variantId) => {
        if (!isAuthenticated) {
            const errorMsg = "Please log in to move items to cart";
            addLog(`❌ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg, unauthorized: true };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Moving item ${variantId} from wishlist to cart...`, 'info');
        
        try {
            const result = await addItemToCart(variantId, 1);
            if (result.success) {
                // Remove from wishlist after successful cart addition
                await removeItemFromWishlist(variantId);
                addLog(`✅ Item ${variantId} moved to cart`, 'success');
                return { success: true, message: "Item moved to cart" };
            } else {
                setError(result.message);
                addLog(`❌ Failed to move item to cart: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to move item to cart';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Move to cart operation failed';
                addLog(`❌ ${errorMsg}`, 'error');
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Move to cart error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, addItemToCart, removeItemFromWishlist, addLog]);

    // ===== MOVE ALL TO CART =====
    const moveAllToCart = useCallback(async () => {
        if (!isAuthenticated) {
            const errorMsg = "Please log in to move items to cart";
            addLog(`❌ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg, unauthorized: true };
        }
        
        if (wishlist.length === 0) {
            const errorMsg = "Wishlist is empty";
            addLog(`⚠️ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Moving all ${wishlist.length} items to cart...`, 'info');
        
        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const item of wishlist) {
            try {
                const result = await addItemToCart(item.variant_id, 1);
                if (result.success) {
                    successCount++;
                    // Remove from wishlist after successful cart addition
                    await removeItemFromWishlist(item.variant_id);
                    addLog(`✅ Item ${item.variant_id} moved to cart`, 'success');
                } else {
                    failCount++;
                    errors.push(`Item ${item.variant_id}: ${result.message}`);
                    addLog(`❌ Failed to move item ${item.variant_id} to cart: ${result.message}`, 'error');
                }
            } catch (error) {
                failCount++;
                errors.push(`Item ${item.variant_id}: ${error.message}`);
                addLog(`❌ Error moving item ${item.variant_id} to cart: ${error.message}`, 'error');
                console.error('Move to cart error:', error);
            }
        }

        if (failCount === 0) {
            addLog(`✅ All ${successCount} items moved to cart successfully`, 'success');
            return { success: true, message: `${successCount} items moved to cart` };
        } else {
            const errorMsg = `${successCount} items moved, ${failCount} failed`;
            setError(errorMsg);
            addLog(`⚠️ ${errorMsg}`, 'warning');
            return { 
                success: successCount > 0, 
                message: errorMsg,
                errors: errors
            };
        }
    }, [isAuthenticated, wishlist, addItemToCart, removeItemFromWishlist, addLog]);

    // ===== CLEAR WISHLIST =====
    const clearWishlist = useCallback(async () => {
        if (!isAuthenticated) {
            const errorMsg = "Please log in to clear wishlist";
            addLog(`❌ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg, unauthorized: true };
        }
        
        if (wishlist.length === 0) {
            const errorMsg = "Wishlist is already empty";
            addLog(`⚠️ ${errorMsg}`, 'info');
            return { success: true, message: errorMsg };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Clearing wishlist (${wishlist.length} items)...`, 'info');
        
        try {
            // Clear all items one by one
            for (const item of wishlist) {
                await wishlistApi.removeFromWishlist(item.variant_id);
            }
            setWishlist([]);
            addLog('✅ Wishlist cleared successfully', 'success');
            return { success: true, message: "Wishlist cleared" };
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to clear wishlist';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Clear wishlist operation failed';
                addLog(`❌ ${errorMsg}`, 'error');
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Clear wishlist error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, wishlist, addLog]);

    // ===== HELPER FUNCTIONS =====
    const isInWishlist = useCallback((variantId) => {
        return wishlist.some((item) => item.variant_id === variantId);
    }, [wishlist]);

    // Auto-load wishlist on mount and when authentication changes
    useEffect(() => {
        loadWishlist();
    }, [loadWishlist]);

    const value = {
        // State
        wishlist,
        loading,
        error,
        operationLogs,
        
        // Core Functions
        loadWishlist,
        addItemToWishlist,
        removeItemFromWishlist,
        
        // Extended Functions
        moveToCart,
        moveAllToCart,
        clearWishlist,
        
        // Helper Functions
        isInWishlist,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};