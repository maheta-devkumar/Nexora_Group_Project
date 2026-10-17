import React, { useEffect, useState } from 'react';
import { useOrderAdminContext } from '../../../context/OrderAdminContext';
import ReturnsList from '../../../components/Admin/Orders/Returns/Returns';
import ReturnModals from '../../../components/Admin/Orders/Returns/ReturnModals';
import './Returns.css';

const Returns = () => {
    const {
        returns,
        loading,
        error,
        fetchAllReturns,
        clearError
    } = useOrderAdminContext();

    const [selectedReturn, setSelectedReturn] = useState(null);
    const [actionType, setActionType] = useState('');

    useEffect(() => {
        fetchAllReturns();
    }, []);

    const handleApprove = (returnItem) => {
        setSelectedReturn(returnItem);
        setActionType('approve');
    };

    const handleReject = (returnItem) => {
        setSelectedReturn(returnItem);
        setActionType('reject');
    };

    const handleViewItems = (returnItem) => {
        setSelectedReturn(returnItem);
        setActionType('view');
    };

    const handleCloseModal = () => {
        setSelectedReturn(null);
        setActionType('');
    };

    const handleActionComplete = () => {
        handleCloseModal();
        fetchAllReturns();
    };

    if (loading && !returns.length) {
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
                    <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">Return Requests</h1>
                    <p className="text-[var(--admin-text-secondary)] mt-1">Manage customer return requests</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex justify-between items-center">
                    <p>{error}</p>
                    <button onClick={clearError} className="hover:bg-red-100 p-1 rounded">✕</button>
                </div>
            )}

            <div className="admin-card">
                <ReturnsList
                    returns={returns}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onViewItems={handleViewItems}
                    loading={loading}
                />
            </div>

            {selectedReturn && (
                <ReturnModals
                    returnItem={selectedReturn}
                    actionType={actionType}
                    onClose={handleCloseModal}
                    onActionComplete={handleActionComplete}
                />
            )}
        </div>
    );
};

export default Returns;