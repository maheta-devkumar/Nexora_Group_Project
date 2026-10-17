import React, { useState, useEffect } from 'react';
import { useBrandContext } from '../../../../context/BrandContext';
import './BrandAnalytics.css';

const BrandAnalytics = () => {
    const { brands, loading, error, fetchBrands } = useBrandContext();
    const [analyticsData, setAnalyticsData] = useState([]);

    console.log('BrandAnalytics: Component rendered. Brands:', {
        length: brands.length,
        brands: brands,
        loading: loading,
        error: error
    });

    useEffect(() => {
        console.log('BrandAnalytics: useEffect - fetchBrands triggered');
        fetchBrands();
    }, [fetchBrands]);

    useEffect(() => {
        console.log('BrandAnalytics: brands dependency changed:', brands);
        
        if (brands.length > 0) {
            console.log('Generating analytics data from', brands.length, 'brands');
            const data = brands.map(brand => ({
                brand_id: brand.brand_id,
                brand_name: brand.brand_name,
                total_products: Math.floor(Math.random() * 100),
                total_sales: Math.floor(Math.random() * 10000),
                avg_rating: (Math.random() * 2 + 3).toFixed(1),
                revenue: Math.floor(Math.random() * 50000)
            }));
            console.log('Generated analytics data:', data);
            setAnalyticsData(data);
        } else {
            console.log('No brands available for analytics');
            setAnalyticsData([]);
        }
    }, [brands]);

    // Add a manual refresh button for testing
    const handleManualRefresh = () => {
        console.log('Manual refresh clicked');
        fetchBrands();
    };

    if (loading) {
        console.log('BrandAnalytics: Showing loading state');
        return (
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading brand analytics...</p>
            </div>
        );
    }

    if (error) {
        console.log('BrandAnalytics: Showing error state:', error);
        return (
            <div className="error-state">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
                <button onClick={fetchBrands} className="retry-btn">
                    Retry
                </button>
            </div>
        );
    }

    console.log('BrandAnalytics: Rendering with data:', {
        brandsCount: brands.length,
        analyticsCount: analyticsData.length,
        analyticsData: analyticsData
    });

    return (
        <div className="brand-analytics">
            <div className="analytics-header">
                <h3 className="analytics-title">
                    <i className="fas fa-chart-pie"></i>
                    Brand Performance Analytics
                </h3>
                <button 
                    onClick={handleManualRefresh}
                    className="refresh-btn"
                    style={{
                        marginLeft: '20px',
                        padding: '5px 10px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    <i className="fas fa-sync"></i> Refresh Data
                </button>
            </div>

            <div className="analytics-overview">
                <div className="overview-card total-brands">
                    <div className="overview-icon">
                        <i className="fas fa-tag"></i>
                    </div>
                    <div className="overview-content">
                        <div className="overview-value">{brands.length}</div>
                        <div className="overview-label">Total Brands</div>
                        <div className="debug-info" style={{ fontSize: '12px', color: '#666' }}>
                            Actual: {brands.length}
                        </div>
                    </div>
                </div>
                
                {/* ... rest of the component ... */}
            </div>

            {/* Show a message if no data */}
            {brands.length === 0 && (
                <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
                    <i className="fas fa-chart-line" style={{ fontSize: '48px', color: '#ccc' }}></i>
                    <h3>No Brands Found</h3>
                    <p>There are no brands in the system. Add some brands first to see analytics.</p>
                    <button onClick={handleManualRefresh} className="refresh-btn">
                        <i className="fas fa-sync"></i> Check Again
                    </button>
                </div>
            )}

            {/* Only show analytics if we have data */}
            {brands.length > 0 && (
                <>
                    <div className="analytics-content">
                        {/* ... rest of analytics content ... */}
                    </div>
                </>
            )}
        </div>
    );
};

export default BrandAnalytics;