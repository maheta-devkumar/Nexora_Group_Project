import React, { useEffect, useState } from 'react';
import { useOrderAdminContext } from '../../../context/OrderAdminContext';
import RefundsList from '../../../components/Admin/Orders/Refunds/Refunds';
import RefundModals from '../../../components/Admin/Orders/Refunds/RefundModals';
import './Refunds.css';

const Refunds = () => {
    const {
        refunds,
        loading,
        error,
        fetchAllRefunds,
        clearError
    } = useOrderAdminContext();

    const [selectedRefund, setSelectedRefund] = useState(null);
    const [actionType, setActionType] = useState('');

    useEffect(() => {
        fetchAllRefunds();
    }, []);

    const handleUpdateStatus = (refund) => {
        setSelectedRefund(refund);
        setActionType('update');
    };

    const handleRetry = (refund) => {
        setSelectedRefund(refund);
        setActionType('retry');
    };

    const handleViewDetails = (refund) => {
        setSelectedRefund(refund);
        setActionType('view');
    };

    const handleCloseModal = () => {
        setSelectedRefund(null);
        setActionType('');
    };

    const handleActionComplete = () => {
        handleCloseModal();
        fetchAllRefunds();
    };

    if (loading && !refunds.length) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="p-8 w-full max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">Refund Management</h1>
                    <p className="text-[var(--admin-text-secondary)] mt-1">Process and track refunds</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex justify-between items-center">
                    <p>{error}</p>
                    <button onClick={clearError} className="hover:bg-red-100 p-1 rounded">✕</button>
                </div>
            )}

            <div className="admin-card">
                <RefundsList
                    refunds={refunds}
                    onUpdateStatus={handleUpdateStatus}
                    onRetry={handleRetry}
                    onViewDetails={handleViewDetails}
                    loading={loading}
                />
            </div>

            {selectedRefund && (
                <RefundModals
                    refund={selectedRefund}
                    actionType={actionType}
                    onClose={handleCloseModal}
                    onActionComplete={handleActionComplete}
                />
            )}
        </div>
    );
};

export default Refunds;