import React from 'react';
import { Eye, MoreHorizontal, Filter, Search } from 'lucide-react';

const TransactionsTable = ({ transactions, onViewDetails, onViewAll }) => {
    const getStatusBadge = (status) => {
        // ... (existing helper remains same but for conciseness I won't repeat it if I can avoid replaces, but here I'm replacing whole file logic usually better to target blocks)
        switch (status) {
            case 'Success':
            case 'Paid':
            case 'PAID':
                return <span className="admin-badge success">Success</span>;
            case 'Failed':
            case 'FAILED':
                return <span className="admin-badge error">Failed</span>;
            case 'Refunded':
            case 'REFUNDED':
                return <span className="admin-badge info">Refunded</span>;
            default:
                return <span className="admin-badge" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>{status}</span>;
        }
    };

    return (
        <div className="admin-card p-0 overflow-hidden mb-6">
            <div className="p-6 border-b border-[var(--admin-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="section-title mb-1">Recent Transactions</h3>
                    <p className="text-subtle">Manage and monitor latest payment activities</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    {/* Search & Filter UI - kept static for now as requested features were mainly buttons */}
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="admin-input pl-10 w-full sm:w-64"
                        />
                    </div>
                    <button className="admin-btn admin-btn-secondary">
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            <div className="admin-table-container border-0 rounded-none shadow-none">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Method</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((txn) => (
                            <tr key={txn.payment_id}>
                                <td className="font-medium">#{txn.payment_id}</td>
                                <td className="text-[var(--admin-primary)] cursor-pointer hover:underline">#{txn.order_id}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                                            {txn.user_name ? txn.user_name.charAt(0) : 'U'}
                                        </div>
                                        {txn.user_name || 'Guest'}
                                    </div>
                                </td>
                                <td>{txn.payment_method}</td>
                                <td className="font-semibold">${txn.amount_paid.toFixed(2)}</td>
                                <td>{getStatusBadge(txn.payment_status)}</td>
                                <td className="text-[var(--admin-text-secondary)]">
                                    {new Date(txn.payment_date).toLocaleDateString()}
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            className="action-btn-icon"
                                            title="View Details"
                                            onClick={() => onViewDetails(txn)}
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button className="action-btn-icon" title="More Options">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-[var(--admin-border)] flex justify-center bg-gray-50">
                <button
                    onClick={onViewAll}
                    className="text-sm font-medium text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] transition-colors"
                >
                    View All Transactions
                </button>
            </div>
        </div>
    );
};

export default TransactionsTable;
