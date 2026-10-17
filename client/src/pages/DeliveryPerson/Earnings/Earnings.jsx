import React, { useEffect, useState } from 'react';
import { useEarningsContext } from '../../../context/delivery_panel/EarningsContext';
import DeliveryLayout from '../../../components/DeliveryPerson/Layout/DeliveryLayout';
import EarningsCards from '../../../components/DeliveryPerson/Earnings/EarningsCards';
import EarningsChart from '../../../components/DeliveryPerson/Earnings/EarningsChart';
import EarningsHistory from '../../../components/DeliveryPerson/Earnings/EarningsHistory';
import './Earnings.css';
import {
    Download,
    AlertCircle,
    X,
    Wallet,
    CheckCircle,
    Clock,
    TrendingUp,
    Package,
    Zap,
    Navigation,
    Star,
    Gift,
    DollarSign,
    Edit,
    Receipt
} from 'lucide-react';

const Earnings = () => {
    const {
        earningsOverview,
        earningsBreakdown,
        earningsSummary,
        chartData,
        transactions,
        bankInfo,
        payoutHistory,
        todayEarnings,
        weeklyEarnings,
        monthlyEarnings,
        periodEarnings,
        loading,
        error,
        fetchAllEarningsData,
        fetchChartData,
        fetchTransactions,
        fetchBankInfo,
        downloadStatement,
        clearError
    } = useEarningsContext();

    const [activeChartFilter, setActiveChartFilter] = useState('7 Days');

    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchAllEarningsData();
                await fetchChartData();
                await fetchTransactions();
                await fetchBankInfo();
            } catch (err) {
                console.error('Error loading earnings data:', err);
            }
        };

        loadData();
    }, []);

    const handleChartFilterChange = (filter) => {
        setActiveChartFilter(filter);

        let startDate = null;
        let endDate = new Date().toISOString().split('T')[0];

        switch (filter) {
            case '7 Days':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case '30 Days':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'This Month':
                const now = new Date();
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                break;
        }

        if (startDate) {
            fetchChartData(startDate, endDate, 'daily');
        }
    };

    const handleDownloadStatement = () => {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        downloadStatement(sevenDaysAgo, today, 'csv', true);
    };

    // Helper function to get icons for breakdown types
    const getIcon = (type) => {
        if (!type) return <DollarSign size={20} />;

        switch (type.toLowerCase()) {
            case 'base_delivery_fee':
            case 'base fee':
            case 'delivery_fees':
                return <Package size={20} />;
            case 'peak_hour_bonus':
            case 'peak bonus':
            case 'peak_bonus':
                return <Zap size={20} />;
            case 'distance_bonus':
            case 'distance bonus':
                return <Navigation size={20} />;
            case 'rating_bonus':
            case 'rating bonus':
                return <Star size={20} />;
            case 'incentives':
            case 'incentives_rewards':
                return <Gift size={20} />;
            default:
                return <DollarSign size={20} />;
        }
    };

    // Prepare breakdown data list
    const breakdownData = earningsBreakdown
        ? Object.entries(earningsBreakdown).map(([key, value]) => ({ type: key, amount: value }))
        : (earningsSummary?.breakdown && earningsSummary.breakdown.length > 0 ? earningsSummary.breakdown : []);

    if (loading && !earningsOverview) {
        return (
            <DeliveryLayout>
                <div className="dp-earnings-page">
                    <div className="dp-page-header">
                        <h2>Earnings & Payouts</h2>
                    </div>
                    <div className="dp-loading-state">
                        <div className="dp-loading-spinner"></div>
                        <p>Loading earnings data...</p>
                    </div>
                </div>
            </DeliveryLayout>
        );
    }

    return (
        <DeliveryLayout>
            <div className="dp-earnings-page">
                <div className="dp-page-header">
                    <h2>Earnings & Payouts</h2>
                    <button
                        className="dp-btn-primary"
                        onClick={handleDownloadStatement}
                        disabled={loading}
                    >
                        <Download size={18} />
                        Download Statement
                    </button>
                </div>

                {error && (
                    <div className="dp-error-alert">
                        <div className="dp-alert-content">
                            <AlertCircle />
                            <span>{error}</span>
                        </div>
                        <button className="dp-alert-close" onClick={clearError}>
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Earnings Overview */}
                <div className="dp-earnings-overview">
                    <div className="dp-balance-card primary">
                        <div className="dp-card-icon">
                            <Wallet />
                        </div>
                        <div className="dp-card-content">
                            <span className="dp-card-label">Total Earnings (This Month)</span>
                            <span className="dp-card-value">
                                ₹{earningsOverview?.month_earnings || 0}
                            </span>
                            <span className="dp-card-info">
                                From {earningsOverview?.month_deliveries || 0} deliveries
                            </span>
                        </div>
                    </div>
                    <div className="dp-balance-card success">
                        <div className="dp-card-icon">
                            <CheckCircle />
                        </div>
                        <div className="dp-card-content">
                            <span className="dp-card-label">Settled Amount</span>
                            <span className="dp-card-value">
                                ₹{earningsOverview?.settled_amount || 0}
                            </span>
                            <span className="dp-card-info">
                                Last settled: {earningsOverview?.last_settlement_date || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="dp-balance-card warning">
                        <div className="dp-card-icon">
                            <Clock />
                        </div>
                        <div className="dp-card-content">
                            <span className="dp-card-label">Pending Settlement</span>
                            <span className="dp-card-value">
                                ₹{earningsOverview?.pending_settlement || 0}
                            </span>
                            <span className="dp-card-info">
                                Next payout: {earningsOverview?.next_payout_date || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="dp-balance-card info">
                        <div className="dp-card-icon">
                            <TrendingUp />
                        </div>
                        <div className="dp-card-content">
                            <span className="dp-card-label">Total Earnings (Lifetime)</span>
                            <span className="dp-card-value">
                                ₹{earningsOverview?.total_earnings || 0}
                            </span>
                            <span className="dp-card-info">
                                All time earnings
                            </span>
                        </div>
                    </div>
                </div>

                {/* Earnings Chart */}
                <EarningsChart
                    chartData={chartData}
                    loading={loading}
                    activeFilter={activeChartFilter}
                    onFilterChange={handleChartFilterChange}
                />

                {/* Earnings Breakdown */}
                {breakdownData && breakdownData.length > 0 && (
                    <div className="dp-earnings-breakdown">
                        <h3>Earnings Breakdown</h3>
                        <div className="dp-breakdown-list">
                            {breakdownData.map((item, index) => (
                                <div className="dp-breakdown-item" key={index}>
                                    <div className="dp-breakdown-label">
                                        {getIcon(item.type)}
                                        <span>{item.label || getLabelForType(item.type)}</span>
                                    </div>
                                    <span className="dp-breakdown-value">₹{item.amount || 0}</span>
                                </div>
                            ))}
                            <div className="dp-breakdown-item total">
                                <div className="dp-breakdown-label">
                                    <strong>Total Earnings</strong>
                                </div>
                                <span className="dp-breakdown-value">
                                    <strong>₹{earningsOverview?.total_earnings || 0}</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction History */}
                <EarningsHistory
                    transactions={transactions}
                    loading={loading}
                />

                {/* Bank Details Card */}
                {bankInfo && (
                    <div className="dp-bank-details-card">
                        <div className="dp-card-header">
                            <h3>Bank Account Details</h3>
                            <button className="dp-btn-text">
                                <Edit size={16} />
                                Edit
                            </button>
                        </div>
                        <div className="dp-bank-info">
                            <div className="dp-info-row">
                                <span className="dp-info-label">Account Holder:</span>
                                <span className="dp-info-value">{bankInfo.account_holder || 'Not set'}</span>
                            </div>
                            <div className="dp-info-row">
                                <span className="dp-info-label">Bank Name:</span>
                                <span className="dp-info-value">{bankInfo.bank_name || 'Not set'}</span>
                            </div>
                            <div className="dp-info-row">
                                <span className="dp-info-label">Account Number:</span>
                                <span className="dp-info-value">
                                    ••••••••{(bankInfo.account_number && typeof bankInfo.account_number === 'string' && bankInfo.account_number.length >= 4)
                                        ? bankInfo.account_number.slice(-4)
                                        : 'XXXX'}
                                </span>
                            </div>
                            <div className="dp-info-row">
                                <span className="dp-info-label">IFSC Code:</span>
                                <span className="dp-info-value">{bankInfo.ifsc_code || 'Not set'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Stats Cards */}
                <EarningsCards
                    todayEarnings={todayEarnings}
                    weeklyEarnings={weeklyEarnings}
                    monthlyEarnings={monthlyEarnings}
                    earningsOverview={earningsOverview}
                    loading={loading}
                />

                {/* Payout History */}
                {payoutHistory && payoutHistory.length > 0 && (
                    <div className="dp-payout-history-section">
                        <h3>Recent Payouts</h3>
                        <div className="dp-data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Orders</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payoutHistory.slice(0, 5).map((payout, index) => (
                                        <tr key={index}>
                                            <td>{payout.date || payout.payout_date || 'N/A'}</td>
                                            <td>{payout.description || 'Weekly Payout'}</td>
                                            <td>{payout.orders_count || payout.order_count || 0} orders</td>
                                            <td>₹{payout.amount || 0}</td>
                                            <td>
                                                <span className="dp-status-badge success">
                                                    {payout.status || 'Settled'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="dp-icon-btn" title="View Receipt">
                                                    <Receipt />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DeliveryLayout>
    );
};

// Helper function to get labels for breakdown types
const getLabelForType = (type) => {
    if (!type) return 'Other Earnings';

    switch (type.toLowerCase()) {
        case 'base_delivery_fee':
        case 'base fee':
            return 'Base Delivery Fee';
        case 'peak_hour_bonus':
        case 'peak bonus':
            return 'Peak Hour Bonus';
        case 'distance_bonus':
        case 'distance bonus':
            return 'Distance Bonus';
        case 'rating_bonus':
        case 'rating bonus':
            return 'Rating Bonus';
        case 'incentives':
        case 'incentives_rewards':
            return 'Incentives & Rewards';
        default:
            return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
};

export default Earnings;
