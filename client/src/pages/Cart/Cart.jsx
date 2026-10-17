import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartContext } from '../../context/CartContext'; // Changed from useCart
import { useAuth } from '../../context/AuthContext';
import { fetchActiveCoupons } from '../../api/coupon'; // Changed from getActiveCoupons
import './Cart.css';
import { toastSuccess, toastError, toastWarning, toastInfo } from '../../utils/customToast';

const Cart = () => {
    const navigate = useNavigate();
    const { 
        cart, 
        loading, // Changed from isCartLoading
        updateItemQuantity, 
        removeItemFromCart, 
        clearUserCart, 
        loadCart,
        appliedCoupon,
        couponDiscount,
        couponError,
        applyCouponToCart,
        removeCoupon,
        getCartTotals
    } = useCartContext(); // Changed to useCartContext
    const { isAuthenticated } = useAuth();
    
    const [updatingItems, setUpdatingItems] = useState(new Set());
    const [removingItems, setRemovingItems] = useState(new Set());
    const [couponCode, setCouponCode] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [showCouponForm, setShowCouponForm] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadCart();
            loadAvailableCoupons();
        }
    }, [isAuthenticated, loadCart]);

    const loadAvailableCoupons = async () => {
        try {
            const result = await fetchActiveCoupons(); // Changed from getActiveCoupons
            if (result.success) {
                setAvailableCoupons(result.data || []);
            }
        } catch (error) {
            console.error('Failed to load coupons:', error);
        }
    };

    const handleQuantityChange = async (variantId, type) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/cart' } });
            return;
        }

        const currentItem = cart.items?.find(item => item.variant_id === variantId);
        if (!currentItem) return;

        const newQuantity = type === 'increment' 
            ? currentItem.quantity + 1 
            : Math.max(1, currentItem.quantity - 1);

        if (newQuantity > currentItem.stock_quantity) {
            toastError(`Only ${currentItem.stock_quantity} items available`);
            return;
        }

        setUpdatingItems(prev => new Set(prev).add(variantId));
        
        try {
            const result = await updateItemQuantity(variantId, newQuantity);
            if (result.success) {
                toastSuccess("Cart updated");
            } else {
                toastError(result.message || "Failed to update quantity");
            }
        } catch (error) {
            console.error('Update quantity error:', error);
            toastError("Error updating quantity");
        } finally {
            setUpdatingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(variantId);
                return newSet;
            });
        }
    };

    const handleRemoveItem = async (variantId) => {
        if (!isAuthenticated) return;

        setRemovingItems(prev => new Set(prev).add(variantId));
        
        try {
            const result = await removeItemFromCart(variantId);
            if (result.success) {
                toastSuccess("Item removed from cart");
            } else {
                toastError(result.message || "Failed to remove item");
            }
        } catch (error) {
            console.error('Remove item error:', error);
            toastError("Error removing item");
        } finally {
            setRemovingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(variantId);
                return newSet;
            });
        }
    };

    const handleClearCart = async () => {
        if (!isAuthenticated) return;

        if (window.confirm('Are you sure you want to clear your entire cart?')) {
            const result = await clearUserCart();
            if (result.success) {
                toastSuccess("Cart cleared");
            } else {
                toastError(result.message || "Failed to clear cart");
            }
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toastError('Please enter a coupon code');
            return;
        }

        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/cart' } });
            return;
        }

        setIsApplyingCoupon(true);
        
        try {
            const result = await applyCouponToCart(couponCode.toUpperCase());
            if (result.success) {
                toastSuccess(result.message || 'Coupon applied successfully!');
                setCouponCode('');
                setShowCouponForm(false);
            } else {
                toastError(result.message || 'Failed to apply coupon');
            }
        } catch (error) {
            console.error('Apply coupon error:', error);
            toastError('Something went wrong while applying coupon');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = async () => {
        const result = removeCoupon();
        if (result.success) {
            toastSuccess(result.message || 'Coupon removed');
        }
    };

    const handleCheckout = () => {
        if (!cart.items || cart.items.length === 0) {
            toastError('Your cart is empty');
            return;
        }

        const unavailableItems = cart.items.filter(item => item.status !== 'ACTIVE' || item.stock_quantity < item.quantity);
        if (unavailableItems.length > 0) {
            toastError('Please remove unavailable items before proceeding to checkout');
            return;
        }
        
        // Navigate to checkout page
        navigate('/checkout', { state: {} });
    };

    // Get calculated totals
    const totals = getCartTotals();
    const deliveryFee = totals.deliveryFee;
    const total = totals.finalTotal;

    if (!isAuthenticated) {
        return (
            <div className="cart-page">
                <div className="empty-cart">
                    <i className="fas fa-user-lock"></i>
                    <h2>Please Log In</h2>
                    <p>You need to be logged in to view your cart</p>
                    <button className="continue-shopping-btn" onClick={() => navigate('/login', { state: { from: '/cart' } })}>
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    if (loading && (!cart.items || cart.items.length === 0)) {
        return (
            <div className="cart-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your cart...</p>
                </div>
            </div>
        );
    }

    if (!cart.items || cart.items.length === 0) {
        return (
            <div className="cart-page">
                <div className="empty-cart">
                    <i className="fas fa-shopping-cart"></i>
                    <h2>Your cart is empty</h2>
                    <p>Add items to your cart to see them here</p>
                    <button className="continue-shopping-btn" onClick={() => navigate('/')}>
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="cart-container">
                <div className="cart-header">
                    <h1>Shopping Cart</h1>
                    <div className="header-actions">
                        <span className="item-count">{cart.total_items || 0} Item(s)</span>
                        <button className="clear-cart-btn" onClick={handleClearCart}>
                            <i className="fas fa-trash"></i>
                            Clear Cart
                        </button>
                    </div>
                </div>

                {/* Coupon Section */}
                <div className="coupon-section">
                    {appliedCoupon ? (
                        <div className="applied-coupon-card">
                            <div className="coupon-info">
                                <i className="fas fa-ticket-alt"></i>
                                <div className="coupon-details">
                                    <strong>{appliedCoupon.code}</strong>
                                    <span>Applied successfully!</span>
                                </div>
                            </div>
                            <div className="coupon-discount">
                                - ₹{couponDiscount.toLocaleString()}
                            </div>
                            <button 
                                className="remove-coupon-btn"
                                onClick={handleRemoveCoupon}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ) : (
                        <div className="coupon-input-section">
                            {showCouponForm ? (
                                <div className="coupon-form">
                                    <input
                                        type="text"
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="coupon-input"
                                        disabled={isApplyingCoupon}
                                    />
                                    <div className="coupon-buttons">
                                        <button 
                                            className="apply-coupon-btn"
                                            onClick={handleApplyCoupon}
                                            disabled={isApplyingCoupon || !couponCode.trim()}
                                        >
                                            {isApplyingCoupon ? 'Applying...' : 'Apply'}
                                        </button>
                                        <button 
                                            className="cancel-coupon-btn"
                                            onClick={() => {
                                                setShowCouponForm(false);
                                                setCouponCode('');
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    className="show-coupon-btn"
                                    onClick={() => setShowCouponForm(true)}
                                >
                                    <i className="fas fa-ticket-alt"></i>
                                    Have a coupon code?
                                </button>
                            )}
                            
                            {couponError && (
                                <div className="coupon-error">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {couponError}
                                </div>
                            )}
                            
                            {availableCoupons.length > 0 && !showCouponForm && (
                                <div className="available-coupons">
                                    <span className="coupon-hint">
                                        {availableCoupons.length} coupon{availableCoupons.length !== 1 ? 's' : ''} available
                                    </span>
                                    <button 
                                        className="view-coupons-btn"
                                        onClick={() => navigate('/coupons')}
                                    >
                                        View All
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="cart-content">
                    <div className="cart-items">
                        {cart.items.map(item => {
                            const isUpdating = updatingItems.has(item.variant_id);
                            const isRemoving = removingItems.has(item.variant_id);
                            const isOutOfStock = item.status !== 'ACTIVE' || item.stock_quantity < item.quantity;
                            const maxAvailable = Math.min(item.stock_quantity, item.quantity);

                            return (
                                <div key={item.variant_id} className={`cart-item ${isOutOfStock ? 'out-of-stock' : ''}`}>
                                    <div className="item-image">
                                        <div className="image-placeholder">
                                            <i className="fas fa-box"></i>
                                        </div>
                                        {isOutOfStock && (
                                            <span className="stock-badge">Out of Stock</span>
                                        )}
                                        {(isUpdating || isRemoving) && (
                                            <div className="loading-overlay">
                                                <div className="mini-spinner"></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="item-details">
                                        <h3 className="item-name">{item.product_name}</h3>
                                        {item.variant_name && item.variant_name !== 'Default' && (
                                            <p className="item-variant">Variant: {item.variant_name}</p>
                                        )}
                                        
                                        <div className="item-price">
                                            <span className="current-price">₹{item.final_price?.toLocaleString()}</span>
                                            {item.price > item.final_price && (
                                                <>
                                                    <span className="original-price">₹{item.price?.toLocaleString()}</span>
                                                    <span className="discount-percent">
                                                        {Math.round(((item.price - item.final_price) / item.price) * 100)}% OFF
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <div className="item-actions">
                                            {!isOutOfStock ? (
                                                <div className="quantity-controls">
                                                    <button 
                                                        onClick={() => handleQuantityChange(item.variant_id, 'decrement')}
                                                        disabled={item.quantity <= 1 || isUpdating}
                                                    >
                                                        <i className="fas fa-minus"></i>
                                                    </button>
                                                    <span className="quantity">
                                                        {isUpdating ? '...' : item.quantity}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleQuantityChange(item.variant_id, 'increment')}
                                                        disabled={isUpdating || item.quantity >= item.stock_quantity}
                                                    >
                                                        <i className="fas fa-plus"></i>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="out-of-stock-text">
                                                    {item.stock_quantity === 0 ? 'Out of stock' : `Only ${maxAvailable} available`}
                                                </span>
                                            )}

                                            <button 
                                                className="action-btn"
                                                onClick={() => handleRemoveItem(item.variant_id)}
                                                disabled={isRemoving}
                                            >
                                                <i className="far fa-trash-alt"></i>
                                                {isRemoving ? 'Removing...' : 'Remove'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="item-subtotal">
                                        <span className="subtotal-label">Subtotal</span>
                                        <span className="subtotal-amount">
                                            ₹{((item.final_price || 0) * (item.quantity || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="order-summary">
                        <h2>Order Summary</h2>

                        <div className="summary-details">
                            <div className="summary-row">
                                <span>Subtotal ({cart.total_items || 0} items)</span>
                                <span>₹{totals.subtotal.toLocaleString()}</span>
                            </div>

                            {totals.itemDiscount > 0 && (
                                <div className="summary-row discount">
                                    <span>Product Discounts</span>
                                    <span>- ₹{totals.itemDiscount.toLocaleString()}</span>
                                </div>
                            )}

                            {appliedCoupon && (
                                <div className="summary-row coupon">
                                    <span>Coupon: {appliedCoupon.code}</span>
                                    <span>- ₹{couponDiscount.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="summary-row">
                                <span>Delivery Fee</span>
                                <span>
                                    {deliveryFee === 0 ? (
                                        <span className="free-delivery">FREE</span>
                                    ) : (
                                        `₹${deliveryFee.toLocaleString()}`
                                    )}
                                </span>
                            </div>

                            {totals.subtotal < 50000 && deliveryFee > 0 && (
                                <div className="delivery-info">
                                    <i className="fas fa-info-circle"></i>
                                    Add ₹{(50000 - totals.subtotal).toLocaleString()} more for FREE delivery
                                </div>
                            )}

                            <div className="summary-divider"></div>

                            <div className="summary-row total">
                                <span>Total Amount</span>
                                <span>₹{total.toLocaleString()}</span>
                            </div>

                            {totals.totalDiscount > 0 && (
                                <div className="savings-badge">
                                    <i className="fas fa-piggy-bank"></i>
                                    You're saving ₹{totals.totalDiscount.toLocaleString()} on this order
                                </div>
                            )}
                        </div>

                        <button 
                            className="checkout-btn"
                            onClick={handleCheckout}
                            disabled={cart.items?.some(item => item.status !== 'ACTIVE' || item.stock_quantity < item.quantity)}
                        >
                            <i className="fas fa-lock"></i>
                            Proceed to Checkout
                        </button>

                        <button className="continue-shopping-btn-summary" onClick={() => navigate('/')}>
                            <i className="fas fa-arrow-left"></i>
                            Continue Shopping
                        </button>

                        <div className="trust-badges">
                            <div className="badge-item">
                                <i className="fas fa-shield-alt"></i>
                                <span>Secure Payment</span>
                            </div>
                            <div className="badge-item">
                                <i className="fas fa-truck"></i>
                                <span>Fast Delivery</span>
                            </div>
                            <div className="badge-item">
                                <i className="fas fa-undo"></i>
                                <span>Easy Returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;