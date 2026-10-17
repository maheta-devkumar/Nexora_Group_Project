import React from 'react'; 
import './ProductCard.css';

const ProductCard = ({ product }) => {
    return (
        <div className="product-card bg-white border border-gray-200 rounded-lg p-4">
            <div className="card-header flex justify-between items-start mb-3">
                <div className="product-info">
                    <h4 className="product-name font-medium text-gray-900 truncate">{product.product_name}</h4>
                    {product.variant_name && (
                        <p className="variant-name text-sm text-gray-500">{product.variant_name}</p>
                    )}
                </div>
                <span className="product-id bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                    #{product.variant_id}
                </span>
            </div>
            
            <div className="product-stats space-y-2">
                <div className="stat-row flex justify-between">
                    <span className="stat-label text-sm text-gray-600">Sold:</span>
                    <span className="stat-value font-semibold">{product.total_sold}</span>
                </div>
                <div className="stat-row flex justify-between">
                    <span className="stat-label text-sm text-gray-600">Revenue:</span>
                    <span className="stat-value revenue-value font-semibold text-green-600">${product.total_revenue.toLocaleString()}</span>
                </div>
                <div className="stat-row flex justify-between">
                    <span className="stat-label text-sm text-gray-600">Stock:</span>
                    <span className={`stock-value font-semibold ${
                        product.stock_quantity === 0 ? 'stock-out text-red-600' : 
                        product.stock_quantity <= 5 ? 'stock-low text-yellow-600' : 'stock-good text-green-600'
                    }`}>
                        {product.stock_quantity} units
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;