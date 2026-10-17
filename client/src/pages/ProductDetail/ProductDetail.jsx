import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard';
import { fetchProductDetail, fetchProducts } from '../../api/product';
import { createReview, fetchVariantReviews } from '../../api/product_review';
import { useAuth } from '../../context/AuthContext';
import './ProductDetail.css';
import { useCartContext } from "../../context/CartContext";
import { useWishlistContext } from "../../context/WishlistContext";
import { toastSuccess, toastError } from "../../utils/customToast";

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addItemToCart } = useCartContext();
    const { addItemToWishlist, removeItemFromWishlist, isInWishlist } = useWishlistContext();
    const { isAuthenticated, user } = useAuth();

    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    const [reviews, setReviews] = useState({ items: [], total: 0 });
    const [newReview, setNewReview] = useState({ rating: 5, comment: '', title: '' });
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [recTab, setRecTab] = useState('category'); // 'category' or 'brand'
    const [recProducts, setRecProducts] = useState([]); // Category based
    const [brandProducts, setBrandProducts] = useState([]); // Brand based
    const [imageErrors, setImageErrors] = useState({});

    // Image URL processing function
    const getImageUrl = (imgUrl) => {
        if (!imgUrl) return null;

        // If it's already a full URL, return as is
        if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
            return imgUrl;
        }

        // If it starts with /uploads, construct full URL
        if (imgUrl.startsWith('/uploads')) {
            return `http://localhost:8000${imgUrl}`;
        }

        // If it's just a filename or partial path
        return `http://localhost:8000/uploads/${imgUrl}`;
    };

    useEffect(() => {
        const loadProductDetail = async () => {
            setLoading(true);
            try {
                console.log(`🔍 PRODUCT DETAIL: Loading product ID: ${id}`);
                const response = await fetchProductDetail(id);

                if (response.success) {
                    const productData = response.data;
                    console.log(`🔍 PRODUCT DETAIL: Loaded product data:`, productData);
                    console.log(`🔍 PRODUCT DETAIL: Product variants:`, productData.variants);

                    setProduct(productData);

                    // Set default variant
                    const defaultVariant = productData.variants.find(v => v.is_default) || productData.variants[0];
                    if (defaultVariant) {
                        setSelectedVariant(defaultVariant);
                        console.log(`🔍 PRODUCT DETAIL: Set default variant:`, defaultVariant);
                        console.log(`🔍 PRODUCT DETAIL: Variant images:`, defaultVariant.images);
                    }

                    loadRecommendations(productData);
                } else {
                    console.error('🔍 PRODUCT DETAIL: Failed to load product:', response.message);
                }
            } catch (error) {
                console.error('🔍 PRODUCT DETAIL: Error loading product:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadProductDetail();
        }
    }, [id]);

    useEffect(() => {
        if (selectedVariant) {
            loadReviews();
            // Reset selected image when variant changes
            setSelectedImage(0);
            setImageErrors({});
        }
    }, [selectedVariant]);

    const loadReviews = async () => {
        if (!selectedVariant) return;

        setReviewsLoading(true);
        try {
            const response = await fetchVariantReviews(selectedVariant.variant_id);

            if (response.success) {
                setReviews(response.data);
            } else {
                setReviews({ items: [], total: 0 });
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            setReviews({ items: [], total: 0 });
        } finally {
            setReviewsLoading(false);
        }
    };

    const loadRecommendations = async (currentProduct) => {
        if (!currentProduct) return;

        try {
            // Fetch Similar Products (Same Category)
            const catParams = {
                per_page: 5, // Fetch 5 to filter out self
                sort_by: 'newest',
                category_id: currentProduct.category?.category_id
            };

            // Fetch Brand Products (Same Brand)
            const brandParams = {
                per_page: 5,
                sort_by: 'newest',
                brand_id: currentProduct.brand?.brand_id
            };

            const [catResponse, brandResponse] = await Promise.all([
                fetchProducts(catParams),
                currentProduct.brand ? fetchProducts(brandParams) : Promise.resolve({ success: false })
            ]);

            if (catResponse.success) {
                const filtered = catResponse.data.items.filter(item => item.product_id !== parseInt(currentProduct.product_id));
                setRecProducts(filtered.slice(0, 4));
            }

            if (brandResponse.success) {
                const filtered = brandResponse.data.items.filter(item => item.product_id !== parseInt(currentProduct.product_id));
                setBrandProducts(filtered.slice(0, 4));
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate("/login", { state: { from: `/products/${id}` } });
            return false;
        }

        if (!selectedVariant) {
            toastError("Please select a variant");
            return false;
        }

        try {
            const response = await addItemToCart(selectedVariant.variant_id, quantity);

            if (response.success) {
                toastSuccess("Product added to cart");
                return true;
            } else {
                if (response.unauthorized) {
                    navigate("/login", { state: { from: `/products/${id}` } });
                } else {
                    toastError(response.message || "Failed to add to cart");
                }
                return false;
            }
        } catch (error) {
            console.error("Add To Cart Error:", error);
            toastError("Error adding product to cart");
            return false;
        }
    };

    const handleBuyNow = async () => {
        const result = await handleAddToCart();
        if (result) navigate("/cart");
    };

    const handleWishlistToggle = async () => {
        if (!isAuthenticated) {
            navigate("/login", { state: { from: `/products/${id}` } });
            return;
        }

        if (!selectedVariant) {
            toastError("Please select a variant");
            return;
        }

        setWishlistLoading(true);
        try {
            if (isInWishlist(selectedVariant.variant_id)) {
                const result = await removeItemFromWishlist(selectedVariant.variant_id);
                if (result.success) {
                    toastSuccess("Removed from wishlist");
                } else {
                    toastError(result.message || "Failed to remove from wishlist");
                }
            } else {
                const result = await addItemToWishlist(selectedVariant.variant_id);
                if (result.success) {
                    toastSuccess("Added to wishlist!");
                } else {
                    toastError(result.message || "Failed to add to wishlist");
                }
            }
        } catch (error) {
            console.error("Wishlist Error:", error);
            toastError("Error updating wishlist");
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleQuantityChange = (type) => {
        if (!selectedVariant) return;

        const maxStock = selectedVariant.stock_quantity || 1;
        if (type === 'increment' && quantity < maxStock) {
            setQuantity(quantity + 1);
        } else if (type === 'decrement' && quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleVariantChange = (variant) => {
        if (variant.stock_quantity > 0) {
            setSelectedVariant(variant);
            setSelectedImage(0);
            setQuantity(1);
            setImageErrors({});
            console.log(`🔍 VARIANT: Changed to ${variant.variant_name}`);
            console.log(`🔍 VARIANT: New variant images:`, variant.images);
        }
    };

    const handleAddReview = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/products/${id}` } });
            return;
        }

        if (!newReview.title.trim() || !newReview.comment.trim()) {
            toastError('Please fill in all review fields');
            return;
        }

        try {
            const reviewData = {
                variant_id: selectedVariant.variant_id,
                rating: newReview.rating,
                title: newReview.title,
                comment: newReview.comment
            };

            const response = await createReview(reviewData);

            if (response.success) {
                toastSuccess('Review added successfully!');
                setNewReview({ rating: 5, comment: '', title: '' });
                loadReviews();
            } else {
                toastError(response.message || 'Failed to add review');
            }
        } catch (error) {
            console.error('Error adding review:', error);
            toastError('Failed to add review');
        }
    };

    const handleImageError = (index) => {
        console.error(`Image ${index} failed to load`);
        setImageErrors(prev => ({ ...prev, [index]: true }));
    };

    const renderStars = (rating, size = 'normal') => {
        const stars = [];
        const starClass = size === 'large' ? 'star-large' : '';

        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                stars.push(<i key={i} className={`fas fa-star ${starClass}`}></i>);
            } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                stars.push(<i key={i} className={`fas fa-star-half-alt ${starClass}`}></i>);
            } else {
                stars.push(<i key={i} className={`far fa-star ${starClass}`}></i>);
            }
        }
        return stars;
    };

    const gradientColors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];

    if (loading) {
        return (
            <div className="product-detail-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading product details...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-detail-page">
                <div className="error-container">
                    <i className="fas fa-exclamation-circle"></i>
                    <h2>Product not found</h2>
                    <button onClick={() => navigate('/')}>Go to Home</button>
                </div>
            </div>
        );
    }

    const discount = selectedVariant && selectedVariant.discount_value > 0
        ? Math.round((selectedVariant.discount_value / selectedVariant.price) * 100)
        : 0;

    // Get current variant images with proper URL processing
    const currentImages = selectedVariant?.images || [];
    const processedImages = currentImages.map(img => ({
        ...img,
        url: getImageUrl(img.url)
    }));

    console.log("🖼️ DETAIL PAGE - Current variant images:", currentImages);
    console.log("🖼️ DETAIL PAGE - Processed images:", processedImages);

    const isCurrentInWishlist = selectedVariant ? isInWishlist(selectedVariant.variant_id) : false;

    return (
        <div className="product-detail-page">
            <div className="product-detail-container">
                <nav className="breadcrumb">
                    <a href="/">Home</a>
                    <i className="fas fa-chevron-right"></i>
                    <a href={`/category/${product.category?.category_name}`}>
                        {product.category?.category_name || 'Category'}
                    </a>
                    <i className="fas fa-chevron-right"></i>
                    <span>{product.product_name}</span>
                </nav>

                <div className="product-main">
                    <div className="product-gallery">
                        <div className="thumbnail-list">
                            {processedImages.map((img, index) => (
                                <div
                                    key={img.image_id || index}
                                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(index)}
                                >
                                    {imageErrors[index] ? (
                                        <div className="thumbnail-placeholder">
                                            <i className="fas fa-image"></i>
                                        </div>
                                    ) : (
                                        <img
                                            src={img.url}
                                            alt={`${product.product_name} ${index + 1}`}
                                            onError={() => handleImageError(index)}
                                            onLoad={() => console.log(`Thumbnail ${index} loaded:`, img.url)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="main-image">
                            {processedImages.length > 0 && !imageErrors[selectedImage] ? (
                                <img
                                    src={processedImages[selectedImage]?.url}
                                    alt={product.product_name}
                                    onError={() => handleImageError(selectedImage)}
                                    onLoad={() => console.log("Main image loaded:", processedImages[selectedImage]?.url)}
                                />
                            ) : (
                                <div className="no-image">
                                    <i className="fas fa-box-open"></i>
                                    <p>No Image Available</p>
                                </div>
                            )}
                            <button
                                className={`wishlist-btn-detail ${isCurrentInWishlist ? 'active' : ''}`}
                                onClick={handleWishlistToggle}
                                disabled={wishlistLoading || !selectedVariant}
                            >
                                {wishlistLoading ? (
                                    <i className="fas fa-spinner fa-spin"></i>
                                ) : isCurrentInWishlist ? (
                                    <i className="fas fa-heart"></i>
                                ) : (
                                    <i className="far fa-heart"></i>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="product-info-detail">
                        <h1 className="product-title-detail">{product.product_name}</h1>

                        <div className="product-meta-row">
                            <div className="product-rating-summary">
                                {renderStars(product.rating || 4.5)}
                                <span className="review-count">({reviews.total || 0} reviews)</span>
                            </div>
                            {product.brand && (
                                <div className="product-brand-badge">
                                    Brand: <strong>{product.brand.brand_name}</strong>
                                </div>
                            )}
                        </div>

                        {selectedVariant && (
                            <div className="product-price-main">
                                <div className="price-block">
                                    <span className="current-price">
                                        ₹{selectedVariant.final_price?.toLocaleString() || selectedVariant.price?.toLocaleString()}
                                    </span>
                                    {selectedVariant.discount_value > 0 && (
                                        <div className="price-savings">
                                            <span className="original-price">
                                                ₹{selectedVariant.price?.toLocaleString()}
                                            </span>
                                            <span className="discount-badge">{discount}% OFF</span>
                                        </div>
                                    )}
                                </div>
                                <span className="tax-note">Inclusive of all taxes</span>
                            </div>
                        )}

                        <div className="product-description-short">
                            {product.description?.substring(0, 180)}...
                            <button className="read-more-link" onClick={() => setActiveTab('details')}>Read more</button>
                        </div>

                        {product.variants && product.variants.length > 1 && (
                            <div className="product-variants-section">
                                <div className="section-header">
                                    <h3>Select Option:</h3>
                                    <span className="selected-variant-name">{selectedVariant?.variant_name}</span>
                                </div>
                                <div className="variant-options-grid">
                                    {product.variants.map((variant, index) => (
                                        <button
                                            key={variant.variant_id}
                                            className={`variant-btn ${selectedVariant?.variant_id === variant.variant_id ? 'active' : ''} ${variant.stock_quantity === 0 ? 'disabled' : ''}`}
                                            onClick={() => handleVariantChange(variant)}
                                            disabled={variant.stock_quantity === 0}
                                        >
                                            {variant.variant_name || `Option ${index + 1}`}
                                            {variant.stock_quantity === 0 && (
                                                <span className="variant-stock-status">Out of Stock</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedVariant && (
                            <div className="purchase-actions-container">
                                <div className="quantity-wrapper">
                                    <label>Quantity</label>
                                    <div className="quantity-controls">
                                        <button
                                            onClick={() => handleQuantityChange('decrement')}
                                            disabled={quantity <= 1}
                                            className="qty-btn"
                                        >
                                            <i className="fas fa-minus"></i>
                                        </button>
                                        <span className="quantity-display">{quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange('increment')}
                                            disabled={quantity >= (selectedVariant.stock_quantity || 1)}
                                            className="qty-btn"
                                        >
                                            <i className="fas fa-plus"></i>
                                        </button>
                                    </div>
                                    <span className="stock-status-text">
                                        {selectedVariant.stock_quantity < 10 && selectedVariant.stock_quantity > 0 ? (
                                            <span className="low-stock">Only {selectedVariant.stock_quantity} left!</span>
                                        ) : selectedVariant.stock_quantity > 0 ? (
                                            <span className="in-stock">In Stock</span>
                                        ) : (
                                            <span className="out-of-stock">Currently Unavailable</span>
                                        )}
                                    </span>
                                </div>

                                <div className="action-buttons-group">
                                    <button
                                        className="btn-add-to-cart-detail"
                                        onClick={handleAddToCart}
                                        disabled={!selectedVariant || selectedVariant.stock_quantity === 0}
                                    >
                                        <i className="fas fa-cart-plus"></i>
                                        Add to Cart
                                    </button>
                                    <button
                                        className="btn-buy-now-detail"
                                        onClick={handleBuyNow}
                                        disabled={!selectedVariant || selectedVariant.stock_quantity === 0}
                                    >
                                        <i className="fas fa-bolt"></i>
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="trust-delivery-info">
                            <div className="trust-item">
                                <div className="trust-icon"><i className="fas fa-shield-alt"></i></div>
                                <span>Secure Transaction</span>
                            </div>
                            <div className="trust-item">
                                <div className="trust-icon"><i className="fas fa-shipping-fast"></i></div>
                                <span>Fast Delivery</span>
                            </div>
                            <div className="trust-item">
                                <div className="trust-icon"><i className="fas fa-undo-alt"></i></div>
                                <span>Easy Returns</span>
                            </div>
                            <div className="trust-item">
                                <div className="trust-icon"><i className="fas fa-check-decagram"></i></div>
                                <span>Verified Seller</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="product-bottom-split">
                    <div className="details-column">
                        <h3 className="section-heading">Product Details</h3>
                        <div className="product-specifications">
                            {product.brand && (
                                <div className="spec-item">
                                    <strong>Brand:</strong> {product.brand.brand_name}
                                </div>
                            )}
                            {product.category && (
                                <div className="spec-item">
                                    <strong>Category:</strong> {product.category.category_name}
                                </div>
                            )}
                            {product.subcategory && (
                                <div className="spec-item">
                                    <strong>Subcategory:</strong> {product.subcategory.sub_category_name}
                                </div>
                            )}
                            {selectedVariant && (
                                <>
                                    <div className="spec-item">
                                        <strong>Variant:</strong> {selectedVariant.variant_name || 'Default'}
                                    </div>
                                    <div className="spec-item">
                                        <strong>Stock:</strong> {selectedVariant.stock_quantity || 0} units available
                                    </div>
                                    <div className="spec-item">
                                        <strong>Status:</strong> {selectedVariant.status || 'ACTIVE'}
                                    </div>
                                </>
                            )}
                        </div>

                        <h3 className="section-heading mt-6">Description</h3>
                        <p className="full-description">{product.description}</p>
                    </div>

                    <div className="reviews-column">
                        <h3 className="section-heading">Customer Reviews ({reviews.total})</h3>
                        <div className="add-review-section">
                            <h4 className="sub-heading">Write a Review</h4>
                            <div className="review-form">
                                <div className="form-group">
                                    <label>Rating:</label>
                                    <div className="rating-input">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star-btn ${newReview.rating >= star ? 'active' : ''}`}
                                                onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                            >
                                                <i className="fas fa-star"></i>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Review Title"
                                        value={newReview.title}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                                        className="review-title-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <textarea
                                        placeholder="Share your experience..."
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                        rows="4"
                                        className="review-comment-input"
                                    ></textarea>
                                </div>
                                <button
                                    className="btn-submit-review"
                                    onClick={handleAddReview}
                                >
                                    Submit Review
                                </button>
                            </div>
                        </div>

                        <div className="reviews-list-section">
                            {reviewsLoading ? (
                                <div className="loading-reviews">Loading reviews...</div>
                            ) : reviews.items.length > 0 ? (
                                <div className="reviews-list">
                                    {reviews.items.map((review) => (
                                        <div key={review.review_id} className="review-card">
                                            <div className="review-header">
                                                <div className="reviewer-info">
                                                    <div className="reviewer-avatar">
                                                        {review.user_name ? review.user_name.charAt(0) : 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="reviewer-name">
                                                            {review.user_name || 'Anonymous User'}
                                                        </div>
                                                        <div className="review-date">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="review-rating">
                                                    {renderStars(review.rating)}
                                                </div>
                                            </div>
                                            <h4 className="review-title">{review.title}</h4>
                                            <p className="review-comment">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-reviews">
                                    <i className="fas fa-comment-slash"></i>
                                    <p>No reviews yet. Be the first to review this product!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="recommendations-section">
                    <div className="rec-tabs-header">
                        <button
                            className={`rec-tab-btn ${recTab === 'category' ? 'active' : ''}`}
                            onClick={() => setRecTab('category')}
                        >
                            Similar Products
                        </button>
                        {brandProducts.length > 0 && (
                            <button
                                className={`rec-tab-btn ${recTab === 'brand' ? 'active' : ''}`}
                                onClick={() => setRecTab('brand')}
                            >
                                More from {product.brand?.brand_name}
                            </button>
                        )}
                    </div>

                    <div className="recommendations-grid">
                        {(recTab === 'category' ? recProducts : brandProducts).map((rec, index) => {
                            const variant = rec.default_variant || {};
                            // Use same gradient logic as Home
                            const gradient = gradientColors[index % gradientColors.length];

                            return (
                                <ProductCard
                                    key={rec.product_id}
                                    id={rec.product_id}
                                    title={rec.product_name}
                                    description={rec.description || "High quality product"}
                                    price={variant.final_price || variant.price || 0}
                                    originalPrice={variant.discount_value > 0 ? variant.price : null}
                                    image={variant.images?.[0]?.url || null}
                                    rating={rec.rating || 4.5}
                                    reviewCount={rec.review_count || 12}
                                    gradient={gradient}
                                    variantId={variant.variant_id}
                                    inStock={variant.stock_quantity > 0}
                                />
                            );
                        })}

                        {(recTab === 'category' ? recProducts : brandProducts).length === 0 && (
                            <p className="no-recs-msg">No related products found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;