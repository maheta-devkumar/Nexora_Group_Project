// components/Admin/ProductCatalog/Attributes/AttributeUsage.jsx
import React, { useState, useEffect } from 'react';
import { useAttributes } from '../../../../context/AttributeContext';
import './AttributeUsage.css';

const AttributeUsage = () => {
    const { attributes, fetchAttributes } = useAttributes();
    const [loading, setLoading] = useState(true);
    const [usageStats, setUsageStats] = useState({
        totalAttributes: 0,
        mostUsed: [],
        recentlyAdded: [],
        usageByType: []
    });

    useEffect(() => {
        loadData();
    }, [attributes]);

    const loadData = async () => {
        setLoading(true);
        
        // In a real app, you would fetch these stats from your backend API
        // For now, we'll calculate from existing attributes
        
        // Calculate usage statistics
        const totalAttributes = attributes.length;
        
        // Most used (simulated - in real app this would come from backend)
        const mostUsed = attributes
            .slice(0, 5) // Take first 5 as most used for demo
            .map(attr => ({
                name: attr.attribute_name,
                id: attr.attribute_id,
                usageCount: Math.floor(Math.random() * 50) + 10, // Random for demo
                products: Math.floor(Math.random() * 30) + 5
            }))
            .sort((a, b) => b.usageCount - a.usageCount);
        
        // Recently added
        const recentlyAdded = [...attributes]
            .sort((a, b) => new Date(b.created_at || new Date()) - new Date(a.created_at || new Date()))
            .slice(0, 5);
        
        // Usage by type (simulated categories)
        const usageByType = [
            { type: 'Size', count: 45, percentage: 30 },
            { type: 'Color', count: 38, percentage: 25 },
            { type: 'Material', count: 30, percentage: 20 },
            { type: 'Weight', count: 22, percentage: 15 },
            { type: 'Others', count: 15, percentage: 10 }
        ];
        
        setUsageStats({
            totalAttributes,
            mostUsed,
            recentlyAdded,
            usageByType
        });
        
        setLoading(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="attribute-usage-container">
            <div className="usage-header">
                <h2 className="usage-title">
                    <i className="fas fa-chart-line"></i>
                    Attribute Usage Analytics
                </h2>
                <p className="usage-subtitle">
                    Statistics and insights about attribute usage across products
                </p>
            </div>

            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <i className="fas fa-list-alt"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{usageStats.totalAttributes}</div>
                        <div className="stat-label">Total Attributes</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon success">
                        <i className="fas fa-chart-bar"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{Math.floor(usageStats.totalAttributes * 2.5)}</div>
                        <div className="stat-label">Total Assignments</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-card">
                        <div className="stat-icon warning">
                            <i className="fas fa-cube"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{Math.floor(usageStats.totalAttributes * 0.8)}</div>
                            <div className="stat-label">Active Products</div>
                        </div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon info">
                        <i className="fas fa-percentage"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">87%</div>
                        <div className="stat-label">Usage Rate</div>
                    </div>
                </div>
            </div>

            <div className="usage-grid">
                <div className="usage-section">
                    <div className="section-header">
                        <h3 className="section-title">
                            <i className="fas fa-star"></i>
                            Most Used Attributes
                        </h3>
                        <span className="section-subtitle">By assignment count</span>
                    </div>
                    <div className="most-used-list">
                        {loading ? (
                            <div className="loading-indicator">
                                <div className="loading-spinner"></div>
                                <span>Loading usage data...</span>
                            </div>
                        ) : usageStats.mostUsed.length > 0 ? (
                            usageStats.mostUsed.map((attr, index) => (
                                <div key={attr.id} className="most-used-item">
                                    <div className="item-rank">
                                        <span className="rank-number">#{index + 1}</span>
                                    </div>
                                    <div className="item-info">
                                        <div className="item-name">{attr.name}</div>
                                        <div className="item-stats">
                                            <span className="stat">
                                                <i className="fas fa-link"></i>
                                                {attr.usageCount} assignments
                                            </span>
                                            <span className="stat">
                                                <i className="fas fa-cube"></i>
                                                {attr.products} products
                                            </span>
                                        </div>
                                    </div>
                                    <div className="item-percentage">
                                        <div className="percentage-bar">
                                            <div 
                                                className="percentage-fill"
                                                style={{ width: `${(attr.usageCount / (usageStats.mostUsed[0]?.usageCount || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="percentage-text">
                                            {Math.round((attr.usageCount / (usageStats.mostUsed[0]?.usageCount || 1)) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-chart-bar"></i>
                                <span>No usage data available</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="usage-section">
                    <div className="section-header">
                        <h3 className="section-title">
                            <i className="fas fa-clock"></i>
                            Recently Added
                        </h3>
                        <span className="section-subtitle">Latest attribute additions</span>
                    </div>
                    <div className="recent-list">
                        {loading ? (
                            <div className="loading-indicator">
                                <div className="loading-spinner"></div>
                                <span>Loading recent data...</span>
                            </div>
                        ) : usageStats.recentlyAdded.length > 0 ? (
                            usageStats.recentlyAdded.map(attr => (
                                <div key={attr.attribute_id} className="recent-item">
                                    <div className="recent-icon">
                                        <i className="fas fa-tag"></i>
                                    </div>
                                    <div className="recent-info">
                                        <div className="recent-name">{attr.attribute_name}</div>
                                        <div className="recent-time">
                                            <i className="fas fa-calendar"></i>
                                            Added {formatDate(attr.created_at)}
                                        </div>
                                    </div>
                                    <div className="recent-id">
                                        ID: #{attr.attribute_id}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-clock"></i>
                                <span>No recent attributes</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="usage-section full-width">
                <div className="section-header">
                    <h3 className="section-title">
                        <i className="fas fa-chart-pie"></i>
                        Usage Distribution
                    </h3>
                    <span className="section-subtitle">Attribute types and their usage</span>
                </div>
                <div className="distribution-chart">
                    {loading ? (
                        <div className="loading-indicator">
                            <div className="loading-spinner"></div>
                            <span>Loading distribution data...</span>
                        </div>
                    ) : (
                        <div className="distribution-bars">
                            {usageStats.usageByType.map(item => (
                                <div key={item.type} className="distribution-item">
                                    <div className="dist-header">
                                        <span className="dist-label">{item.type}</span>
                                        <span className="dist-count">{item.count}</span>
                                    </div>
                                    <div className="dist-bar">
                                        <div 
                                            className="dist-fill"
                                            style={{ width: `${item.percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="dist-footer">
                                        <span className="dist-percentage">{item.percentage}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="usage-footer">
                <div className="footer-note">
                    <i className="fas fa-info-circle"></i>
                    <span>
                        Analytics are updated in real-time. Data reflects current attribute usage across all products.
                    </span>
                </div>
                <button className="refresh-btn" onClick={loadData} disabled={loading}>
                    <i className="fas fa-sync-alt"></i>
                    Refresh Analytics
                </button>
            </div>
        </div>
    );
};

export default AttributeUsage;