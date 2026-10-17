import React, { useState, useEffect } from 'react';
import { MarketingProvider } from '../../../context/MarketingContext';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout'; // Add this import
import MarketingDashboard from '../../../components/Admin/Marketing/MarketingDashboard';
import CouponDetail from '../../../components/Admin/Marketing/CouponDetail';
import OfferDetail from '../../../components/Admin/Marketing/OfferDetail';
import './Marketing.css';

const Marketing = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedType, setSelectedType] = useState('');

    const handleViewItem = (item, type) => {
        setSelectedItem(item);
        setSelectedType(type);
        setActiveView(type === 'coupon' ? 'coupon-detail' : 'offer-detail');
    };

    const handleEditItem = (item, type) => {
        setSelectedItem(item);
        setSelectedType(type);
        setActiveView(type === 'coupon' ? 'coupon-edit' : 'offer-edit');
    };

    const handleBackToDashboard = () => {
        setActiveView('dashboard');
        setSelectedItem(null);
        setSelectedType('');
    };

    const handleCreateSuccess = () => {
        setActiveView('dashboard');
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <MarketingDashboard 
                        onViewItem={handleViewItem}
                        onEditItem={handleEditItem}
                        onCreateSuccess={handleCreateSuccess}
                    />
                );
            case 'coupon-detail':
            case 'coupon-edit':
                return (
                    <CouponDetail 
                        coupon={selectedItem}
                        onBack={handleBackToDashboard}
                        mode={activeView === 'coupon-edit' ? 'edit' : 'detail'}
                    />
                );
            case 'offer-detail':
            case 'offer-edit':
                return (
                    <OfferDetail 
                        offer={selectedItem}
                        onBack={handleBackToDashboard}
                        mode={activeView === 'offer-edit' ? 'edit' : 'detail'}
                    />
                );
            default:
                return <MarketingDashboard 
                    onViewItem={handleViewItem}
                    onEditItem={handleEditItem}
                    onCreateSuccess={handleCreateSuccess}
                />;
        }
    };

    return (
        <MarketingProvider>
            <AdminLayout>
                <div className="marketing-page">
                    <div className="marketing-header">
                        <h1>Marketing Management</h1>
                        <p className="page-subtitle">Manage coupons, offers, and promotions</p>
                    </div>
                    
                    <div className="marketing-content">
                        {renderView()}
                    </div>
                </div>
            </AdminLayout>
        </MarketingProvider>
    );
};

export default Marketing;