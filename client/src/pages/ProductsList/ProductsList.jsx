import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../../components/ProductCard/ProductCard";
import { fetchProducts, fetchCategories, fetchBrands } from "../../api/product";
import "./ProductsList.css";

const ProductList = () => {
    const [searchParams] = useSearchParams();

    const searchQuery = searchParams.get("search") || "";
    const categoryParam = searchParams.get("category") || "";

    const [products, setProducts] = useState({ items: [], total: 0 });
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [filters, setFilters] = useState({
        category_id: null,
        brand_ids: [],
        priceRange: null,
        rating: null,
        discount: null,
    });

    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(true);
    const [categoryResolved, setCategoryResolved] = useState(false); // New state to block fetching until category resolved
    const [activeSort, setActiveSort] = useState("Relevance");
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const priceRanges = [
        { label: "Under ₹100", value: "0-100" },
        { label: "₹100 - ₹500", value: "100-500" },
        { label: "₹500 - ₹2,000", value: "500-2000" },
        { label: "Above ₹2,000", value: "2000+" },
    ];

    const gradientColors = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    ];

    useEffect(() => {
        const resolveCategoryFilter = async () => {
            setFilterLoading(true);
            setCategoryResolved(false); // Reset resolved state on param change

            console.log(`📦 PRODUCT LIST: Resolving filters for categoryParam = '${categoryParam}'`);

            const [catRes, brandRes] = await Promise.all([
                fetchCategories(),
                fetchBrands(),
            ]);

            if (catRes.success) setCategories(catRes.data);
            if (brandRes.success) setBrands(brandRes.data);

            if (!catRes.success) console.error("❌ Category Load Error:", catRes.message);
            if (!brandRes.success) console.error("❌ Brand Load Error:", brandRes.message);

            if (categoryParam) {
                if (catRes.success && catRes.data.length > 0) {
                    const match = catRes.data.find(
                        (c) => c.category_name?.toLowerCase() === categoryParam.toLowerCase()
                    );
                    if (match) {
                        console.log(`📦 Resolved category: ${match.category_name} -> ID: ${match.category_id}`);
                        setFilters((prev) => ({ ...prev, category_id: match.category_id }));
                        setCategoryResolved(true);
                    } else {
                        console.warn(`⚠️ Category '${categoryParam}' not found in API list.`);
                        // If not found, maybe we should still allow fetching or show empty? 
                        // For now, let's mark resolved so it fetches "All" or handles empty.
                        setCategoryResolved(true);
                    }
                } else {
                    setCategoryResolved(true); // Failed to load cats, proceed anyway
                }
            } else {
                // No category param, so we are resolved immediately (fetching 'All')
                setFilters((prev) => ({ ...prev, category_id: null }));
                setCategoryResolved(true);
            }

            setFilterLoading(false);
        };

        resolveCategoryFilter();
    }, [categoryParam]);

    useEffect(() => {
        if (!categoryResolved) {
            console.log("📦 PRODUCT LIST: Waiting for category resolution...");
            return;
        }

        console.log(`📦 PRODUCT LIST: Fetching products. Filters ready.`);
        fetchProductsData();
    }, [filters, activeSort, searchQuery, categoryResolved]); // Added categoryResolved dependency

    const fetchProductsData = async (page = 1) => {
        setLoading(true);

        try {
            const params = {
                search: searchQuery,
                category_id: filters.category_id,
                brand_ids: filters.brand_ids.length > 0 ? filters.brand_ids.join(",") : null,
                price_range: filters.priceRange,
                rating: filters.rating,
                discount: filters.discount,
                sort_by: mapSortOption(activeSort),
                page,
                per_page: 20,
            };

            console.log("📦 PRODUCT LIST: Fetching with params:", params);

            const response = await fetchProducts(params);

            if (response.success) {
                console.log(`✅ PRODUCT LIST: Got ${response.data.items.length} products`);
                console.log("📦 PRODUCT LIST: Sample product data:", response.data.items[0]);
                setProducts(response.data);
            } else {
                console.error("❌ PRODUCT LIST: Fetch Error:", response.message);
                setProducts({ items: [], total: 0 });
            }
        } catch (err) {
            console.error("❌ PRODUCT LIST: API Error:", err);
            setProducts({ items: [], total: 0 });
        } finally {
            setLoading(false);
        }
    };

    const mapSortOption = (sortOption) => {
        const sortMap = {
            "Relevance": "newest",
            "Price: Low to High": "price_low",
            "Price: High to Low": "price_high",
            "Newest First": "newest",
            "Customer Reviews": "rating",
        };
        return sortMap[sortOption] || "newest";
    };

    const handleFilterChange = (filterType, value) => {
        console.log(`📦 PRODUCT LIST: Filter changed - ${filterType} = ${value}`);

        if (filterType === "brand_ids") {
            const idAsNumber = Number(value);
            const newBrands = filters.brand_ids.includes(idAsNumber)
                ? filters.brand_ids.filter((id) => id !== idAsNumber)
                : [...filters.brand_ids, idAsNumber];
            setFilters({ ...filters, brand_ids: newBrands });
        } else {
            const isTogglingOff = filters[filterType] === value;
            setFilters({ ...filters, [filterType]: isTogglingOff ? null : value });
        }
    };

    const clearFilters = () => {
        console.log("📦 PRODUCT LIST: Clearing filters");
        setFilters({
            category_id: null,
            brand_ids: [],
            priceRange: null,
            rating: null,
            discount: null,
        });
    };

    const activeFiltersCount =
        (filters.category_id ? 1 : 0) +
        filters.brand_ids.length +
        (filters.priceRange ? 1 : 0) +
        (filters.rating ? 1 : 0) +
        (filters.discount ? 1 : 0);



    const pageTitle = categoryParam ? `Category: ${categoryParam}` :
        searchQuery ? `Search results for "${searchQuery}"` :
            filters.category_id ? `Category: ${categories.find(c => c.category_id === filters.category_id)?.category_name || 'All'}` :
                "All Products";

    return (
        <div className="product-list-page">
            <div className="product-list-container">
                <aside className={`filters-sidebar ${showMobileFilters ? "show" : ""}`}>
                    <div className="filters-header">
                        <h3>Filters</h3>
                        {activeFiltersCount > 0 && (
                            <button className="clear-filters" onClick={clearFilters}>
                                Clear All ({activeFiltersCount})
                            </button>
                        )}
                        <button
                            className="close-filters-mobile"
                            onClick={() => setShowMobileFilters(false)}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className="filters-content">
                        {searchQuery && (
                            <div className="filter-section">
                                <h4 className="filter-title">Search</h4>
                                <div className="current-search">
                                    <span>"{searchQuery}"</span>
                                </div>
                            </div>
                        )}

                        <div className="filter-section">
                            <h4 className="filter-title">Category</h4>
                            <div className="filter-options">
                                {filterLoading ? (
                                    <p className="filter-loading">Loading Categories...</p>
                                ) : (
                                    categories.map((cat) => (
                                        <label key={cat.category_id} className="filter-option">
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={filters.category_id === cat.category_id}
                                                onChange={() =>
                                                    handleFilterChange("category_id", cat.category_id)
                                                }
                                            />
                                            <span>{cat.category_name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="filter-section">
                            <h4 className="filter-title">Brand</h4>
                            <div className="filter-options">
                                {filterLoading ? (
                                    <p className="filter-loading">Loading Brands...</p>
                                ) : (
                                    brands.map((brand) => (
                                        <label key={brand.brand_id} className="filter-option">
                                            <input
                                                type="checkbox"
                                                checked={filters.brand_ids.includes(brand.brand_id)}
                                                onChange={() =>
                                                    handleFilterChange("brand_ids", brand.brand_id)
                                                }
                                            />
                                            <span>{brand.brand_name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="filter-section">
                            <h4 className="filter-title">Price Range</h4>
                            <div className="filter-options">
                                {priceRanges.map((range) => (
                                    <label key={range.value} className="filter-option">
                                        <input
                                            type="radio"
                                            name="priceRange"
                                            checked={filters.priceRange === range.value}
                                            onChange={() =>
                                                handleFilterChange("priceRange", range.value)
                                            }
                                        />
                                        <span>{range.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="products-main">
                    <div className="results-header">
                        <div className="results-info">
                            <h2>
                                {pageTitle}
                            </h2>
                            <p>
                                {loading ? "Loading..." : `${products.total} products found`}
                            </p>
                        </div>

                        <div className="results-actions">
                            <button
                                className="mobile-filter-btn"
                                onClick={() => setShowMobileFilters(true)}
                            >
                                <i className="fas fa-filter"></i>
                                Filters
                                {activeFiltersCount > 0 && (
                                    <span className="filter-badge">{activeFiltersCount}</span>
                                )}
                            </button>

                            <div className="sort-dropdown">
                                <button
                                    className="sort-toggle"
                                    onClick={() => setShowSortMenu(!showSortMenu)}
                                >
                                    <span>Sort by: {activeSort}</span>
                                    <i className="fas fa-chevron-down"></i>
                                </button>

                                {showSortMenu && (
                                    <div className="sort-menu">
                                        {["Relevance", "Price: Low to High", "Price: High to Low", "Newest First", "Customer Reviews"].map(option => (
                                            <button
                                                key={option}
                                                className={activeSort === option ? "active" : ""}
                                                onClick={() => {
                                                    setActiveSort(option);
                                                    setShowSortMenu(false);
                                                }}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading products...</p>
                        </div>
                    ) : products.items.length > 0 ? (
                        <div className="products-grid-list">
                            {products.items.map((product, index) => {
                                const variant = product.default_variant || {};
                                const imageUrl = variant.images?.[0]?.url || null;

                                console.log(`🖼️ PRODUCT ${product.product_id} - Image:`, imageUrl);

                                return (
                                    <ProductCard
                                        key={product.product_id}
                                        id={product.product_id}
                                        variantId={variant.variant_id}
                                        title={product.product_name}
                                        description={product.description || "High quality product"}
                                        price={variant.final_price || variant.price || 0}
                                        originalPrice={variant.discount_value > 0 ? variant.price : null}
                                        image={imageUrl}
                                        rating={4.5}
                                        reviewCount={variant.stock_quantity * 5}
                                        gradient={gradientColors[index % gradientColors.length]}
                                        inStock={variant.stock_quantity > 0}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-results">
                            <i className="fas fa-search"></i>
                            <h3>No products found</h3>
                            <p>Try adjusting your filters or search terms</p>
                            <button className="clear-filters-btn" onClick={clearFilters}>
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProductList;