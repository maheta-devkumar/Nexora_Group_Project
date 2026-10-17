import React from 'react';
import './ProductPerformance.css';

const ProductPerformance = ({ performance }) => {
    return (
        <div className="product-performance bg-white rounded-lg p-4">
            <h4 className="performance-title font-medium text-gray-900 mb-4">Product Performance</h4>
            <div className="performance-list space-y-4">
                {performance.map((product) => (
                    <div key={product.variant_id} className="performance-item border-b pb-4 last:border-0">
                        <div className="item-header flex justify-between items-start mb-2">
                            <div className="item-info">
                                <h5 className="item-name font-medium text-gray-900">{product.product_name}</h5>
                                <p className="item-variant text-sm text-gray-500">{product.variant_name}</p>
                            </div>
                            <span className="conversion-rate text-sm font-semibold">
                                {product.conversion_rate.toFixed(1)}% conversion
                            </span>
                        </div>
                        <div className="metrics-grid grid grid-cols-3 gap-2 text-center">
                            <div>
                                <div className="metric-value views-metric text-lg font-bold text-blue-600">{product.views}</div>
                                <div className="metric-label text-xs text-gray-500">Views</div>
                            </div>
                            <div>
                                <div className="metric-value carts-metric text-lg font-bold text-yellow-600">{product.cart_adds}</div>
                                <div className="metric-label text-xs text-gray-500">Cart Adds</div>
                            </div>
                            <div>
                                <div className="metric-value purchases-metric text-lg font-bold text-green-600">{product.purchases}</div>
                                <div className="metric-label text-xs text-gray-500">Purchases</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductPerformance;