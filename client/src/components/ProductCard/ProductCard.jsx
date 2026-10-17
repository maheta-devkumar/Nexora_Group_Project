import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlistContext } from "../../context/WishlistContext";
import { useCartContext } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { fetchActiveOffers } from "../../api/offer";
import { toast } from 'react-toastify';
import "./ProductCard.css";

const ProductCard = ({
  id,
  title,
  description,
  price,
  originalPrice,
  rating,
  reviewCount,
  gradient,
  image,
  variantId,
  inStock = true,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItemToWishlist, removeItemFromWishlist, isInWishlist } = useWishlistContext();
  const { addItemToCart, isInCart, getItemQuantity } = useCartContext();
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [bestOffer, setBestOffer] = useState(null);
  const [finalPrice, setFinalPrice] = useState(price);
  const [imageError, setImageError] = useState(false);

  // Image URL processing
  const getImageUrl = (imgUrl) => {
    if (!imgUrl) return null;
    
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      return imgUrl;
    }
    
    if (imgUrl.startsWith('/uploads')) {
      return `http://localhost:8000${imgUrl}`;
    }
    
    return `http://localhost:8000/uploads/${imgUrl}`;
  };

  const processedImage = getImageUrl(image);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const result = await fetchActiveOffers();
        if (result.success) {
          const offers = result.data || [];
          const applicableOffers = offers.filter(offer => 
            !offer.variants || offer.variants.length === 0 || offer.variants.includes(variantId)
          );
          
          if (applicableOffers.length > 0) {
            const best = applicableOffers.reduce((best, current) => {
              const bestDiscount = best.discount_type === 'PERCENT' 
                ? (price * best.discount_value) / 100
                : best.discount_value;
              
              const currentDiscount = current.discount_type === 'PERCENT'
                ? (price * current.discount_value) / 100
                : current.discount_value;
              
              return currentDiscount > bestDiscount ? current : best;
            });
            
            setBestOffer(best);
            
            let discount = 0;
            if (best.discount_type === 'PERCENT') {
              discount = (price * best.discount_value) / 100;
            } else {
              discount = best.discount_value;
            }
            
            setFinalPrice(Math.max(0, price - discount));
          }
        }
      } catch (error) {
        console.error('Failed to load offers:', error);
      }
    };
    
    if (variantId) {
      loadOffers();
    }
  }, [variantId, price]);

  const handleCardClick = () => {
    if (id) {
      navigate(`/products/${id}`);
    } else {
      console.error('No product ID available for navigation');
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.warning("Please log in to add items to cart!");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }

    try {
      const result = await addItemToCart(variantId, 1);
      if (result.success) {
        toast.success("Added to cart!");
      } else {
        toast.error(result.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Something went wrong while adding to cart");
    }
  };

  const handleWishlistClick = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.warning("Please log in to manage wishlist!");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }

    if (isWishlistLoading) return;

    setIsWishlistLoading(true);
    
    try {
      if (isInWishlist(variantId)) {
        const result = await removeItemFromWishlist(variantId);
        if (result.success) {
          toast.success("Removed from wishlist!");
        } else {
          toast.error(result.message || "Failed to remove from wishlist");
        }
      } else {
        const result = await addItemToWishlist(variantId);
        if (result.success) {
          toast.success("Added to wishlist!");
        } else {
          toast.error(result.message || "Failed to add to wishlist");
        }
      }
    } catch (error) {
      console.error("Wishlist error:", error);
      toast.error("Something went wrong with wishlist");
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    const full = Math.floor(rating || 0);
    const half = (rating || 0) % 1 !== 0;
    for (let i = 0; i < full; i++)
      stars.push(<i key={`f-${i}`} className="fas fa-star"></i>);
    if (half)
      stars.push(<i key="h" className="fas fa-star-half-alt"></i>);
    while (stars.length < 5)
      stars.push(<i key={`e-${stars.length}`} className="far fa-star"></i>);
    return stars;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const itemInCart = variantId ? isInCart(variantId) : false;
  const cartQuantity = variantId ? getItemQuantity(variantId) : 0;
  const itemInWishlist = variantId ? isInWishlist(variantId) : false;
  const offerDiscount = bestOffer ? price - finalPrice : 0;

  return (
    <article className={`pcard ${!inStock ? "pcard--unavailable" : ""}`} onClick={handleCardClick}>
      {/* Wishlist Button */}
      <button 
        className={`pcard__wishlist ${itemInWishlist ? "pcard__wishlist--active" : ""} ${isWishlistLoading ? "pcard__wishlist--loading" : ""}`} 
        onClick={handleWishlistClick}
        disabled={isWishlistLoading}
        aria-label={itemInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <i className={itemInWishlist ? "fas fa-heart" : "far fa-heart"}></i>
        {isWishlistLoading && <span className="pcard__wishlist-spinner"></span>}
      </button>

      {/* Offer Badge */}
      {bestOffer && (
        <div className="pcard__badge pcard__badge--offer">
          <span className="pcard__badge-text">
            {bestOffer.discount_type === 'PERCENT' 
              ? `${bestOffer.discount_value}% OFF` 
              : `₹${bestOffer.discount_value} OFF`}
          </span>
        </div>
      )}

      {/* Cart Badge */}
      {itemInCart && (
        <div className="pcard__badge pcard__badge--cart">
          <i className="fas fa-shopping-cart"></i>
          {cartQuantity > 1 && <span className="pcard__badge-count">{cartQuantity}</span>}
        </div>
      )}

      {/* Product Image */}
      <div className="pcard__media">
        <div className="pcard__image-wrapper" style={{ background: gradient }}>
          {processedImage && !imageError ? (
            <img 
              src={processedImage} 
              alt={title}
              className="pcard__image"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <i className="fas fa-box-open pcard__placeholder-icon"></i>
          )}
        </div>
        {!inStock && <span className="pcard__stock-overlay">Out of Stock</span>}
      </div>

      {/* Product Info */}
      <div className="pcard__content">
        <h3 className="pcard__title">{title}</h3>
        <p className="pcard__description">{description}</p>

        {/* Rating */}
        <div className="pcard__rating">
          <div className="pcard__stars">{renderStars()}</div>
          <span className="pcard__rating-text">
            ({(rating || 0).toFixed(1)}) <span className="pcard__review-count">{reviewCount?.toLocaleString() || 0} reviews</span>
          </span>
        </div>

        {/* Footer */}
        <div className="pcard__footer">
          <div className="pcard__pricing">
            <span className="pcard__price pcard__price--current">₹{finalPrice?.toLocaleString() || "0"}</span>
            {originalPrice && <span className="pcard__price pcard__price--original">₹{originalPrice.toLocaleString()}</span>}
            {bestOffer && offerDiscount > 0 && (
              <span className="pcard__savings">
                Save ₹{offerDiscount.toLocaleString()}
              </span>
            )}
          </div>

          <button 
            className={`pcard__cart-btn ${itemInCart ? "pcard__cart-btn--added" : ""}`} 
            onClick={handleAddToCart} 
            disabled={!inStock}
            aria-label={inStock ? "Add to cart" : "Out of stock"}
          >
            <i className={itemInCart ? "fas fa-check" : "fas fa-shopping-cart"}></i>
            <span className="pcard__cart-btn-text">
              {itemInCart ? "Added" : inStock ? "Add to Cart" : "Out of Stock"}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;