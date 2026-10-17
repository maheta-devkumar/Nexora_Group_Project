import React, { useEffect, useState } from 'react';
import { useVehicleContext } from '../../../context/delivery_panel/VehicleContext';
import DeliveryLayout from '../../../components/DeliveryPerson/Layout/DeliveryLayout';
import VehicleInfo from '../../../components/DeliveryPerson/Vehicle/VehicleInfo';
import VehicleDocuments from '../../../components/DeliveryPerson/Vehicle/VehicleDocuments';
import './Vehicle.css';

const Vehicle = () => {
    const {
        comprehensiveInfo,
        basicInfo,
        vehicleDocuments,
        insuranceDetails,
        serviceHistory,
        vehicleStats,
        loading,
        error,
        fetchAllVehicleData,
        fetchDocuments,
        fetchInsurance,
        fetchService,
        clearError
    } = useVehicleContext();

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [vehicleHealth, setVehicleHealth] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchAllVehicleData();
                updateVehicleHealthStatus();
            } catch (err) {
                console.error('Error loading vehicle data:', err);
            }
        };
        
        loadData();
    }, []);

    const updateVehicleHealthStatus = () => {
        const healthMetrics = [
            {
                id: 1,
                status: 'good',
                icon: 'fuel',
                title: 'Fuel Efficiency',
                description: '45 km/l • Good',
                metric: '45 km/l'
            },
            {
                id: 2,
                status: 'warning',
                icon: 'settings',
                title: 'Next Service',
                description: 'Due in 500 km',
                metric: '500 km'
            },
            {
                id: 3,
                status: 'good',
                icon: 'shield',
                title: 'Insurance',
                description: insuranceDetails?.insurance_details?.valid_until 
                    ? `Valid until ${insuranceDetails.insurance_details.valid_until}`
                    : 'Valid until Dec 2025',
                metric: insuranceDetails?.is_active ? 'Active' : 'Expired'
            }
        ];
        setVehicleHealth(healthMetrics);
    };

    const handleUpdateDetails = () => {
        setShowUpdateModal(true);
    };

    const handleCloseModal = () => {
        setShowUpdateModal(false);
    };

    const handleDownloadDocument = (documentId) => {
        console.log('Downloading document:', documentId);
        // In real app, this would trigger file download
        alert(`Downloading document ${documentId}. In a real app, this would download the file.`);
    };

    const handleRefreshData = () => {
        fetchAllVehicleData();
        fetchDocuments();
        fetchInsurance();
        fetchService();
    };

    if (loading && !comprehensiveInfo) {
        return (
            <DeliveryLayout>
                <div className="page active" id="vehicle-page">
                    <div className="page-header">
                        <h2>Vehicle Information</h2>
                    </div>
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading vehicle information...</p>
                    </div>
                </div>
            </DeliveryLayout>
        );
    }

    return (
        <DeliveryLayout>
            <div className="page active" id="vehicle-page">
                <div className="page-header">
                    <h2>Vehicle Information</h2>
                    <button 
                        className="btn-primary" 
                        onClick={handleUpdateDetails}
                        disabled={loading}
                    >
                        <i data-lucide="edit"></i>
                        Update Details
                    </button>
                </div>

                {error && (
                    <div className="error-alert">
                        <div className="alert-content">
                            <i data-lucide="alert-circle"></i>
                            <span>{error}</span>
                        </div>
                        <button className="alert-close" onClick={clearError}>
                            <i data-lucide="x"></i>
                        </button>
                        <button className="btn-secondary refresh-btn" onClick={handleRefreshData}>
                            <i data-lucide="refresh-cw"></i>
                        </button>
                    </div>
                )}

                {/* Vehicle Information Section */}
                <VehicleInfo 
                    comprehensiveInfo={comprehensiveInfo}
                    basicInfo={basicInfo}
                    loading={loading}
                />

                {/* Vehicle Health Status */}
                {vehicleStats.hasVehicle && (
                    <div className="health-status">
                        <h3>Vehicle Health Status</h3>
                        <div className="health-metrics">
                            {vehicleHealth.map(metric => (
                                <div className={`health-metric ${metric.status}`} key={metric.id}>
                                    <div className="metric-icon">
                                        <i data-lucide={metric.icon}></i>
                                    </div>
                                    <div className="metric-info">
                                        <strong>{metric.title}</strong>
                                        <span>{metric.description}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vehicle Documents Section */}
                <VehicleDocuments 
                    documents={vehicleDocuments}
                    loading={loading}
                    onDownload={handleDownloadDocument}
                />

                {/* Service History */}
                {serviceHistory.length > 0 && (
                    <div className="service-history-section">
                        <h3>Service History</h3>
                        <div className="service-list">
                            {serviceHistory.slice(0, 3).map((service, index) => (
                                <div className="service-item" key={index}>
                                    <div className="service-icon">
                                        <i data-lucide="wrench"></i>
                                    </div>
                                    <div className="service-info">
                                        <strong>{service.service_type || 'General Service'}</strong>
                                        <span>{service.date || 'Date not available'}</span>
                                        <span className="service-cost">
                                            Cost: ₹{service.cost || '0'}
                                        </span>
                                    </div>
                                    <button className="icon-btn" title="View Details">
                                        <i data-lucide="eye"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                        {serviceHistory.length > 3 && (
                            <button className="view-all-btn">
                                View All {serviceHistory.length} Service Records
                                <i data-lucide="chevron-right"></i>
                            </button>
                        )}
                    </div>
                )}

                {/* Insurance Information */}
                {insuranceDetails && insuranceDetails.insurance_details && (
                    <div className="insurance-section">
                        <h3>Insurance Information</h3>
                        <div className="insurance-card">
                            <div className="insurance-header">
                                <div className="insurance-icon">
                                    <i data-lucide="shield"></i>
                                </div>
                                <div className="insurance-info">
                                    <strong>
                                        {insuranceDetails.insurance_details.company || 'Insurance Company'}
                                    </strong>
                                    <span>
                                        Policy No: {insuranceDetails.insurance_details.policy_number || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="insurance-details">
                                <div className="detail-item">
                                    <span className="detail-label">Valid From</span>
                                    <span className="detail-value">
                                        {insuranceDetails.insurance_details.valid_from || 'N/A'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Valid Until</span>
                                    <span className={`detail-value ${insuranceDetails.is_active ? 'valid' : 'expired'}`}>
                                        {insuranceDetails.insurance_details.valid_until || 'N/A'}
                                        {insuranceDetails.is_active ? ' (Active)' : ' (Expired)'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Coverage Amount</span>
                                    <span className="detail-value">
                                        ₹{insuranceDetails.insurance_details.coverage_amount || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="insurance-actions">
                                <button className="btn-secondary">
                                    <i data-lucide="download"></i>
                                    Download Policy
                                </button>
                                <button className="btn-text">
                                    <i data-lucide="eye"></i>
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="vehicle-stats">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i data-lucide="file-text"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Total Documents</span>
                            <span className="stat-value">{vehicleStats.documentsCount}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Verified</span>
                            <span className="stat-value">{vehicleStats.verifiedDocuments}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i data-lucide="clock"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Next Service</span>
                            <span className="stat-value">
                                {serviceHistory?.[0]?.next_service_date || 'Soon'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Update Details Modal */}
            {showUpdateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Update Vehicle Details</h3>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-message">
                                This feature allows you to update your vehicle information. 
                                In a real application, you would see a form here to update:
                            </p>
                            <ul className="modal-list">
                                <li>Vehicle registration number</li>
                                <li>Vehicle color and model</li>
                                <li>Insurance details</li>
                                <li>Document uploads</li>
                            </ul>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleCloseModal}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DeliveryLayout>
    );
};

export default Vehicle;