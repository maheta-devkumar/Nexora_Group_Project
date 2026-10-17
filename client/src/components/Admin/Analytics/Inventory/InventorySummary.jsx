import React from 'react';
import './InventorySummary.css';

const InventorySummary = ({ alerts }) => {
    const outOfStock = alerts.filter(a => a.status === 'OUT_OF_STOCK').length;
    const lowStock = alerts.filter(a => a.status === 'LOW_STOCK').length;
    const totalAlerts = outOfStock + lowStock;

    return (
        <div className="inventory-summary bg-white rounded-lg p-4">
            <h4 className="summary-title font-medium text-gray-900 mb-4">Inventory Summary</h4>
            <div className="summary-items space-y-4">
                <div className="out-of-stock-item flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div className="stock-info flex items-center">
                        <div className="stock-icon w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                            <span className="icon-text text-red-600 font-bold">!</span>
                        </div>
                        <div className="stock-details">
                            <div className="stock-count font-bold text-red-800">{outOfStock}</div>
                            <div className="stock-label text-sm text-red-600">Out of Stock</div>
                        </div>
                    </div>
                </div>
                <div className="low-stock-item flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="stock-info flex items-center">
                        <div className="stock-icon stock-icon-low w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                            <span className="icon-text-low text-yellow-600 font-bold">!</span>
                        </div>
                        <div className="stock-details">
                            <div className="stock-count-low font-bold text-yellow-800">{lowStock}</div>
                            <div className="stock-label-low text-sm text-yellow-600">Low Stock</div>
                        </div>
                    </div>
                </div>
                <div className="summary-footer text-center text-sm text-gray-500">
                    {totalAlerts} products need attention
                </div>
            </div>
        </div>
    );
};

export default InventorySummary;