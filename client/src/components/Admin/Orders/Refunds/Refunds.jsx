import React from 'react';
import StatusBadge from '../common/StatusBadge';
import './Refunds.css';

const RefundsList = ({ refunds, onUpdateStatus, onRetry, onViewDetails, loading }) => {
    if (loading && refunds.length === 0) {
        return (
            <div className="loading-state">
                <div>Loading refunds...</div>
            </div>
        );
    }

    if (refunds.length === 0 && !loading) {
        return (
            <div className="empty-state">
                <div className="text-gray-500">No refunds found.</div>
            </div>
        );
    }

    return (
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Refund ID</th>
                        <th>Return ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {refunds.map((refund) => (
                        <tr key={refund.refund_id}>
                            <td className="font-mono text-[var(--admin-primary)] font-semibold">
                                #{refund.refund_id}
                            </td>
                            <td className="font-mono">
                                #{refund.return_id}
                            </td>
                            <td className="font-bold text-[var(--admin-text-primary)]">
                                ${parseFloat(refund.amount || 0).toFixed(2)}
                            </td>
                            <td>
                                <StatusBadge status={refund.status} type="refund" />
                            </td>
                            <td className="text-sm text-[var(--admin-text-secondary)]">
                                {new Date(refund.created_at).toLocaleDateString()}
                            </td>
                            <td>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onViewDetails(refund)}
                                        className="admin-btn admin-btn-secondary py-1 px-3 text-xs"
                                    >
                                        View
                                    </button>
                                    {refund.status === 'FAILED' && (
                                        <button
                                            onClick={() => onRetry(refund)}
                                            className="admin-btn admin-btn-warning py-1 px-3 text-xs"
                                        >
                                            Retry
                                        </button>
                                    )}
                                    {['PENDING', 'PROCESSING'].includes(refund.status) && (
                                        <button
                                            onClick={() => onUpdateStatus(refund)}
                                            className="admin-btn admin-btn-primary py-1 px-3 text-xs"
                                        >
                                            Update Status
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RefundsList;