// frontend/src/pages/Home/Home.jsx - WITH WORKING PAGINATION
import React, { useEffect, useState } from "react";
import { fetchProducts } from "../../api/product";
import ProductCard from "../../components/ProductCard/ProductCard";
import { Link } from 'react-router-dom';
import { toastSuccess, toastError, toastWarning, toastInfo } from '../../utils/customToast';
import { useAuth } from "../../context/AuthContext";
import "./Home.css";

const Home = () => {
  const { user, isAdmin, isDeliveryPerson } = useAuth();
  const gradientColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ];

  const [products, setProducts] = useState({ items: [], total: 0, page: 1, total_pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSort, setActiveSort] = useState("Newest First");
  const [selectedFilters, setSelectedFilters] = useState({
    type: null,
    brand: null,
    price_range: null,
    rating: null,
  });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [openFilter, setOpenFilter] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch products from backend with filters and sorting
  const fetchProductsData = async (page = 1, sort = activeSort, filters = selectedFilters) => {
    setLoading(true);
    const params = {
      page,
      per_page: 20,
      sort_by: mapSortOption(sort),
      ...filters,
    };

    if (filters.price_range) {
      const [min, max] = filters.price_range.split('-');
      params.min_price = parseFloat(min);
      params.max_price = max.includes('+') ? undefined : parseFloat(max);
      delete params.price_range;
    }

    try {
      console.log(`📄 Fetching page ${page} with params:`, params);
      const response = await fetchProducts(params);
      if (response.success) {
        console.log(`✅ Loaded page ${page}:`, response.data);
        setProducts(response.data);
        setCurrentPage(page);

        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.error("Failed to load products.");
        setProducts({ items: [], total: 0, page: 1, total_pages: 1 });
      }
    } catch (error) {
      console.error("Product Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Map frontend sort names to backend query values
  const mapSortOption = (sortOption) => {
    switch (sortOption) {
      case "Price: Low to High":
        return "price_low";
      case "Price: High to Low":
        return "price_high";
      case "Name: A to Z":
        return "name_asc";
      case "Name: Z to A":
        return "name_desc";
      case "Newest First":
      default:
        return "newest";
    }
  };

  // ✅ Handles dropdown filter option selection
  const handleFilterSelect = (key, value) => {
    setLoading(true);
    const isCurrentlySelected = selectedFilters[key] === value;
    const updatedFilters = {
      ...selectedFilters,
      [key]: isCurrentlySelected ? null : value
    };

    setSelectedFilters(updatedFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
    fetchProductsData(1, activeSort, updatedFilters);
    setOpenFilter(null);
  };

  // ✅ Handles sorting changes
  const handleSortChange = (option) => {
    setActiveSort(option);
    setCurrentPage(1); // Reset to page 1 when sort changes
    fetchProductsData(1, option, selectedFilters);
    setShowSortMenu(false);
  };

  // ✅ Handle page navigation
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > products.total_pages) return;
    fetchProductsData(newPage, activeSort, selectedFilters);
  };

  // ✅ Toggle filter dropdown
  const toggleFilterMenu = (filter) => {
    setOpenFilter(openFilter === filter ? null : filter);
  };

  // ✅ Close all menus when clicking outside
  useEffect(() => {
    fetchProductsData(1);

    const closeMenus = () => {
      setOpenFilter(null);
      setShowSortMenu(false);
    };
    window.addEventListener("click", closeMenus);
    return () => window.removeEventListener("click", closeMenus);
  }, []);

  const ProductContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Finding the best products for you...</p>
        </div>
      );
    }
    if (products.items.length === 0) {
      return (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <h3>No products found</h3>
          <p>Try adjusting your filters or search criteria.</p>
          <button onClick={() => {
            setSelectedFilters({ type: null, brand: null, price_range: null, rating: null });
            fetchProductsData(1, activeSort, { type: null, brand: null, price_range: null, rating: null });
          }} className="clear-filters-btn">
            Clear All Filters
          </button>
        </div>
      );
    }

    return (
      <div className="products-grid">
        {products.items.map((product, index) => {
          const variant = product.default_variant;

          return (
            <ProductCard
              key={product.product_id}
              id={product.product_id}
              title={product.product_name}
              description={product.description || "High quality product"}
              price={variant.final_price || variant.price || 0}
              originalPrice={variant.discount_value > 0 ? variant.price : null}
              image={variant.images?.[0]?.url || null}
              rating={product.rating || 4.5}
              reviewCount={product.review_count || variant.stock_quantity * 5}
              gradient={gradientColors[index % gradientColors.length]}
              variantId={variant.variant_id}
              inStock={variant.stock_quantity > 0}
            />
          );
        })}
      </div>
    );
  };

  // ✅ Generate page numbers for pagination
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const totalPages = products.total_pages;
    const current = currentPage;

    // Show first page
    if (totalPages > 0) {
      pageNumbers.push(
        <button
          key={1}
          className={`page-number ${current === 1 ? 'active' : ''}`}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
    }

    // Show ellipsis if needed
    if (current > 3) {
      pageNumbers.push(<span key="ellipsis-1" className="page-ellipsis">...</span>);
    }

    // Show pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
      pageNumbers.push(
        <button
          key={i}
          className={`page-number ${current === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Show ellipsis if needed
    if (current < totalPages - 2) {
      pageNumbers.push(<span key="ellipsis-2" className="page-ellipsis">...</span>);
    }

    // Show last page
    if (totalPages > 1) {
      pageNumbers.push(
        <button
          key={totalPages}
          className={`page-number ${current === totalPages ? 'active' : ''}`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className="home-page">



      <main className="main-content">
        {/* CONDITIONAL DASHBOARD ACCESS SECTION (For Admin & Delivery) */}
        {user && (isAdmin() || isDeliveryPerson()) && (
          <section className="about-section dashboard-access-section" style={{
            background: isAdmin() ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white'
          }}>
            <div className="about-container">
              <div className="about-content">
                <span className="section-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {isAdmin() ? 'Administration' : 'Delivery Panel'}
                </span>
                <h2 style={{ color: 'white' }}>Welcome Back, {user.first_name || 'Partner'}</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {isAdmin()
                    ? "Access your admin dashboard to manage products, orders, users, and view analytics efficiently."
                    : "Access your delivery panel to view assigned orders, update status, and manage your deliveries."}
                </p>
                <Link
                  to={isAdmin() ? "/admin/dashboard" : "/delivery/dashboard"}
                  className="about-btn"
                  style={{
                    marginTop: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'white',
                    color: isAdmin() ? '#4f46e5' : '#10b981',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  Go to Dashboard <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              <div className="about-visual">
                <div className="visual-circle" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                  <i className={isAdmin() ? "fas fa-user-shield" : "fas fa-motorcycle"} style={{ color: 'white' }}></i>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 1️⃣ ABOUT US SECTION (Professional & Trust-Building) */}
        <section className="about-section">
          <div className="about-container">
            <div className="about-content">
              <span className="section-subtitle">Discover Nexora</span>
              <h2>Redefining Your Shopping Experience</h2>
              <p>
                At Nexora, we believe shopping should be intelligent, seamless, and enjoyable.
                Powered by cutting-edge AI and trusted by thousands of sellers, we bring you
                premium products with unmatched quality assurance.
              </p>
              <div className="about-highlights">
                <div className="highlight-item">
                  <i className="fas fa-check-circle"></i>
                  <span>100% Authentic Products</span>
                </div>
                <div className="highlight-item">
                  <i className="fas fa-bolt"></i>
                  <span>Lightning Fast Delivery</span>
                </div>
                <div className="highlight-item">
                  <i className="fas fa-shield-alt"></i>
                  <span>Secure Payment Gateways</span>
                </div>
              </div>
            </div>
            <div className="about-visual">
              {/* Abstract visual representation using CSS shapes/icons if no image available */}
              <div className="visual-circle">
                <i className="fas fa-shopping-bag"></i>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="products-section">
          <div className="products-container">
            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="filter-left">
                <h2 className="products-title">Featured Products</h2>
                <span className="products-count">
                  Showing {products.items.length > 0 ? `${(currentPage - 1) * 20 + 1}-${(currentPage - 1) * 20 + products.items.length}` : 0} of {products.total} results
                </span>
              </div>

              <div className="filter-right">
                {/* --- Filter Dropdowns --- */}
                <div className="filter-group">
                  {["Type", "Price", "Brand", "Rating"].map((filter) => (
                    <div key={filter} className="filter-dropdown">
                      <button
                        className="filter-toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilterMenu(filter);
                        }}
                      >
                        <span>{filter}</span>
                        <i className="fas fa-chevron-down"></i>
                      </button>

                      {openFilter === filter && (
                        <div className="filter-menu" onClick={(e) => e.stopPropagation()}>
                          {filter === "Type" && (
                            <>
                              <button onClick={() => handleFilterSelect("category_id", 1)}>Electronics</button>
                              <button onClick={() => handleFilterSelect("category_id", 2)}>Home & Office</button>
                              <button onClick={() => handleFilterSelect("category_id", null)}>Clear</button>
                            </>
                          )}

                          {filter === "Price" && (
                            <>
                              <button onClick={() => handleFilterSelect("price_range", "0-100")}>$0 - $100</button>
                              <button onClick={() => handleFilterSelect("price_range", "100-500")}>$100 - $500</button>
                              <button onClick={() => handleFilterSelect("price_range", "500-2000")}>$500 - $2000</button>
                              <button onClick={() => handleFilterSelect("price_range", "2000+")}>$2000+</button>
                              <button onClick={() => handleFilterSelect("price_range", null)}>Clear</button>
                            </>
                          )}

                          {filter === "Brand" && (
                            <>
                              <button onClick={() => handleFilterSelect("brand_id", 1)}>Nexus Gear</button>
                              <button onClick={() => handleFilterSelect("brand_id", 2)}>ChronoTech</button>
                              <button onClick={() => handleFilterSelect("brand_id", null)}>Clear</button>
                            </>
                          )}
                          {filter === "Rating" && (
                            <>
                              <button onClick={() => handleFilterSelect("rating", "4")}>4★ & above</button>
                              <button onClick={() => handleFilterSelect("rating", "3")}>3★ & above</button>
                              <button onClick={() => handleFilterSelect("rating", null)}>Clear</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* --- Sort Dropdown --- */}
                <div className="sort-dropdown">
                  <button
                    className="sort-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSortMenu(!showSortMenu);
                    }}
                  >
                    <span>Sort by: {activeSort}</span>
                    <i className="fas fa-chevron-down"></i>
                  </button>
                  {showSortMenu && (
                    <div className="sort-menu" onClick={(e) => e.stopPropagation()}>
                      {[
                        "Newest First",
                        "Price: Low to High",
                        "Price: High to Low",
                        "Name: A to Z",
                        "Name: Z to A",
                      ].map((option) => (
                        <button
                          key={option}
                          className={`sort-option ${activeSort === option ? "active" : ""}`}
                          onClick={() => handleSortChange(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PRODUCTS GRID RENDERING */}
            <ProductContent />

            {/* ✅ ENHANCED PAGINATION */}
            {products.total_pages > 1 && (
              <div className="pagination-controls">
                {/* Previous Button */}
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>

                {/* Page Numbers */}
                <div className="page-numbers">
                  {renderPageNumbers()}
                </div>

                {/* Next Button */}
                <button
                  className="pagination-btn"
                  disabled={currentPage === products.total_pages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}

          </div>
        </section>

        {/* 2️⃣ WHY SHOP WITH US (Trust Section) */}
        <section className="trust-section">
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Secure Payments</h3>
              <p>Your transactions are protected with military-grade encryption.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">
                <i className="fas fa-truck-fast"></i>
              </div>
              <h3>Fast Delivery</h3>
              <p>Get your favorite items delivered specifically to your doorstep.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">
                <i className="fas fa-certificate"></i>
              </div>
              <h3>Verified Sellers</h3>
              <p>We strictly curate our sellers to ensure 100% product authenticity.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">
                <i className="fas fa-headset"></i>
              </div>
              <h3>24/7 Support</h3>
              <p>Our dedicated support team is here to help you anytime, day or night.</p>
            </div>
          </div>
        </section>

        {/* 3️⃣ CONTACT US SECTION */}
        <section className="contact-section">
          <div className="contact-container">
            <div className="contact-header">
              <h2>We're Here to Help</h2>
              <p>Have questions? Reach out to our team.</p>
            </div>
            <div className="contact-grid">
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <div>
                  <h4>Email Us</h4>
                  <p>support@nexora.com</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <div>
                  <h4>Call Us</h4>
                  <p>+1 (800) 123-4567</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-map-marker-alt"></i>
                <div>
                  <h4>Visit Us</h4>
                  <p>123 Innovation Dr, Tech City, TC 90210</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 4️⃣ FOOTER (Amazon-Style) */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-column">
            <h3>Get to Know Us</h3>
            <ul>
              <li><a href="#">About Nexora</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press Releases</a></li>
              <li><a href="#">Nexora Science</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Connect with Us</h3>
            <ul>
              <li><a href="#">Facebook</a></li>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">Instagram</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Make Money with Us</h3>
            <ul>
              <li><a href="#">Sell on Nexora</a></li>
              <li><a href="#">Protect and Build Your Brand</a></li>
              <li><a href="#">Nexora Global Selling</a></li>
              <li><a href="#">Become an Affiliate</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Let Us Help You</h3>
            <ul>
              <li><a href="#">Your Account</a></li>
              <li><a href="#">Your Orders</a></li>
              <li><a href="#">Shipping Rates & Policies</a></li>
              <li><a href="#">Returns & Replacements</a></li>
              <li><a href="#">Help</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-logo">NEXORA</div>
          <p className="copyright">&copy; {new Date().getFullYear()} Nexora, Inc. or its affiliates</p>
        </div>
      </footer>
    </div >
  );
};

export default Home;