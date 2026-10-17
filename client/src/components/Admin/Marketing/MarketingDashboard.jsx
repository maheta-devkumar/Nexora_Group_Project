import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import { useMarketingContext } from '../../../context/MarketingContext';
import OffersTable from './OffersTable';
import CouponsTable from './CouponsTable';
import MarketingFormModal from './MarketingFormModal';
import './MarketingDashboard.css';

const MarketingDashboard = ({ onViewItem, onEditItem, onCreateSuccess }) => {
    const {
        coupons,
        offers,
        activeCoupons,
        activeOffers,
        fetchAllCoupons,
        fetchAllOffers,
        fetchActiveCoupons,
        fetchActiveOffers,
        loading,
        error
    } = useMarketingContext();

    const [activeTab, setActiveTab] = useState('coupons');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [initialLoad, setInitialLoad] = useState(true);

    const fetchAllData = useCallback(async () => {
        try {
            await Promise.all([
                fetchAllCoupons(),
                fetchAllOffers()
            ]);
            setInitialLoad(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setInitialLoad(false);
        }
    }, [fetchAllCoupons, fetchAllOffers]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        if (!initialLoad) {
            fetchActiveCoupons();
            fetchActiveOffers();
        }
    }, [initialLoad, fetchActiveCoupons, fetchActiveOffers]);

    const handleCreate = useCallback((type) => {
        setActiveTab(type === 'coupon' ? 'coupons' : 'offers');
        setShowCreateModal(true);
    }, []);

    const handleCloseCreateModal = useCallback(() => {
        setShowCreateModal(false);
        fetchAllData();
        if (onCreateSuccess) onCreateSuccess();
    }, [fetchAllData, onCreateSuccess]);

    const getFilteredData = useCallback(() => {
        let data = activeTab === 'coupons' ? coupons : offers;

        if (!data || data.length === 0) return [];

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            data = data.filter(item =>
                activeTab === 'coupons'
                    ? item.code.toLowerCase().includes(searchLower) ||
                    (item.description && item.description.toLowerCase().includes(searchLower))
                    : item.title.toLowerCase().includes(searchLower) ||
                    (item.description && item.description.toLowerCase().includes(searchLower))
            );
        }

        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            data = data.filter(item => item.is_active === isActive);
        }

        return data;
    }, [activeTab, coupons, offers, searchTerm, statusFilter]);

    const filteredData = getFilteredData();
    const activeOffersCount = offers.filter(offer => offer.is_active).length;

    return (
        <div className="marketing-dashboard">

            {/* Header */}
            <div className="dashboard-header">
                <div className="stats-overview">
                    <div className="stat-card">
                        <div className="stat-info">
                            <h3>Active Offers</h3>
                            <p className="stat-value">{activeOffersCount}</p>
                            <p className="stat-subtitle">Currently active</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
                            <h3>Total Items</h3>
                            <p className="stat-value">{coupons.length + offers.length}</p>
                            <p className="stat-subtitle">All time</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="dashboard-content">

                {/* Controls */}
                <div className="content-header">
                    <div className="header-actions">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder={activeTab === 'coupons' ? 'Search coupons...' : 'Search offers...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={initialLoad}
                            />
                        </div>

                        <div>
                            <FaFilter />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                disabled={initialLoad}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                    </div>

                    <div className="create-buttons">
                        <button onClick={() => handleCreate('coupon')} disabled={initialLoad}>
                            <FaPlus /> Create Coupon
                        </button>
                        <button onClick={() => handleCreate('offer')} disabled={initialLoad}>
                            <FaPlus /> Create Offer
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs-navigation">
                    <button
                        onClick={() => setActiveTab('coupons')}
                        disabled={initialLoad}
                        className={activeTab === 'coupons' ? 'active' : ''}
                    >
                        Coupons ({coupons.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('offers')}
                        disabled={initialLoad}
                        className={activeTab === 'offers' ? 'active' : ''}
                    >
                        Offers ({offers.length})
                    </button>
                </div>

                {/* Content Area */}
                <div className="tab-content">
                    {(initialLoad || loading) && (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p style={{ marginLeft: '10px' }}>Loading marketing data...</p>
                        </div>
                    )}

                    {!initialLoad && !loading && (
                        <>
                            {activeTab === 'coupons' && (
                                <CouponsTable
                                    data={filteredData}
                                    onViewItem={onViewItem}
                                    onEditItem={onEditItem}
                                    searchTerm={searchTerm}
                                />
                            )}

                            {activeTab === 'offers' && (
                                <OffersTable
                                    data={filteredData}
                                    onViewItem={onViewItem}
                                    onEditItem={onEditItem}
                                    searchTerm={searchTerm}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            <MarketingFormModal
                visible={showCreateModal}
                type={activeTab === 'coupons' ? 'coupon' : 'offer'}
                editingItem={null}
                onClose={handleCloseCreateModal}
            />
        </div>
    );
};

export default MarketingDashboard;
