import React from 'react';
import './VehicleInfo.css';

const VehicleInfo = ({ comprehensiveInfo, basicInfo, loading }) => {
    if (loading && !comprehensiveInfo && !basicInfo) {
        return (
            <div className="vehicle-details">
                <div className="vehicle-card loading">
                    <div className="vehicle-image-skeleton"></div>
                    <div className="vehicle-info-skeleton">
                        <div className="vehicle-title-skeleton"></div>
                        <div className="info-grid-skeleton">
                            {[1, 2, 3, 4].map(i => (
                                <div className="info-item-skeleton" key={i}>
                                    <div className="label-skeleton"></div>
                                    <div className="value-skeleton"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Safe data access
    const getVehicleData = () => {
        // Try comprehensive info first
        if (comprehensiveInfo?.vehicle_info) {
            return {
                vehicle: comprehensiveInfo.vehicle_info,
                hasData: true
            };
        }
        
        // Try basic info next
        if (basicInfo?.vehicle_info) {
            return {
                vehicle: basicInfo.vehicle_info,
                hasData: true
            };
        }
        
        // Fallback data
        return {
            vehicle: {
                vehicle_type: 'Motorcycle',
                vehicle_model: 'Honda Activa 125',
                registration_number: 'GJ-18-AB-1234',
                color: 'Red',
                year: 2023,
                insurance_valid_until: 'Dec 31, 2025'
            },
            hasData: false
        };
    };

    const { vehicle, hasData } = getVehicleData();

    return (
        <div className="vehicle-details">
            <div className="vehicle-card">
                <div className="vehicle-image">
                    <i data-lucide="bike"></i>
                    {!hasData && (
                        <div className="data-warning">
                            <i data-lucide="alert-circle"></i>
                            <span>Sample Data</span>
                        </div>
                    )}
                </div>
                <div className="vehicle-info">
                    <h3>{vehicle.vehicle_model || vehicle.vehicle_type || 'Vehicle'}</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Registration Number</span>
                            <span className="info-value">{vehicle.registration_number || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Vehicle Color</span>
                            <span className="info-value">{vehicle.color || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Year</span>
                            <span className="info-value">{vehicle.year || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Insurance Valid Until</span>
                            <span className="info-value">{vehicle.insurance_valid_until || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Vehicle Type</span>
                            <span className="info-value">{vehicle.vehicle_type || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Last Updated</span>
                            <span className="info-value">
                                {basicInfo?.last_updated || comprehensiveInfo?.last_updated || 'Recently'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleInfo;