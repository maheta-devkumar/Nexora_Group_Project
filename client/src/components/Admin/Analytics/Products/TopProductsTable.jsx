import React from 'react';
import './TopProductsTable.css';

const TopProductsTable = ({ products }) => {
    return (
        <div className="top-products-table bg-white rounded-xl shadow-sm p-6">
            <div className="products-header flex justify-between items-center mb-6">
                <h2 className="products-title text-xl font-bold text-gray-900">Top Selling Products</h2>
                <span className="products-period text-sm text-gray-500">Last 30 days</span>
            </div>

            <div className="table-container overflow-x-auto">
                <table className="products-table min-w-full divide-y divide-gray-200">
                    <thead className="table-header">
                        <tr>
                            <th className="header-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                            </th>
                            <th className="header-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sold
                            </th>
                            <th className="header-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Revenue
                            </th>
                            <th className="header-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {products.map((product, index) => (
                            <tr key={product.variant_id} className="table-row hover:bg-gray-50">
                                <td className="table-cell product-cell px-4 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            <span className="rank-number">{index + 1}.</span> {product.product_name}
                                        </div>
                                        {product.variant_name && (
                                            <div className="variant-cell text-sm text-gray-500">
                                                Variant: {product.variant_name}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="table-cell sold-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.total_sold}
                                </td>
                                <td className="table-cell revenue-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${product.total_revenue.toLocaleString()}
                                </td>
                                <td className="table-cell px-4 py-4 whitespace-nowrap">
                                    <span className={`stock-cell px-2 py-1 text-xs font-medium rounded-full ${
                                        product.stock_quantity === 0 
                                            ? 'stock-out bg-red-100 text-red-800'
                                            : product.stock_quantity <= 5
                                            ? 'stock-low bg-yellow-100 text-yellow-800'
                                            : 'stock-good bg-green-100 text-green-800'
                                    }`}>
                                        {product.stock_quantity} units
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TopProductsTable;