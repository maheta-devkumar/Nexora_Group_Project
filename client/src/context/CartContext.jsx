import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as cartApi from '../api/cart';
import { validateCoupon } from '../api/coupon';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCartContext must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    // Auth context
    const { isAuthenticated, user } = useAuth();

    // State
    const [cart, setCart] = useState({
        items: [],
        subtotal: 0,
        total_items: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);

    // Coupon state
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponError, setCouponError] = useState(null);

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
    const clearError = useCallback(() => {
        setError(null);
        setCouponError(null);
    }, []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setCart({ items: [], subtotal: 0, total_items: 0 });
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setOperationLogs([]);
        setError(null);
        setCouponError(null);
        localStorage.removeItem('appliedCoupon');
        addLog('All cart data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Cart operation logs cleared', 'info');
    }, [addLog]);

    // ===== LOAD CART =====
    const loadCart = useCallback(async () => {
        // Reset if not authenticated
        if (!isAuthenticated || !user) {
            setCart({ items: [], subtotal: 0, total_items: 0 });
            setAppliedCoupon(null);
            setCouponDiscount(0);
            setCouponError(null);
            localStorage.removeItem('appliedCoupon');
            addLog('User not authenticated, cart reset', 'info');
            return { success: true, message: 'Cart reset for unauthenticated user' };
        }

        setLoading(true);
        setError(null);
        addLog('Loading cart...', 'info');

        try {
            const result = await cartApi.fetchCart();
            if (result.success) {
                setCart(result.data);

                // Reapply coupon if exists in localStorage
                const savedCoupon = localStorage.getItem('appliedCoupon');
                if (savedCoupon) {
                    const couponData = JSON.parse(savedCoupon);
                    if (couponData.coupon && couponData.discount) {
                        setAppliedCoupon(couponData.coupon);
                        setCouponDiscount(couponData.discount);
                        addLog('Coupon restored from localStorage', 'info');
                    }
                }

                addLog(`✅ Cart loaded: ${result.data.total_items || 0} items`, 'success');
                return { success: true, data: result.data };
            } else {
                // Handle unauthorized (401)
                if (result.unauthorized) {
                    setCart({ items: [], subtotal: 0, total_items: 0 });
                    setAppliedCoupon(null);
                    setCouponDiscount(0);
                    localStorage.removeItem('appliedCoupon');
                    addLog('User unauthorized, cart reset', 'warning');
                }

                setError(result.message);
                addLog(`❌ Failed to load cart: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to load cart';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Cart endpoint not found';
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
            console.error('Load cart error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user, addLog]);

    // ===== ADD TO CART =====
    const addItemToCart = useCallback(async (variantId, quantity = 1) => {
        if (!isAuthenticated) {
            const errorMsg = "Please log in to add items to cart";
            addLog(`❌ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg, unauthorized: true };
        }

        setLoading(true);
        setError(null);
        addLog(`Adding item ${variantId} to cart (quantity: ${quantity})...`, 'info');

        try {
            const result = await cartApi.addToCart(variantId, quantity);
            if (result.success) {
                // Reload cart to get updated data
                await loadCart();
                addLog(`✅ Item ${variantId} added to cart`, 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                // Handle unauthorized
                if (result.unauthorized) {
                    setCart({ items: [], subtotal: 0, total_items: 0 });
                    setAppliedCoupon(null);
                    setCouponDiscount(0);
                    localStorage.removeItem('appliedCoupon');
                    addLog('User unauthorized during add to cart', 'warning');
                }

                setError(result.message);
                addLog(`❌ Failed to add item: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to add item to cart';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Add to cart endpoint not found';
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
            console.error('Add to cart error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, loadCart, addLog]);

    // ===== UPDATE CART ITEM =====
    const updateItemQuantity = useCallback(async (variantId, quantity) => {
        if (!isAuthenticated) {
            const errorMsg = "Please log in to update cart";
            addLog(`❌ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg, unauthorized: true };
        }

        setLoading(true);
        setError(null);
        addLog(`Updating item ${variantId} quantity to ${quantity}...`, 'info');

        try {
            const result = await cartApi.updateCartItem(variantId, quantity);
            if (result.success) {
                // Reload cart to get updated data
                await loadCart();
                addLog(`✅ Item ${variantId} quantity updated`, 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                // Handle unauthorized
                if (result.unauthorized) {
                    setCart({ items: [], subtotal: 0, total_items: 0 });
                    setAppliedCoupon(null);
                    setCouponDiscount(0);
                    localStorage.removeItem('appliedCoupon');
                    addLog('User unauthorized during update', 'warning');
                }

                setError(result.message);
                addLog(`❌ Failed to update item: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to update cart item';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Update cart endpoint not found';
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
            console.error('Update cart error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, loadCart, addLog]);

    // ===== REMOVE FROM CART =====
    const removeItemFromCart = useCallback(async (variantId) => {
        if (!isAuthenticated) {
            const errorMsg = "Please log in to remove items";
            addLog(`❌ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg, unauthorized: true };
        }

        setLoading(true);
        setError(null);
        addLog(`Removing item ${variantId} from cart...`, 'info');

        try {
            // Optimistically update UI
            setCart(prevCart => ({
                ...prevCart,
                items: prevCart.items?.filter(item => item.variant_id !== variantId) || [],
                total_items: Math.max(0, (prevCart.total_items || 0) - 1)
            }));

            const result = await cartApi.removeFromCart(variantId);
            if (result.success) {
                // Reload to get accurate totals
                await loadCart();
                addLog(`✅ Item ${variantId} removed from cart`, 'success');
                return { success: true, message: result.message };
            } else {
                // Handle unauthorized
                if (result.unauthorized) {
                    setCart({ items: [], subtotal: 0, total_items: 0 });
                    setAppliedCoupon(null);
                    setCouponDiscount(0);
                    localStorage.removeItem('appliedCoupon');
                    addLog('User unauthorized during removal', 'warning');
                } else {
                    // Revert optimistic update on failure (except unauthorized)
                    await loadCart();
                }

                setError(result.message);
                addLog(`❌ Failed to remove item: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to remove item from cart';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Remove from cart endpoint not found';
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

            // Revert optimistic update on error
            await loadCart();
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Remove from cart error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, loadCart, addLog]);

    // ===== CLEAR CART =====
    const clearUserCart = useCallback(async () => {
        if (!isAuthenticated) {
            const errorMsg = "Please log in to clear cart";
            addLog(`❌ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg, unauthorized: true };
        }

        setLoading(true);
        setError(null);
        addLog('Clearing cart...', 'info');

        try {
            const result = await cartApi.clearCart();
            if (result.success) {
                setCart({ items: [], subtotal: 0, total_items: 0 });
                setAppliedCoupon(null);
                setCouponDiscount(0);
                localStorage.removeItem('appliedCoupon');
                addLog('✅ Cart cleared successfully', 'success');
                return { success: true, message: result.message };
            } else {
                // Handle unauthorized
                if (result.unauthorized) {
                    setCart({ items: [], subtotal: 0, total_items: 0 });
                    setAppliedCoupon(null);
                    setCouponDiscount(0);
                    localStorage.removeItem('appliedCoupon');
                    addLog('User unauthorized during clear', 'warning');
                }

                setError(result.message);
                addLog(`❌ Failed to clear cart: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to clear cart';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Clear cart endpoint not found';
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
            console.error('Clear cart error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, addLog]);

    // ===== COUPON FUNCTIONS =====
    // Note: Since validateCoupon API was mentioned but not provided,
    // I'm keeping the structure but it will need the actual API function
    const applyCouponToCart = useCallback(async (couponCode) => {
        if (!isAuthenticated) {
            const errorMsg = "Please log in to apply coupon";
            addLog(`❌ ${errorMsg}`, 'warning');
            return { success: false, message: errorMsg, unauthorized: true };
        }

        setCouponError(null);
        addLog(`Applying coupon: ${couponCode}...`, 'info');

        // Real API call to validate coupon
        try {
            const variantIds = cart.items.map(item => item.variant_id);
            const result = await validateCoupon(couponCode, variantIds, cart.subtotal);

            if (result.success && result.data.valid) {
                const { coupon, discount_amount } = result.data;
                const discountValue = parseFloat(discount_amount);

                setAppliedCoupon(coupon);
                setCouponDiscount(discountValue);
                setCouponError(null);

                // Save to localStorage
                localStorage.setItem('appliedCoupon', JSON.stringify({
                    coupon: coupon,
                    discount: discountValue
                }));

                addLog(`✅ Coupon ${couponCode} applied successfully (₹${discountValue} discount)`, 'success');
                return {
                    success: true,
                    message: result.message || `Coupon applied! You saved ₹${discountValue}`,
                    data: { coupon: coupon, discount_amount: discountValue }
                };
            } else {
                const errorMsg = result.data?.message || result.message || 'Invalid coupon';
                setCouponError(errorMsg);
                addLog(`❌ Coupon validation failed: ${errorMsg}`, 'error');
                return { success: false, message: errorMsg };
            }
        } catch (err) {
            const errorMsg = err.message || 'Error validating coupon';
            setCouponError(errorMsg);
            addLog(`❌ ${errorMsg}`, 'error');
            return { success: false, message: errorMsg };
        }
    }, [isAuthenticated, cart.subtotal, addLog]);

    // Remove applied coupon
    const removeCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError(null);
        localStorage.removeItem('appliedCoupon');
        addLog('Coupon removed', 'info');
        return { success: true, message: 'Coupon removed successfully' };
    }, [addLog]);

    // ===== UTILITY FUNCTIONS =====
    const getCartItemCount = useCallback(() => {
        return cart.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
    }, [cart.items]);

    const isInCart = useCallback((variantId) => {
        return cart.items?.some(item => item.variant_id === variantId) || false;
    }, [cart.items]);

    const getItemQuantity = useCallback((variantId) => {
        const item = cart.items?.find(item => item.variant_id === variantId);
        return item ? item.quantity : 0;
    }, [cart.items]);

    // Calculate cart totals with discounts
    const getCartTotals = useCallback(() => {
        const subtotal = cart.subtotal || 0;

        // Calculate item-level discounts (price vs final_price)
        const itemDiscount = cart.items?.reduce((total, item) => {
            if (item.price > item.final_price) {
                return total + ((item.price - item.final_price) * item.quantity);
            }
            return total;
        }, 0) || 0;

        const afterItemDiscount = Math.max(0, subtotal - itemDiscount);
        const afterCouponDiscount = Math.max(0, afterItemDiscount - couponDiscount);
        const total = afterCouponDiscount;

        return {
            subtotal,
            itemDiscount,
            couponDiscount,
            totalDiscount: itemDiscount + couponDiscount,
            total,
            deliveryFee: total > 50000 ? 0 : 100,
            finalTotal: total + (total > 50000 ? 0 : 100)
        };
    }, [cart.subtotal, cart.items, couponDiscount]);

    // Auto-load cart on mount and when authentication changes
    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const value = {
        // State
        cart,
        loading,
        error,
        operationLogs,
        appliedCoupon,
        couponDiscount,
        couponError,

        // Cart Functions
        loadCart,
        addItemToCart,
        updateItemQuantity,
        removeItemFromCart,
        clearUserCart,

        // Coupon Functions
        applyCouponToCart,
        removeCoupon,

        // Utility Functions
        getCartItemCount,
        isInCart,
        getItemQuantity,
        getCartTotals,

        // Context Utilities
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};