import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout';
import PaymentOverviewCards from '../../../components/Admin/Payments/PaymentOverviewCards';
import TransactionsTable from '../../../components/Admin/Payments/TransactionsTable';
import FailedPaymentsTable from '../../../components/Admin/Payments/FailedPaymentsTable';
import RefundTrackingTable from '../../../components/Admin/Payments/RefundTrackingTable';
import PaymentDetailsModal from '../../../components/Admin/Payments/PaymentDetailsModal';

import { useAdminPayment } from '../../../context/AdminPaymentContext';
import './Payments.css';

const Payments = () => {
    const {
        payments,
        summary,
        fetchPayments,
        fetchSummary,
        loading,
        updateFilters,
        filters
    } = useAdminPayment();

    const [selectedPayment, setSelectedPayment] = useState(null);

    useEffect(() => {
        fetchPayments();
        fetchSummary();
    }, [fetchPayments, fetchSummary]);

    // Data Transformation for Overview Cards
    const overviewData = useMemo(() => ({
        totalReceived: {
            amount: `$${summary.total_revenue.toFixed(2)}`,
            count: summary.total_success,
            change: "+0% (vs last month)" // Backend calculation for trend pending
        },
        failedPayments: {
            amount: "$0.00", // Backend doesn't send failed amount total yet, assume 0
            count: summary.total_failed,
            change: "0%"
        },
        refundedAmount: {
            amount: "$0.00",
            count: summary.total_refunded,
            change: "0%"
        },
        pendingSettlements: {
            amount: "$0.00",
            count: summary.total_pending
        }
    }), [summary]);

    // Derived lists from CURRENT page - filtering is done on Main Table
    // Side tables show what's on the current page for quick access, 
    // but "View All" switches the main view to show specifically those.
    const failedPayments = payments.filter(p => p.payment_status === 'FAILED');
    const refundedPayments = payments.filter(p => p.payment_status === 'REFUNDED');

    // Handlers
    const handleViewDetails = (payment) => {
        setSelectedPayment(payment);
    };

    const handleCloseModal = () => {
        setSelectedPayment(null);
    };

    const handleViewAllTransactions = () => {
        updateFilters({ status: '' });
        // Scroll to top of table
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const handleViewAllFailures = () => {
        updateFilters({ status: 'FAILED' });
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const handleViewAllRefunds = () => {
        updateFilters({ status: 'REFUNDED' });
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    if (loading && payments.length === 0) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="loading-spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="payments-page-container">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
                    <p className="text-gray-500 mt-1">Manage transactions, refunds, and settlements</p>
                </div>

                {/* Overview Cards */}
                <PaymentOverviewCards data={overviewData} />

                {/* Main Content Grid */}
                <div className="flex flex-col gap-6">

                    {/* Transactions Table (Full Width) */}
                    <div className="relative">
                        {filters.status && (
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                    Filtering by: {filters.status}
                                </span>
                                <button
                                    onClick={handleViewAllTransactions}
                                    className="text-sm text-gray-500 hover:text-gray-800 underline"
                                >
                                    Clear Filter
                                </button>
                            </div>
                        )}
                        <TransactionsTable
                            transactions={payments}
                            onViewDetails={handleViewDetails}
                            onViewAll={handleViewAllTransactions}
                        />
                    </div>

                    {/* Lower Section Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Failed Payments */}
                        <div className="lg:col-span-1">
                            <FailedPaymentsTable
                                failedPayments={failedPayments}
                                onViewAll={handleViewAllFailures}
                            />
                        </div>

                        {/* Refund Tracking */}
                        <div className="lg:col-span-1">
                            <RefundTrackingTable
                                refunds={refundedPayments}
                                onViewAll={handleViewAllRefunds}
                            />
                        </div>

                    </div>
                </div>

                {/* Details Modal */}
                {selectedPayment && (
                    <PaymentDetailsModal
                        payment={selectedPayment}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </AdminLayout>
    );
};

export default Payments;
