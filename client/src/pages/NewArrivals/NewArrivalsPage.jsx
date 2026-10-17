import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartContext } from '../../context/CartContext'; // Changed from useCart
import { useAuth } from '../../context/AuthContext';
import {
  fetchNewArrivals,
  fetchTrendingProducts,
  fetchProductsByCategory,
  fetchCategories
} from '../../api/product';
import ProductCard from '../../components/ProductCard/ProductCard';
import './NewArrivalsPage.css';

const NewArrivalsPage = () => {
  const navigate = useNavigate();
  const { addItemToCart } = useCartContext(); // Changed from addToCart to addItemToCart
  const { isAuthenticated } = useAuth();

  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [stats, setStats] = useState({
    totalProducts: 0,
    trendingCount: 0,
    newThisWeek: 0
  });

  const gradientColors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  ];

  // Generate local SVG placeholder (NO external dependencies)
  const generateLocalSVG = (text, width = 400, height = 300, bgColor = '667eea', textColor = 'ffffff') => {
    const safeText = String(text || 'Product').substring(0, 20);
    // Escape special characters for XML
    const escapedText = safeText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#${bgColor}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            fill="#${textColor}" font-family="Arial, sans-serif" 
            font-size="${width < 100 ? '12' : '16'}">
        ${escapedText}
      </text>
    </svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // Helper function for trending product image
  const getTrendingProductImageUrl = (product) => {
    if (!product) {
      return generateLocalSVG('Product', 80, 80, '667eea');
    }

    if (product.default_variant?.images?.[0]?.url) {
      return product.default_variant.images[0].url;
    }

    const productName = product.product_name || 'Product';
    return generateLocalSVG(productName.substring(0, 2), 80, 80, '667eea');
  };

  // Handle image error with LOCAL fallback (NO external calls)
  const handleImageError = (e) => {
    const altText = e.target.alt || 'Product';
    const width = e.target.width || 400;
    const height = e.target.height || 300;
    const bgColor = width === 80 ? '667eea' : '94a3b8';

    // Generate local SVG
    const safeText = altText.substring(0, width === 80 ? 2 : 20);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#${bgColor}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            fill="#ffffff" font-family="Arial" font-size="${width === 80 ? '12' : '16'}">
        ${safeText}
      </text>
    </svg>`;

    e.target.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    e.target.onerror = null; // Prevent infinite loop
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Load categories
        const categoriesResult = await fetchCategories();
        if (categoriesResult.success) {
          setAllCategories(categoriesResult.data || []);
        }

        // Load trending products
        await loadTrendingProducts();

        // Load new arrivals
        await loadNewArrivals();

      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load new arrivals based on filter and sort
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (filter === 'all') {
          const result = await fetchNewArrivals({
            per_page: 24,
            sort_by: sortBy
          });
          if (result.success) {
            const items = result.data.items || [];
            setNewArrivals(items);
            setStats(prev => ({
              ...prev,
              totalProducts: result.data.total || items.length,
              newThisWeek: items.length
            }));
          } else {
            setNewArrivals([]);
          }
        } else {
          const result = await fetchProductsByCategory(filter, {
            per_page: 24,
            sort_by: sortBy
          });
          if (result.success) {
            const items = result.data.items || [];
            setNewArrivals(items);
            setStats(prev => ({
              ...prev,
              totalProducts: result.data.total || items.length
            }));
          } else {
            setNewArrivals([]);
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setNewArrivals([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filter, sortBy]);

  // Load trending products
  const loadTrendingProducts = async () => {
    try {
      const result = await fetchTrendingProducts(3);
      if (result.success) {
        const items = result.data.items || [];
        setTrendingProducts(items);
        setStats(prev => ({
          ...prev,
          trendingCount: result.data.total || items.length
        }));
      } else {
        setTrendingProducts([]);
      }
    } catch (error) {
      console.error('Error loading trending products:', error);
      setTrendingProducts([]);
    }
  };

  // Load new arrivals
  const loadNewArrivals = async () => {
    try {
      const result = await fetchNewArrivals({
        per_page: 24,
        sort_by: sortBy
      });

      if (result.success) {
        const items = result.data.items || [];
        setNewArrivals(items);
        setStats(prev => ({
          ...prev,
          totalProducts: result.data.total || items.length,
          newThisWeek: items.length
        }));
      } else {
        setNewArrivals([]);
      }
    } catch (error) {
      console.error('Error loading new arrivals:', error);
      setNewArrivals([]);
    }
  };

  // Helper functions
  const getCategoryColor = (category) => {
    const colors = {
      'Electronics': '667eea',
      'Fashion': 'ff6b6b',
      'Home & Kitchen': '10b981',
      'Sports': 'f59e0b',
      'Beauty': '8b5cf6',
      'Books': '6366f1',
      'Uncategorized': '94a3b8'
    };
    return colors[category] || colors['Uncategorized'];
  };





  const categories = ['all', ...allCategories.map(cat => cat.category_name).filter(name => name)];

  return (
    <div className="new-arrivals-page">
      {/* ===== Hero Banner ===== */}
      <div className="arrivals-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">✨ New Arrivals</h1>
          <p className="hero-subtitle">
            Discover the latest products fresh in stock! Be the first to experience innovation.
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <i className="fas fa-rocket"></i>
              <div>
                <span className="stat-number">{stats.newThisWeek}+</span>
                <span className="stat-label">New This Week</span>
              </div>
            </div>
            <div className="stat-item">
              <i className="fas fa-bolt"></i>
              <div>
                <span className="stat-number">{stats.trendingCount}</span>
                <span className="stat-label">Trending Now</span>
              </div>
            </div>
            <div className="stat-item">
              <i className="fas fa-box"></i>
              <div>
                <span className="stat-number">{stats.totalProducts}+</span>
                <span className="stat-label">Total Products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="arrivals-container">
        {/* Controls Bar */}
        <div className="controls-bar">
          <div className="filters">
            <div className="filter-group">
              <span className="filter-label">
                <i className="fas fa-filter"></i>
                Filter by:
              </span>
              <div className="category-filters">
                {categories.slice(0, 7).map(category => (
                  <button
                    key={category}
                    className={`category-filter ${filter === category ? 'active' : ''}`}
                    onClick={() => setFilter(category)}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sort-options">
            <span className="sort-label">
              <i className="fas fa-sort"></i>
              Sort by:
            </span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Trending Banner */}
        {trendingProducts.length > 0 && (
          <div className="trending-banner">
            <div className="trending-icon">
              <i className="fas fa-fire"></i>
            </div>
            <div className="trending-content">
              <h3>🔥 Trending This Week</h3>
              <p>Customers are loving these new arrivals!</p>
            </div>
            <div className="trending-products">
              {trendingProducts.map(product => {
                const imageUrl = getTrendingProductImageUrl(product);

                return (
                  <div
                    key={product.product_id || Math.random()}
                    className="trending-product"
                    onClick={() => navigate(`/products/${product.product_id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={imageUrl}
                      alt={product.product_name || 'Product'}
                      onError={handleImageError}
                      loading="lazy"
                      width="80"
                      height="80"
                    />
                    <div className="trending-info">
                      <span className="trending-name">
                        {product.product_name || 'Product'}
                      </span>
                      <span className="trending-price">
                        ${product.default_variant?.final_price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="product-card-skeleton">
                <div className="skeleton-image"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
                <div className="skeleton-line"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="arrivals-grid">
              {newArrivals.map((product, index) => {
                const productName = product.product_name || 'Product';
                const imageUrl = product.default_variant?.images?.[0]?.url;

                return (
                  <ProductCard
                    key={product.product_id}
                    id={product.product_id}
                    variantId={product.default_variant?.variant_id}
                    title={productName}
                    description={product.description || 'Check out this amazing new product!'}
                    price={product.default_variant?.final_price || 0}
                    originalPrice={product.default_variant?.price}
                    image={imageUrl}
                    rating={4.8} // Mock rating
                    reviewCount={Math.floor(Math.random() * 50) + 5} // Mock reviews
                    gradient={gradientColors[index % gradientColors.length]}
                    inStock={product.default_variant?.status !== 'OUT_OF_STOCK'}
                  />
                );
              })}
            </div>

            {/* Empty State */}
            {newArrivals.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-box-open"></i>
                </div>
                <h3>No New Arrivals Found</h3>
                <p>Try selecting a different category or check back soon for new products!</p>
                <button
                  className="browse-btn"
                  onClick={() => setFilter('all')}
                >
                  <i className="fas fa-store"></i>
                  View All Categories
                </button>
              </div>
            )}
          </>
        )}

        {/* Features Banner */}
        <div className="features-banner">
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-shipping-fast"></i>
            </div>
            <div className="feature-content">
              <h4>Free Shipping</h4>
              <p>On all orders over $50</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-undo"></i>
            </div>
            <div className="feature-content">
              <h4>30-Day Returns</h4>
              <p>Easy returns policy</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="feature-content">
              <h4>2-Year Warranty</h4>
              <p>On all electronics</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-headset"></i>
            </div>
            <div className="feature-content">
              <h4>24/7 Support</h4>
              <p>Dedicated customer service</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <div className="cta-content">
            <h2>Never Miss a New Arrival!</h2>
            <p>Subscribe to our newsletter and get notified about the latest products.</p>
            <div className="subscribe-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="subscribe-input"
              />
              <button className="subscribe-btn">
                Subscribe <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewArrivalsPage;