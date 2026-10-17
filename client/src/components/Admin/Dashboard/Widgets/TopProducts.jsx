import React from 'react';
import { Star, ShoppingBag, TrendingUp } from 'lucide-react';
import './Widgets.css';

const TopProducts = ({ products = [], isLoading = false }) => {
  const productsToDisplay = products && products.length ? products.slice(0, 5) : [
    { product_id: 1, product_name: 'Premium Wireless Headphones', sold: 245, revenue: 24500, rating: 4.8 },
    { product_id: 2, product_name: 'Smart Watch Pro', sold: 189, revenue: 18900, rating: 4.6 },
    { product_id: 3, product_name: 'USB-C Fast Charger', sold: 312, revenue: 9360, rating: 4.4 },
    { product_id: 4, product_name: 'Wireless Mouse', sold: 156, revenue: 4680, rating: 4.2 },
    { product_id: 5, product_name: 'Laptop Stand', sold: 98, revenue: 2940, rating: 4.7 },
  ];

  if (isLoading) {
    return (
      <div className="widget-card top-products-widget">
        <div className="widget-header">
          <h3 className="widget-title">Top Products</h3>
        </div>
        <div className="widget-content">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="product-item skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card top-products-widget">
      <div className="widget-header">
        <div className="header-title">
          <ShoppingBag size={20} />
          <h3 className="widget-title">Top Products</h3>
        </div>
        <span className="widget-subtitle">By revenue</span>
      </div>

      <div className="widget-content">
        {productsToDisplay.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={48} />
            <p>No product data available</p>
          </div>
        ) : (
          <div className="products-list">
            {productsToDisplay.map((product, index) => (
              <div className="product-item" key={product.product_id || product.id || index}>
                <div className="product-rank">
                  <span className={`rank-number rank-${index + 1}`}>{index + 1}</span>
                </div>
                <div className="product-info">
                  <h4 className="product-name" title={product.product_name || product.name}>
                    {product.product_name || product.name}
                  </h4>
                  <div className="product-meta">
                    <span className="product-sales">
                      <TrendingUp size={12} /> {product.sold ?? product.total_sold ?? 0} sold
                    </span>
                    <span className="product-rating">
                      <Star size={12} fill="currentColor" /> {product.rating?.toFixed(1) ?? '4.5'}
                    </span>
                  </div>
                </div>
                <div className="product-stats">
                  <div className="product-revenue">
                    ${(product.revenue ?? product.total_revenue ?? 0).toLocaleString()}
                  </div>
                  <div className="revenue-label">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopProducts;