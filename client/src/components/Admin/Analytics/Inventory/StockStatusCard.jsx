import React from 'react';
import './StockStatusCard.css';

const StockStatusCard = ({ product }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'OUT_OF_STOCK': return 'status-out bg-red-500';
            case 'LOW_STOCK': return 'status-low bg-yellow-500';
            default: return 'status-good bg-green-500';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'OUT_OF_STOCK': return 'Out of Stock';
            case 'LOW_STOCK': return 'Low Stock';
            default: return 'In Stock';
        }
    };

    return (
        <div className="stock-status-card bg-white border border-gray-200 rounded-lg p-4">
            <div className="card-header flex justify-between items-start mb-3">
                <div className="product-info">
                    <h4 className="product-name font-medium text-gray-900">{product.product_name}</h4>
                    <p className="variant-name text-sm text-gray-500">{product.variant_name}</p>
                </div>
                <div className={`status-indicator w-3 h-3 rounded-full ${getStatusColor(product.status)}`}></div>
            </div>
            
            <div className="card-footer flex justify-between items-center">
                <div className="stock-info">
                    <div className="stock-count text-2xl font-bold text-gray-900">{product.current_stock}</div>
                    <div className="stock-label text-sm text-gray-600">Units in stock</div>
                </div>
                <span className={`status-badge px-3 py-1 rounded-full text-sm font-medium ${
                    product.status === 'OUT_OF_STOCK' 
                        ? 'badge-out bg-red-100 text-red-800'
                        : product.status === 'LOW_STOCK'
                        ? 'badge-low bg-yellow-100 text-yellow-800'
                        : 'badge-good bg-green-100 text-green-800'
                }`}>
                    {getStatusText(product.status)}
                </span>
            </div>
        </div>
    );
};

export default StockStatusCard;