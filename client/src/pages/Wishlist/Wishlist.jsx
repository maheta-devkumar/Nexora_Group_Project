import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlistContext } from "../../context/WishlistContext"; // Changed from useWishlist
import { useAuth } from "../../context/AuthContext";
import "./Wishlist.css";
import { toast } from 'react-toastify';

const Wishlist = () => {
  const navigate = useNavigate();
  const {
    wishlist,
    loading, // Changed from isWishlistLoading
    removeItemFromWishlist,
    moveToCart,
    moveAllToCart,
    clearWishlist,
    loadWishlist
  } = useWishlistContext(); // Changed to useWishlistContext
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState("grid");
  const [loadingActions, setLoadingActions] = useState(new Set());

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    }
  }, [isAuthenticated, loadWishlist]);

  const handleRemoveItem = async (variantId) => {
    if (!isAuthenticated) {
      toast.warning("Please log in to manage wishlist!");
      navigate("/login", { state: { from: "/wishlist" } });
      return;
    }

    setLoadingActions(prev => new Set(prev).add(`remove-${variantId}`));

    try {
      const result = await removeItemFromWishlist(variantId);
      if (result.success) {
        toast.success("Removed from wishlist!");
      } else {
        if (result.unauthorized) {
          toast.warning("Please log in to manage wishlist!");
          navigate("/login", { state: { from: "/wishlist" } });
        } else {
          toast.error(result.message || "Failed to remove from wishlist");
        }
      }
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`remove-${variantId}`);
        return newSet;
      });
    }
  };

  const handleMoveToCart = async (variantId) => {
    if (!isAuthenticated) {
      toast.warning("Please log in to manage cart!");
      navigate("/login", { state: { from: "/wishlist" } });
      return;
    }

    setLoadingActions(prev => new Set(prev).add(`cart-${variantId}`));

    try {
      const result = await moveToCart(variantId);
      if (result.success) {
        toast.success("Item moved to cart!");
      } else {
        if (result.unauthorized) {
          toast.warning("Please log in to manage cart!");
          navigate("/login", { state: { from: "/wishlist" } });
        } else {
          toast.error(result.message || "Failed to move to cart");
        }
      }
    } catch (error) {
      console.error("Move to cart error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`cart-${variantId}`);
        return newSet;
      });
    }
  };

  const handleAddAllToCart = async () => {
    if (!isAuthenticated) {
      toast.warning("Please log in to manage cart!");
      navigate("/login", { state: { from: "/wishlist" } });
      return;
    }

    setLoadingActions(prev => new Set(prev).add('all-to-cart'));

    try {
      const result = await moveAllToCart();
      if (result.success) {
        toast.success(result.message || "All items moved to cart!");
      } else {
        toast.error(result.message || "Failed to move items to cart");
      }
    } catch (error) {
      console.error("Move all error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete('all-to-cart');
        return newSet;
      });
    }
  };

  const handleClearWishlist = async () => {
    if (!isAuthenticated) {
      toast.warning("Please log in to manage wishlist!");
      navigate("/login", { state: { from: "/wishlist" } });
      return;
    }

    if (window.confirm("Are you sure you want to clear your wishlist?")) {
      setLoadingActions(prev => new Set(prev).add('clear-all'));

      try {
        const result = await clearWishlist();
        if (result.success) {
          toast.success("Wishlist cleared!");
        } else {
          toast.error(result.message || "Failed to clear wishlist");
        }
      } catch (error) {
        console.error("Clear error:", error);
        toast.error("Failed to clear wishlist");
      } finally {
        setLoadingActions(prev => {
          const newSet = new Set(prev);
          newSet.delete('clear-all');
          return newSet;
        });
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="wishlist-page">
        <div className="empty-wishlist">
          <i className="fas fa-user-lock"></i>
          <h2>Please Log In</h2>
          <p>You need to be logged in to view your wishlist</p>
          <button className="continue-shopping-btn" onClick={() => navigate('/login', { state: { from: '/wishlist' } })}>
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (loading && (!wishlist || wishlist.length === 0)) {
    return (
      <div className="wishlist-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        {!wishlist || wishlist.length === 0 ? (
          <div className="empty-wishlist">
            <i className="far fa-heart"></i>
            <h2>Your wishlist is empty</h2>
            <p>Save your favorite items here to keep track of them</p>
            <button className="continue-shopping-btn" onClick={() => navigate("/")}>
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="wishlist-header">
              <div className="header-left">
                <h1>My Wishlist</h1>
                <span className="item-count">{wishlist.length} Item(s)</span>
              </div>

              <div className="header-actions">
                <button
                  className="view-toggle"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  disabled={loadingActions.size > 0}
                >
                  <i className={`fas fa-${viewMode === "grid" ? "list" : "th-large"}`}></i>
                </button>
                <button
                  className="add-all-btn"
                  onClick={handleAddAllToCart}
                  disabled={loadingActions.has('all-to-cart')}
                >
                  <i className="fas fa-shopping-cart"></i>
                  {loadingActions.has('all-to-cart') ? 'Adding...' : 'Add All to Cart'}
                </button>
                <button
                  className="clear-wishlist-btn"
                  onClick={handleClearWishlist}
                  disabled={loadingActions.has('clear-all')}
                >
                  <i className="far fa-trash-alt"></i>
                  {loadingActions.has('clear-all') ? 'Clearing...' : 'Clear Wishlist'}
                </button>
              </div>
            </div>

            <div className={`wishlist-items ${viewMode}`}>
              {wishlist.map((item) => (
                <WishlistItem
                  key={item.variant_id}
                  item={item}
                  onRemove={handleRemoveItem}
                  onAddToCart={handleMoveToCart}
                  viewMode={viewMode}
                  navigate={navigate}
                  loadingActions={loadingActions}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const WishlistItem = ({ item, onRemove, onAddToCart, viewMode, navigate, loadingActions }) => {
  const { variant_id, product_id, product_name, variant_name, price, added_at } = item;
  const isRemoving = loadingActions.has(`remove-${variant_id}`);
  const isMovingToCart = loadingActions.has(`cart-${variant_id}`);

  const handleProductClick = () => {
    navigate(`/products/${product_id || variant_id}`);
  };

  return viewMode === "grid" ? (
    <div className="wishlist-item-grid">
      <div className="wishlist-item-info">
        <h3 onClick={handleProductClick} style={{ cursor: 'pointer' }}>
          {product_name} {variant_name && variant_name !== 'Default' && `(${variant_name})`}
        </h3>
        <p className="item-price">₹{price?.toLocaleString() || '0'}</p>
        <p className="wishlist-date">Added on {new Date(added_at).toLocaleDateString()}</p>
      </div>

      <div className="wishlist-item-actions">
        <button
          className="btn-move-to-cart"
          onClick={() => onAddToCart(variant_id)}
          disabled={isMovingToCart}
        >
          <i className="fas fa-shopping-cart"></i>
          {isMovingToCart ? 'Moving...' : 'Move to Cart'}
        </button>
        <button
          className="btn-remove"
          onClick={() => onRemove(variant_id)}
          disabled={isRemoving}
        >
          <i className="fas fa-times"></i>
          {isRemoving ? '...' : ''}
        </button>
      </div>
    </div>
  ) : (
    <div className="wishlist-item-list">
      <div className="wishlist-item-list-info">
        <h3 onClick={handleProductClick} style={{ cursor: 'pointer' }}>
          {product_name} {variant_name && variant_name !== 'Default' && `(${variant_name})`}
        </h3>
        <p className="item-price">₹{price?.toLocaleString() || '0'}</p>
        <span className="wishlist-date">
          <i className="far fa-calendar"></i> Added on {new Date(added_at).toLocaleDateString()}
        </span>
      </div>

      <div className="wishlist-item-list-actions">
        <button
          className="btn-add-to-cart-list"
          onClick={() => onAddToCart(variant_id)}
          disabled={isMovingToCart}
        >
          <i className="fas fa-shopping-cart"></i>
          {isMovingToCart ? 'Moving...' : 'Move to Cart'}
        </button>
        <button
          className="btn-remove-list"
          onClick={() => onRemove(variant_id)}
          disabled={isRemoving}
        >
          <i className="far fa-trash-alt"></i>
          {isRemoving ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </div>
  );
};

export default Wishlist;