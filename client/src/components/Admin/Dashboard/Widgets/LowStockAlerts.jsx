import React from 'react';
import { AlertTriangle, Package, TrendingDown, ArrowRight } from 'lucide-react';
import './Widgets.css';

const LowStockAlerts = ({ alerts = [], isLoading = false }) => {
  const alertsToDisplay = alerts && alerts.length ? alerts.slice(0, 5) : [
    { variant_id: 1, variant_name: 'Large', product_name: 'Premium T-Shirt', stock_quantity: 3, threshold: 10 },
    { variant_id: 2, variant_name: 'Medium', product_name: 'Designer Jeans', stock_quantity: 5, threshold: 15 },
    { variant_id: 3, variant_name: 'Small', product_name: 'Winter Jacket', stock_quantity: 8, threshold: 20 },
    { variant_id: 4, variant_name: 'XL', product_name: 'Sports Shoes', stock_quantity: 2, threshold: 12 },
    { variant_id: 5, variant_name: 'One Size', product_name: 'Backpack', stock_quantity: 4, threshold: 10 },
  ];

  const getAlertLevel = (stock, threshold = 10) => {
    const percentage = (stock / threshold) * 100;
    if (percentage <= 20) return 'critical';
    if (percentage <= 50) return 'warning';
    return 'low';
  };

  const getAlertColor = (level) => {
    switch (level) {
      case 'critical': return '#ff6b6b';
      case 'warning': return '#ff922b';
      case 'low': return '#ffd93d';
      default: return '#667eea';
    }
  };

  if (isLoading) {
    return (
      <div className="widget-card low-stock-widget">
        <div className="widget-header">
          <h3 className="widget-title">Low Stock Alerts</h3>
        </div>
        <div className="widget-content">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="alert-item skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!alertsToDisplay.length) {
    return (
      <div className="widget-card low-stock-widget">
        <div className="widget-header">
          <div className="header-title">
            <AlertTriangle size={20} />
            <h3 className="widget-title">Low Stock Alerts</h3>
          </div>
          <span className="alert-count safe">0</span>
        </div>
        <div className="widget-content">
          <div className="empty-state safe-state">
            <Package size={48} />
            <p>All products are well-stocked</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card low-stock-widget">
      <div className="widget-header">
        <div className="header-title">
          <AlertTriangle size={20} />
          <h3 className="widget-title">Low Stock Alerts</h3>
        </div>
        <span className="alert-count critical">{alertsToDisplay.length}</span>
      </div>

      <div className="widget-content">
        <div className="alerts-list">
          {alertsToDisplay.map((alert, idx) => {
            const level = getAlertLevel(alert.stock_quantity, alert.threshold || 10);
            const color = getAlertColor(level);
            
            return (
              <div 
                key={alert.variant_id || idx} 
                className="alert-item"
                style={{ borderLeftColor: color }}
              >
                <div className="alert-info">
                  <div className="alert-header">
                    <h4 className="product-name" title={alert.product_name}>
                      {alert.product_name}
                    </h4>
                    <span className={`alert-level ${level}`}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                  </div>
                  <span className="variant-name">{alert.variant_name}</span>
                </div>

                <div className="alert-stock">
                  <div className="stock-info">
                    <TrendingDown size={14} color={color} />
                    <span className="stock-count">
                      {alert.stock_quantity ?? alert.current_stock ?? 0} units left
                    </span>
                  </div>
                  <div className="stock-bar">
                    <div 
                      className="stock-level" 
                      style={{ 
                        width: `${Math.min(100, ((alert.stock_quantity ?? alert.current_stock ?? 0) / (alert.threshold || 10)) * 100)}%`,
                        backgroundColor: color 
                      }} 
                    />
                  </div>
                </div>

                <button 
                  className="restock-btn" 
                  style={{ backgroundColor: color }}
                  onClick={() => console.log('Reorder:', alert)}
                >
                  Reorder
                </button>
              </div>
            );
          })}
        </div>
        
        <div className="widget-footer">
          <button className="view-inventory-btn">
            View Full Inventory <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowStockAlerts;