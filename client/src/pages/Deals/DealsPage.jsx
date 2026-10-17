import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCouponContext } from '../../context/CouponContext'; // Changed from useCoupon
import { useOfferContext } from '../../context/OfferContext'; // Changed from useOffer
import { useCartContext } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { fetchDiscountedProducts } from '../../api/product';
import ProductCard from '../../components/ProductCard/ProductCard';
import './DealsPage.css';

const DealsPage = () => {
  const navigate = useNavigate();
  const { activeCoupons, fetchActiveCoupons, loading: couponsLoading } = useCouponContext(); // Changed from useCoupon
  const { activeOffers, fetchActiveOffers, loading: offersLoading } = useOfferContext(); // Changed from useOffer
  const { addItemToCart } = useCartContext();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [discountFilters, setDiscountFilters] = useState({
    min_discount_percentage: 10,
    sort_by: 'discount_desc'
  });
  const [error, setError] = useState(null);

  const gradientColors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  ];

  // Generate local SVG placeholder
  const generateLocalSVG = (text, width = 300, height = 200, bgColor = '667eea') => {
    const safeText = String(text || 'Product').substring(0, 20);
    const escapedText = safeText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#${bgColor}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            fill="#ffffff" font-family="Arial, sans-serif" font-size="14">
        ${escapedText}
      </text>
    </svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // Handle image error


  // Load deals data
  useEffect(() => {
    const loadDeals = async () => {
      try {
        await Promise.all([
          fetchActiveCoupons(),
          fetchActiveOffers(),
          loadDiscountedProducts()
        ]);
      } catch (error) {
        console.error('Error loading deals:', error);
        setError('Failed to load deals. Please try again.');
      }
    };

    loadDeals();
  }, [discountFilters]);

  // Load discounted products from backend
  const loadDiscountedProducts = async () => {
    setIsLoadingProducts(true);
    setError(null);

    try {
      const result = await fetchDiscountedProducts({
        page: 1,
        per_page: 12,
        sort_by: discountFilters.sort_by,
        min_discount_percentage: discountFilters.min_discount_percentage
      });

      if (result.success) {
        // Transform backend data to frontend format
        const formattedProducts = (result.data.items || []).map(item => {
          const originalPrice = parseFloat(item.default_variant?.price || 0);
          const finalPrice = parseFloat(item.default_variant?.final_price || 0);
          const discountPercent = originalPrice > 0 ?
            Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;

          // Get first image or use placeholder
          let imageUrl;
          if (item.default_variant?.images?.[0]?.url) {
            imageUrl = item.default_variant.images[0].url;
          } else if (item.images?.[0]?.url) {
            imageUrl = item.images[0].url;
          } else {
            imageUrl = generateLocalSVG(item.product_name || 'Product', 300, 200, '667eea');
          }

          return {
            product_id: item.product_id,
            title: item.product_name || 'Unnamed Product',
            description: item.description || `${item.brand?.brand_name || ''} - Limited time offer!`,
            price: finalPrice,
            original_price: originalPrice,
            discount_percentage: discountPercent,
            discount_type: item.default_variant?.discount_type || 'NONE',
            discount_value: parseFloat(item.default_variant?.discount_value || 0),
            image_url: imageUrl,
            stock_quantity: item.default_variant?.stock_quantity || 0,
            status: item.default_variant?.status || 'IN_STOCK',
            brand: item.brand,
            category: item.category?.category_name || 'General',
            variant_id: item.default_variant?.variant_id,
            created_at: item.created_at
          };
        });

        console.log(`Formatted ${formattedProducts.length} products`);
        setDiscountedProducts(formattedProducts);
      } else {
        console.error('Failed to load discounted products:', result.message);
        setError(result.message || 'Failed to load discounted products');
        setDiscountedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching discounted products:', error);
      setError('Error loading products. Please try again.');
      setDiscountedProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Filter products by minimum discount
  const getFilteredDiscountedProducts = useCallback(() => {
    return discountedProducts.filter(product =>
      product.discount_percentage >= discountFilters.min_discount_percentage
    );
  }, [discountedProducts, discountFilters.min_discount_percentage]);

  // Copy coupon code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Apply coupon to cart
  const applyCoupon = (couponCode) => {
    if (isAuthenticated) {
      navigate('/cart', { state: { appliedCoupon: couponCode } });
    } else {
      navigate('/login', { state: { redirectTo: '/cart', coupon: couponCode } });
    }
  };



  // Update discount filter
  const updateDiscountFilter = (key, value) => {
    setDiscountFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const isLoading = couponsLoading || offersLoading || isLoadingProducts;
  const filteredProducts = getFilteredDiscountedProducts();

  // DEBUG: Log what's being rendered
  console.log('DEBUG: Discounted products:', discountedProducts.length);
  console.log('DEBUG: Filtered products:', filteredProducts.length);
  console.log('DEBUG: Active coupons:', activeCoupons.length);
  console.log('DEBUG: Active offers:', activeOffers.length);
  console.log('DEBUG: Active tab:', activeTab);
  console.log('DEBUG: Error:', error);

  return (
    <div className="deals-page">
      {/* ===== Hero Banner ===== */}
      <div className="deals-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">🔥 Exclusive Deals & Offers</h1>
          <p className="hero-subtitle">
            Limited time offers, coupons, and discounts you can't miss!
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <i className="fas fa-tag"></i>
              <div>
                <span className="stat-number">{activeCoupons.length}+</span>
                <span className="stat-label">Active Coupons</span>
              </div>
            </div>
            <div className="stat-item">
              <i className="fas fa-percentage"></i>
              <div>
                <span className="stat-number">{activeOffers.length}+</span>
                <span className="stat-label">Special Offers</span>
              </div>
            </div>
            <div className="stat-item">
              <i className="fas fa-shopping-bag"></i>
              <div>
                <span className="stat-number">{filteredProducts.length}+</span>
                <span className="stat-label">Discounted Products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="deals-container">
        {/* Tab Navigation */}
        <div className="deals-tabs">
          {['all', 'coupons', 'offers', 'products'].map((tab) => (
            <button
              key={tab}
              className={`deals-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <i className={`fas ${tab === 'all' ? 'fa-fire' :
                tab === 'coupons' ? 'fa-tag' :
                  tab === 'offers' ? 'fa-percentage' :
                    'fa-shopping-bag'
                }`}></i>
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              <span className="tab-badge">
                {tab === 'all' ? activeCoupons.length + activeOffers.length + filteredProducts.length :
                  tab === 'coupons' ? activeCoupons.length :
                    tab === 'offers' ? activeOffers.length :
                      filteredProducts.length}
              </span>
            </button>
          ))}
        </div>

        {/* Discount Filter Bar (for products tab) */}
        {(activeTab === 'products' || activeTab === 'all') && (
          <div className="discount-filter-bar">
            <div className="filter-group">
              <label htmlFor="minDiscount">
                <i className="fas fa-percent"></i> Minimum Discount
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="minDiscount"
                  min="0"
                  max="90"
                  step="5"
                  value={discountFilters.min_discount_percentage}
                  onChange={(e) => updateDiscountFilter('min_discount_percentage', parseInt(e.target.value))}
                  className="discount-slider"
                />
                <span className="slider-value">{discountFilters.min_discount_percentage}% OFF</span>
              </div>
            </div>
            <div className="filter-group">
              <label htmlFor="sortBy">
                <i className="fas fa-sort-amount-down"></i> Sort By
              </label>
              <select
                id="sortBy"
                value={discountFilters.sort_by}
                onChange={(e) => updateDiscountFilter('sort_by', e.target.value)}
                className="sort-select"
              >
                <option value="discount_desc">Highest Discount</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
            <button
              className="reset-filters-btn"
              onClick={() => setDiscountFilters({
                min_discount_percentage: 10,
                sort_by: 'discount_desc'
              })}
            >
              <i className="fas fa-redo"></i> Reset Filters
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
            <button onClick={loadDiscountedProducts}>
              <i className="fas fa-redo"></i> Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="deal-card-skeleton">
                <div className="skeleton-image"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Coupons Section */}
            {(activeTab === 'all' || activeTab === 'coupons') && activeCoupons.length > 0 && (
              <div className="deals-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <i className="fas fa-tag"></i>
                    Active Coupons
                  </h2>
                  <p className="section-subtitle">Copy & apply these coupon codes at checkout</p>
                </div>
                <div className="coupons-grid">
                  {activeCoupons.slice(0, 6).map((coupon) => (
                    <div key={coupon.coupon_id} className="coupon-card">
                      <div className="coupon-ribbon">HOT</div>
                      <div className="coupon-content">
                        <div className="coupon-discount">
                          <span className="discount-value">
                            {coupon.discount_type === 'PERCENT'
                              ? `${coupon.discount_value}%`
                              : `$${coupon.discount_value}`}
                          </span>
                          <span className="discount-text">OFF</span>
                        </div>
                        <div className="coupon-details">
                          <h3 className="coupon-title">{coupon.code}</h3>
                          <p className="coupon-description">
                            {coupon.description || `Save ${coupon.discount_type === 'PERCENT' ? coupon.discount_value + '%' : '$' + coupon.discount_value} on your purchase`}
                          </p>
                          <div className="coupon-terms">
                            <span className="term-item">
                              <i className="fas fa-shopping-cart"></i>
                              Min. ${coupon.minimum_order || 0}
                            </span>
                            <span className="term-item">
                              <i className="fas fa-calendar"></i>
                              {new Date(coupon.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="coupon-actions">
                        <button
                          className={`copy-btn ${copiedCode === coupon.code ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(coupon.code)}
                        >
                          {copiedCode === coupon.code ? (
                            <>
                              <i className="fas fa-check"></i>
                              Copied!
                            </>
                          ) : (
                            <>
                              <i className="fas fa-copy"></i>
                              Copy Code
                            </>
                          )}
                        </button>
                        <button
                          className="apply-btn"
                          onClick={() => applyCoupon(coupon.code)}
                        >
                          <i className="fas fa-shopping-cart"></i>
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {activeCoupons.length > 6 && (
                  <div className="view-more">
                    <button className="view-more-btn" onClick={() => navigate('/coupons')}>
                      View All {activeCoupons.length} Coupons
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Offers Section */}
            {(activeTab === 'all' || activeTab === 'offers') && activeOffers.length > 0 && (
              <div className="deals-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <i className="fas fa-percentage"></i>
                    Special Offers
                  </h2>
                  <p className="section-subtitle">Automatic discounts - no code needed!</p>
                </div>
                <div className="offers-grid">
                  {activeOffers.slice(0, 4).map((offer, index) => (
                    <div key={offer.offer_id} className="offer-card">
                      <div className="offer-badge">
                        {offer.discount_type === 'PERCENT'
                          ? `${offer.discount_value}% OFF`
                          : `$${offer.discount_value} OFF`}
                      </div>
                      <div className="offer-content">
                        <div className="offer-icon">
                          <i className={`fas ${index % 4 === 0 ? 'fa-bolt' :
                            index % 4 === 1 ? 'fa-star' :
                              index % 4 === 2 ? 'fa-gift' :
                                'fa-rocket'
                            }`}></i>
                        </div>
                        <div className="offer-details">
                          <h3 className="offer-title">{offer.title}</h3>
                          <p className="offer-description">{offer.description}</p>
                          <div className="offer-meta">
                            <span className="meta-item">
                              <i className="fas fa-calendar"></i>
                              Valid until {new Date(offer.end_date).toLocaleDateString()}
                            </span>
                            {offer.minimum_order && (
                              <span className="meta-item">
                                <i className="fas fa-shopping-cart"></i>
                                Min. ${offer.minimum_order}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        className="offer-cta"
                        onClick={() => navigate('/products')}
                      >
                        Shop Eligible Products
                        <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discounted Products Section */}
            {(activeTab === 'all' || activeTab === 'products') && filteredProducts.length > 0 && (
              <div className="deals-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <i className="fas fa-shopping-bag"></i>
                    Hot Deals on Products
                    <span className="section-badge">
                      {filteredProducts.length} products
                    </span>
                  </h2>
                  <p className="section-subtitle">
                    Showing products with {discountFilters.min_discount_percentage}% or more discount
                  </p>
                </div>
                <div className="products-grid">
                  {filteredProducts.slice(0, 8).map((product, index) => (
                    <ProductCard
                      key={product.product_id}
                      id={product.product_id}
                      variantId={product.variant_id}
                      title={product.title}
                      description={product.description}
                      price={product.price}
                      originalPrice={product.original_price}
                      image={product.image_url}
                      rating={4.8} // Placeholder rating since deals API might not return it
                      reviewCount={product.stock_quantity * 3 + 10} // Mock count for visual
                      gradient={gradientColors[index % gradientColors.length]}
                      inStock={product.status !== 'OUT_OF_STOCK'}
                    />
                  ))}
                </div>
                {filteredProducts.length > 8 && (
                  <div className="view-more">
                    <button className="view-more-btn" onClick={() => navigate('/products?has_discount=true')}>
                      View All {filteredProducts.length} Discounted Products
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {((activeTab === 'all' && activeCoupons.length === 0 && activeOffers.length === 0 && filteredProducts.length === 0) ||
              (activeTab === 'coupons' && activeCoupons.length === 0) ||
              (activeTab === 'offers' && activeOffers.length === 0) ||
              (activeTab === 'products' && filteredProducts.length === 0)) && (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-tag"></i>
                  </div>
                  <h3>No {activeTab === 'all' ? '' : activeTab} Deals Available</h3>
                  <p>Check back soon for exciting offers and discounts!</p>
                  <button
                    className="browse-btn"
                    onClick={() => navigate('/products')}
                  >
                    <i className="fas fa-store"></i>
                    Browse All Products
                  </button>
                </div>
              )}
          </>
        )}

        {/* How to Use Section */}
        <div className="instructions-section">
          <h2 className="instructions-title">How to Use These Deals</h2>
          <div className="instructions-grid">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <div className="step-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3>Find Deals</h3>
              <p>Browse through coupons, offers, and discounted products</p>
            </div>
            <div className="instruction-step">
              <div className="step-number">2</div>
              <div className="step-icon">
                <i className="fas fa-copy"></i>
              </div>
              <h3>Copy Code</h3>
              <p>Click "Copy Code" for coupons or shop directly for offers</p>
            </div>
            <div className="instruction-step">
              <div className="step-number">3</div>
              <div className="step-icon">
                <i className="fas fa-shopping-cart"></i>
              </div>
              <h3>Apply at Checkout</h3>
              <p>Use the coupon code during checkout to get discount</p>
            </div>
            <div className="instruction-step">
              <div className="step-number">4</div>
              <div className="step-icon">
                <i className="fas fa-save"></i>
              </div>
              <h3>Save Money</h3>
              <p>Enjoy instant savings on your purchase!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealsPage;